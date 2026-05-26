import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requireWorkspaceAccess } from "@/lib/auth-guard";
import { PublishContentSchema, formatZodErrors } from "@/lib/validators";
import { routeToAgent } from "@/lib/ai-orchestrator";
import { getEnergySystem } from "@/lib/energy-system";
import { getPublisher, publishToPlatform, dryRun } from "@/lib/publishers/index";
import { scheduleContent } from "@/lib/scheduler";

// POST /api/publish - Publish content to a platform
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    const body = await request.json();
    const validation = PublishContentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: formatZodErrors(validation.error) },
        { status: 400 }
      );
    }

    const data = validation.data;

    const contentItem = await db.contentItem.findUnique({
      where: { id: data.contentId },
      include: { variants: true, seoData: true, contentTags: true },
    });

    if (!contentItem) {
      return NextResponse.json(
        { error: "Content item not found" },
        { status: 404 }
      );
    }

    // Verify workspace access
    await requireWorkspaceAccess(request, contentItem.workspaceId);

    // Check energy levels before publishing
    const energySystem = getEnergySystem(contentItem.workspaceId);
    const canPublish = await energySystem.canPublish("publish_saturation", contentItem.topic || undefined);
    if (!canPublish) {
      return NextResponse.json(
        {
          error: "Publishing blocked due to energy fatigue. Consider waiting before publishing.",
          code: "ENERGY_FATIGUED",
          suggestion: "Use the energy endpoint to check current levels and cooldown times.",
        },
        { status: 429 }
      );
    }

    // Route through the publish-agent for processing
    const agentResult = await routeToAgent("publish_job", {
      contentId: data.contentId,
      contentVariantId: data.contentVariantId,
      platform: data.platform,
      workspaceId: contentItem.workspaceId,
      isDryRun: data.isDryRun,
      action: data.action,
      title: contentItem.title,
      body: contentItem.masterMarkdown || "",
      excerpt: contentItem.summary || undefined,
      tags: contentItem.contentTags?.map((t: { tag: string }) => t.tag) || [],
    }, contentItem.workspaceId);

    switch (data.action) {
      case "draft": {
        // Create a draft on the platform (not published)
        if (data.isDryRun) {
          const result = await dryRun(data.platform, {
            title: contentItem.title,
            body: contentItem.masterMarkdown || "",
            excerpt: contentItem.summary || undefined,
          });
          return NextResponse.json({ action: "draft", result, agentResult }, { status: 201 });
        }

        // Create a publish job in draft mode
        const publishJob = await db.publishJob.create({
          data: {
            workspaceId: contentItem.workspaceId,
            contentId: data.contentId,
            contentVariantId: data.contentVariantId,
            platform: data.platform,
            status: "queued",
            scheduledTime: null,
            isDryRun: false,
          },
        });

        return NextResponse.json({
          action: "draft",
          publishJob,
          agentResult,
        }, { status: 201 });
      }

      case "schedule": {
        // Schedule for future publishing
        const scheduledTime = data.scheduledTime ? new Date(data.scheduledTime) : new Date(Date.now() + 2 * 60 * 60 * 1000);

        const scheduleResult = await scheduleContent({
          workspaceId: contentItem.workspaceId,
          contentId: data.contentId,
          platform: data.platform,
          scheduledTime,
          contentVariantId: data.contentVariantId,
          isDryRun: data.isDryRun,
        });

        // Record energy event
        await energySystem.recordPublish("publish_saturation", contentItem.topic || undefined);

        return NextResponse.json({
          action: "schedule",
          ...scheduleResult,
          agentResult,
        }, { status: 201 });
      }

      case "publish":
      default: {
        // Publish immediately
        const publishJob = await db.publishJob.create({
          data: {
            workspaceId: contentItem.workspaceId,
            contentId: data.contentId,
            contentVariantId: data.contentVariantId,
            platform: data.platform,
            status: "processing",
            scheduledTime: null,
            isDryRun: data.isDryRun,
          },
        });

        if (data.isDryRun) {
          const result = await dryRun(data.platform, {
            title: contentItem.title,
            body: contentItem.masterMarkdown || "",
            excerpt: contentItem.summary || undefined,
          });
          await db.publishJob.update({
            where: { id: publishJob.id },
            data: { status: "published", responsePayload: JSON.stringify(result) },
          });
        } else {
          // Attempt actual publishing
          try {
            const result = await publishToPlatform(auth.userId, data.platform, {
              title: contentItem.title,
              body: contentItem.masterMarkdown || "",
              excerpt: contentItem.summary || undefined,
            });

            if (result.success) {
              await db.publishJob.update({
                where: { id: publishJob.id },
                data: {
                  status: "published",
                  publishedTime: new Date(),
                  responsePayload: JSON.stringify(result.responsePayload || {}),
                },
              });
              await db.contentItem.update({
                where: { id: data.contentId },
                data: { status: "published", publishedAt: new Date() },
              });
              // Record energy event
              await energySystem.recordPublish("publish_saturation", contentItem.topic || undefined);
            } else {
              await db.publishJob.update({
                where: { id: publishJob.id },
                data: {
                  status: "failed",
                  lastError: result.error,
                },
              });
            }
          } catch (publishError) {
            await db.publishJob.update({
              where: { id: publishJob.id },
              data: {
                status: "failed",
                lastError: publishError instanceof Error ? publishError.message : "Unknown publish error",
              },
            });
          }
        }

        const updatedJob = await db.publishJob.findUnique({ where: { id: publishJob.id } });

        return NextResponse.json({
          action: "publish",
          publishJob: updatedJob,
          agentResult,
        }, { status: 201 });
      }
    }
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Publish error:", error);
    return NextResponse.json(
      { error: "Failed to create publish job" },
      { status: 500 }
    );
  }
}
