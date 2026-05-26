import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requireWorkspaceAccess } from "@/lib/auth-guard";
import { RecordAnalyticsSchema, formatZodErrors } from "@/lib/validators";
import { getMemorySystem } from "@/lib/memory-system";

// GET /api/analytics - Get analytics data with comprehensive summary
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const contentId = searchParams.get("contentId");
    const metricType = searchParams.get("metricType");
    const platform = searchParams.get("platform");
    const days = parseInt(searchParams.get("days") || "30");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required" },
        { status: 400 }
      );
    }

    // Verify workspace access
    await requireWorkspaceAccess(request, workspaceId);

    const since = new Date();
    since.setDate(since.getDate() - days);

    const where: Record<string, unknown> = {
      workspaceId,
      capturedAt: { gte: since },
    };
    if (contentId) where.contentId = contentId;
    if (metricType) where.metricType = metricType;
    if (platform) where.platform = platform;

    const [events, contentCount, publishCount, topContent] = await Promise.all([
      db.analyticsEvent.findMany({
        where,
        orderBy: { capturedAt: "desc" },
        take: 500,
      }),
      db.contentItem.count({ where: { workspaceId } }),
      db.publishJob.count({ where: { workspaceId, status: "published" } }),
      db.contentItem.findMany({
        where: { workspaceId, status: "published" },
        orderBy: { qualityScore: "desc" },
        take: 5,
        select: { id: true, title: true, qualityScore: true, publishedAt: true },
      }),
    ]);

    // Aggregate by metric type
    const byMetric: Record<string, { total: number; count: number; avg: number }> = {};
    for (const event of events) {
      if (!byMetric[event.metricType]) {
        byMetric[event.metricType] = { total: 0, count: 0, avg: 0 };
      }
      byMetric[event.metricType].total += event.metricValue;
      byMetric[event.metricType].count += 1;
    }

    for (const key of Object.keys(byMetric)) {
      byMetric[key].avg =
        Math.round((byMetric[key].total / byMetric[key].count) * 100) / 100;
    }

    // Aggregate by platform
    const byPlatform: Record<string, { count: number; totalValue: number }> = {};
    for (const event of events) {
      const p = event.platform || "unknown";
      if (!byPlatform[p]) byPlatform[p] = { count: 0, totalValue: 0 };
      byPlatform[p].count += 1;
      byPlatform[p].totalValue += event.metricValue;
    }

    return NextResponse.json({
      events,
      summary: byMetric,
      byPlatform,
      overview: {
        totalEvents: events.length,
        contentItems: contentCount,
        publishedItems: publishCount,
        topContent,
      },
      period: { days, since },
    });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

// POST /api/analytics - Record analytics event with reinforcement learning
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    const body = await request.json();
    const validation = RecordAnalyticsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: formatZodErrors(validation.error) },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verify workspace access
    await requireWorkspaceAccess(request, data.workspaceId);

    const event = await db.analyticsEvent.create({
      data: {
        workspaceId: data.workspaceId,
        contentId: data.contentId,
        platform: data.platform,
        metricType: data.metricType,
        metricValue: data.metricValue,
        rawPayload: data.rawPayload ? JSON.stringify(data.rawPayload) : null,
        source: data.source,
      },
    });

    // Wire to memory system for reinforcement learning
    // Positive outcomes reinforce successful patterns in the memory system
    try {
      const memorySystem = getMemorySystem(data.workspaceId);

      if (data.contentId && data.metricValue > 0) {
        // Look up content tags and metadata for reinforcement
        const content = await db.contentItem.findUnique({
          where: { id: data.contentId },
          include: { contentTags: true },
        });

        if (content) {
          // Reinforce topic memories
          if (content.topic) {
            await memorySystem.learnFromAnalytics(data.metricType, data.metricValue, {
              category: "topic",
              key: content.topic,
            });
          }

          // Reinforce format/style memories based on metric type
          for (const tag of content.contentTags) {
            await memorySystem.learnFromAnalytics(data.metricType, data.metricValue, {
              category: tag.category,
              key: tag.tag,
            });
          }

          // Reinforce platform-specific memories
          if (data.platform) {
            await memorySystem.learnFromAnalytics(data.metricType, data.metricValue, {
              category: "platform",
              key: data.platform,
            });
          }
        }
      }
    } catch (memoryError) {
      // Memory reinforcement failure should not prevent analytics recording
      console.error("Memory reinforcement failed:", memoryError);
    }

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Analytics create error:", error);
    return NextResponse.json(
      { error: "Failed to record analytics event" },
      { status: 500 }
    );
  }
}
