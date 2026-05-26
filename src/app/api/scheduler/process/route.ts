/**
 * Scheduler Process API
 * POST /api/scheduler/process — Process next job in queue
 * POST with { action: 'retry_failed' }  — Retry all failed jobs
 * POST with { action: 'daily_cycle' }   — Run daily autonomous cycle
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  dequeueNextJob,
  processJob,
  retryFailedJobs,
  runDailyCycle,
} from '@/lib/scheduler';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId, action } = body;

    // ─── Daily Autonomous Cycle ──────────────────────────────────────────
    if (action === 'daily_cycle') {
      if (!workspaceId) {
        return NextResponse.json(
          { error: 'workspaceId is required for daily_cycle' },
          { status: 400 }
        );
      }

      console.log(`[Scheduler Process API] Running daily cycle for workspace ${workspaceId}`);

      const result = await runDailyCycle(workspaceId);

      return NextResponse.json({
        success: true,
        action: 'daily_cycle',
        ...result,
      });
    }

    // ─── Retry Failed Jobs ───────────────────────────────────────────────
    if (action === 'retry_failed') {
      if (!workspaceId) {
        return NextResponse.json(
          { error: 'workspaceId is required for retry_failed' },
          { status: 400 }
        );
      }

      console.log(`[Scheduler Process API] Retrying failed jobs for workspace ${workspaceId}`);

      const result = await retryFailedJobs(workspaceId);

      return NextResponse.json({
        success: true,
        action: 'retry_failed',
        ...result,
      });
    }

    // ─── Process Next Job ────────────────────────────────────────────────
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    const job = await dequeueNextJob(workspaceId);

    if (!job) {
      return NextResponse.json({
        success: true,
        message: 'No pending jobs in queue',
        processed: false,
      });
    }

    console.log(`[Scheduler Process API] Processing job ${job.id} (${job.jobType})`);

    const result = await processJob(job.id);

    return NextResponse.json({
      success: result.success,
      processed: true,
      jobId: job.id,
      jobType: job.jobType,
      result: result.result || null,
      error: result.error || null,
    });
  } catch (error) {
    console.error('[Scheduler Process API] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process scheduler job', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
