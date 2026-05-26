/**
 * Analytics API
 * POST /api/analytics — Record analytics event and update memory
 * GET  /api/analytics — Get analytics summary (content performance, publish stats, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { recordOutcome, getMemoryStats, detectPatterns } from '@/lib/memory-system';

// ─── GET: Analytics Summary ──────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const period = searchParams.get('period') || '7d'; // 1d, 7d, 30d, 90d

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    // Calculate date range
    const periodDays: Record<string, number> = {
      '1d': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90,
    };
    const days = periodDays[period] || 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Run all queries in parallel
    const [
      contentStats,
      publishStats,
      metricsByType,
      topContent,
      platformBreakdown,
      recentEvents,
      memoryStats,
    ] = await Promise.all([
      // Content stats by status
      db.contentItem.groupBy({
        by: ['status'],
        where: {
          workspaceId,
          status: { not: 'archived' },
        },
        _count: { status: true },
      }),

      // Publish job stats
      db.publishJob.groupBy({
        by: ['status'],
        where: {
          workspaceId,
          createdAt: { gte: since },
        },
        _count: { status: true },
      }),

      // Metrics by type
      db.analyticsEvent.groupBy({
        by: ['metricType'],
        where: {
          workspaceId,
          capturedAt: { gte: since },
        },
        _sum: { metricValue: true },
        _count: { metricType: true },
        _avg: { metricValue: true },
      }),

      // Top performing content
      db.contentItem.findMany({
        where: {
          workspaceId,
          status: { not: 'archived' },
          qualityScore: { gt: 0 },
        },
        orderBy: { qualityScore: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          qualityScore: true,
          humanicScore: true,
          seoScore: true,
          trustScore: true,
          status: true,
          publishedAt: true,
        },
      }),

      // Platform breakdown
      db.publishJob.groupBy({
        by: ['platform'],
        where: {
          workspaceId,
          createdAt: { gte: since },
        },
        _count: { platform: true },
      }),

      // Recent analytics events
      db.analyticsEvent.findMany({
        where: {
          workspaceId,
          capturedAt: { gte: since },
        },
        orderBy: { capturedAt: 'desc' },
        take: 50,
        include: {
          contentItem: {
            select: { id: true, title: true },
          },
        },
      }),

      // Memory stats
      getMemoryStats(workspaceId),
    ]);

    // Calculate aggregate metrics
    const totalContent = contentStats.reduce((sum, s) => sum + s._count.status, 0);
    const publishedContent = contentStats.find((s) => s.status === 'published')?._count.status || 0;
    const totalPublishJobs = publishStats.reduce((sum, s) => sum + s._count.status, 0);
    const successfulPublishes = publishStats.find((s) => s.status === 'published')?._count.status || 0;

    // Get patterns
    const patterns = await detectPatterns(workspaceId);

    console.log(`[Analytics API] Summary for ${workspaceId}: ${totalContent} content, ${totalPublishJobs} publish jobs (${period})`);

    return NextResponse.json({
      workspaceId,
      period,
      since: since.toISOString(),
      content: {
        total: totalContent,
        byStatus: contentStats.map((s) => ({
          status: s.status,
          count: s._count.status,
        })),
        published: publishedContent,
        topPerforming: topContent,
      },
      publishing: {
        totalJobs: totalPublishJobs,
        successful: successfulPublishes,
        successRate: totalPublishJobs > 0 ? Math.round((successfulPublishes / totalPublishJobs) * 100) : 0,
        byStatus: publishStats.map((s) => ({
          status: s.status,
          count: s._count.status,
        })),
        byPlatform: platformBreakdown.map((p) => ({
          platform: p.platform,
          count: p._count.platform,
        })),
      },
      metrics: metricsByType.map((m) => ({
        type: m.metricType,
        total: m._sum.metricValue || 0,
        count: m._count.metricType,
        average: m._avg.metricValue ? Math.round(m._avg.metricValue * 100) / 100 : 0,
      })),
      recentEvents,
      memory: memoryStats,
      patterns,
    });
  } catch (error) {
    console.error('[Analytics API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to get analytics summary', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// ─── POST: Record Analytics Event ────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      workspaceId,
      contentId,
      platform,
      metricType,
      metricValue,
      rawPayload,
      source = 'api',
    } = body;

    if (!workspaceId || !metricType || metricValue === undefined) {
      return NextResponse.json(
        { error: 'workspaceId, metricType, and metricValue are required' },
        { status: 400 }
      );
    }

    // Create analytics event
    const event = await db.analyticsEvent.create({
      data: {
        workspaceId,
        contentId: contentId || null,
        platform: platform || null,
        metricType,
        metricValue: parseFloat(String(metricValue)),
        rawPayload: rawPayload ? JSON.stringify(rawPayload) : null,
        source,
      },
    });

    // If contentId is provided, update memory based on the outcome
    if (contentId && platform) {
      try {
        await recordOutcome(
          workspaceId,
          contentId,
          platform,
          metricType,
          parseFloat(String(metricValue))
        );
      } catch (memoryError) {
        console.warn('[Analytics API] Memory update failed (non-blocking):', memoryError);
      }
    }

    console.log(`[Analytics API] Recorded ${metricType}=${metricValue} for workspace ${workspaceId}${contentId ? ` content ${contentId}` : ''}`);

    return NextResponse.json(
      {
        success: true,
        eventId: event.id,
        memoryUpdated: !!contentId && !!platform,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Analytics API] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to record analytics event', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
