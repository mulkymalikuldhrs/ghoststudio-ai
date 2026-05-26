/**
 * Scheduler API
 * GET  /api/scheduler — Get queue status
 * POST /api/scheduler — Enqueue job
 * Body: { workspaceId, jobType, payload, priority? }
 */

import { NextRequest, NextResponse } from 'next/server';
import { enqueueJob, getQueueStatus, type JobType } from '@/lib/scheduler';

// ─── GET: Queue Status ───────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    const status = await getQueueStatus(workspaceId);

    console.log(`[Scheduler API] Queue status for ${workspaceId}: pending=${status.pending}, running=${status.running}`);

    return NextResponse.json({ status });
  } catch (error) {
    console.error('[Scheduler API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to get queue status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// ─── POST: Enqueue Job ───────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId, jobType, payload = {}, priority = 5 } = body;

    if (!workspaceId || !jobType) {
      return NextResponse.json(
        { error: 'workspaceId and jobType are required' },
        { status: 400 }
      );
    }

    // Validate job type
    const validJobTypes: JobType[] = [
      'draft_job',
      'rewrite_job',
      'seo_job',
      'publish_job',
      'analytics_job',
      'retry_job',
      'memory_update_job',
      'repurpose_job',
      'scoring_job',
    ];

    if (!validJobTypes.includes(jobType as JobType)) {
      return NextResponse.json(
        { error: `Invalid jobType. Must be one of: ${validJobTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate priority
    const clampedPriority = Math.max(1, Math.min(10, priority));

    const job = await enqueueJob(
      workspaceId,
      jobType as JobType,
      payload,
      clampedPriority
    );

    console.log(`[Scheduler API] Enqueued ${jobType} job ${job.id} for workspace ${workspaceId} (priority=${clampedPriority})`);

    return NextResponse.json(
      {
        success: true,
        jobId: job.id,
        jobType,
        priority: clampedPriority,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Scheduler API] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to enqueue job', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
