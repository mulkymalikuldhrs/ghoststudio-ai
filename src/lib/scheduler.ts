/**
 * Scheduler System — Persistent job queue with priority
 *
 * Manages the lifecycle of all async operations:
 *   - Content generation pipeline steps
 *   - Publishing jobs
 *   - Memory updates
 *   - Analytics collection
 *   - Retry logic with dead letter queue
 *
 * Includes the daily autonomous publishing cycle.
 */

import { db } from '@/lib/db';

// ─── Type Definitions ────────────────────────────────────────────────────────

export type JobType =
  | 'draft_job'
  | 'rewrite_job'
  | 'seo_job'
  | 'publish_job'
  | 'analytics_job'
  | 'retry_job'
  | 'memory_update_job'
  | 'repurpose_job'
  | 'scoring_job';

export type JobStatus =
  | 'pending'
  | 'locked'
  | 'running'
  | 'completed'
  | 'failed'
  | 'dead_letter';

export interface JobPayload {
  [key: string]: unknown;
}

export interface QueueStats {
  pending: number;
  locked: number;
  running: number;
  completed: number;
  failed: number;
  deadLetter: number;
  total: number;
  oldestPending?: Date;
}

export interface ScheduleContentInput {
  workspaceId: string;
  contentId: string;
  platform: string;
  scheduledTime: Date;
  contentVariantId?: string;
  isDryRun?: boolean;
}

// ─── Enqueue Job ─────────────────────────────────────────────────────────────

export async function enqueueJob(
  workspaceId: string,
  jobType: JobType | string,
  payload: JobPayload,
  priority: number = 5
): Promise<{ id: string }> {
  try {
    const job = await db.schedulerJob.create({
      data: {
        workspaceId,
        jobType,
        priority: Math.max(1, Math.min(10, priority)),
        payloadJson: JSON.stringify(payload),
        status: 'pending',
        nextAttempt: new Date(),
        retryCount: 0,
        maxRetries: 3,
      },
    });

    await logSchedulerAction('job_enqueued', workspaceId, job.id, jobType, {
      priority,
      payloadKeys: Object.keys(payload),
    });

    return { id: job.id };
  } catch (error) {
    await logSchedulerError('job_enqueue_failed', workspaceId, '', jobType, error);
    throw new Error(
      `Failed to enqueue job [${jobType}]: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ─── Dequeue Next Job ────────────────────────────────────────────────────────

export async function dequeueNextJob(
  workspaceId: string
): Promise<{
  id: string;
  jobType: string;
  payload: JobPayload;
  retryCount: number;
} | null> {
  try {
    // Find the highest priority pending job that's ready to run
    const jobs = await db.schedulerJob.findMany({
      where: {
        workspaceId,
        status: 'pending',
        nextAttempt: { lte: new Date() },
      },
      orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
      take: 1,
    });

    if (jobs.length === 0) return null;

    const job = jobs[0];

    // Lock the job to prevent concurrent processing
    const lockUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 min lock
    await db.schedulerJob.update({
      where: { id: job.id },
      data: {
        status: 'locked',
        lockedBy: `worker-${Date.now()}`,
        lockUntil,
      },
    });

    await logSchedulerAction('job_dequeued', workspaceId, job.id, job.jobType, {});

    return {
      id: job.id,
      jobType: job.jobType,
      payload: JSON.parse(job.payloadJson || '{}'),
      retryCount: job.retryCount,
    };
  } catch (error) {
    await logSchedulerError('job_dequeue_failed', workspaceId, '', '', error);
    return null;
  }
}

// ─── Process Job ─────────────────────────────────────────────────────────────

export async function processJob(jobId: string): Promise<{
  success: boolean;
  result?: JobPayload;
  error?: string;
}> {
  try {
    // Get and lock the job
    const job = await db.schedulerJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return { success: false, error: 'Job not found' };
    }

    if (job.status !== 'locked') {
      return { success: false, error: `Job is not locked (status: ${job.status})` };
    }

    // Mark as running
    await db.schedulerJob.update({
      where: { id: jobId },
      data: { status: 'running' },
    });

    const payload = JSON.parse(job.payloadJson || '{}');

    // Process based on job type
    let result: JobPayload = {};

    switch (job.jobType as JobType) {
      case 'draft_job':
        result = await processDraftJob(payload);
        break;

      case 'rewrite_job':
        result = await processRewriteJob(payload);
        break;

      case 'seo_job':
        result = await processSeoJob(payload);
        break;

      case 'publish_job':
        result = await processPublishJob(payload);
        break;

      case 'analytics_job':
        result = await processAnalyticsJob(payload);
        break;

      case 'memory_update_job':
        result = await processMemoryUpdateJob(payload);
        break;

      case 'repurpose_job':
        result = await processRepurposeJob(payload);
        break;

      case 'scoring_job':
        result = await processScoringJob(payload);
        break;

      case 'retry_job':
        result = { message: 'Retry job processed' };
        break;

      default:
        result = { message: `Unknown job type: ${job.jobType}` };
    }

    await completeJob(jobId, result);

    return { success: true, result };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown processing error';
    await failJob(jobId, errorMessage);
    return { success: false, error: errorMessage };
  }
}

// ─── Complete Job ────────────────────────────────────────────────────────────

export async function completeJob(
  jobId: string,
  result?: JobPayload
): Promise<void> {
  try {
    await db.schedulerJob.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        resultJson: result ? JSON.stringify(result) : null,
        lockedBy: null,
        lockUntil: null,
      },
    });

    await logSchedulerAction('job_completed', '', jobId, '', { result: !!result });
  } catch (error) {
    await logSchedulerError('job_complete_failed', '', jobId, '', error);
  }
}

// ─── Fail Job ────────────────────────────────────────────────────────────────

export async function failJob(jobId: string, error: string): Promise<void> {
  try {
    const job = await db.schedulerJob.findUnique({
      where: { id: jobId },
    });

    if (!job) return;

    const newRetryCount = job.retryCount + 1;
    const shouldRetry = newRetryCount < job.maxRetries;

    if (shouldRetry) {
      // Schedule retry with exponential backoff
      const delayMs = Math.min(60000 * Math.pow(2, newRetryCount - 1), 3600000); // Max 1 hour
      const nextAttempt = new Date(Date.now() + delayMs);

      await db.schedulerJob.update({
        where: { id: jobId },
        data: {
          status: 'pending',
          retryCount: newRetryCount,
          lastError: error,
          nextAttempt,
          lockedBy: null,
          lockUntil: null,
        },
      });

      await logSchedulerAction('job_retry_scheduled', '', jobId, job.jobType, {
        retryCount: newRetryCount,
        nextAttempt: nextAttempt.toISOString(),
      });
    } else {
      // Max retries reached — move to dead letter
      await db.schedulerJob.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          lastError: error,
          retryCount: newRetryCount,
          lockedBy: null,
          lockUntil: null,
        },
      });

      await logSchedulerError('job_failed_max_retries', '', jobId, job.jobType, error);
    }
  } catch (dbError) {
    await logSchedulerError('job_fail_update_error', '', jobId, '', dbError);
  }
}

// ─── Move to Dead Letter ─────────────────────────────────────────────────────

export async function moveToDeadLetter(jobId: string): Promise<void> {
  try {
    await db.schedulerJob.update({
      where: { id: jobId },
      data: {
        status: 'dead_letter',
        lockedBy: null,
        lockUntil: null,
      },
    });

    await logSchedulerAction('job_moved_to_dead_letter', '', jobId, '', {});
  } catch (error) {
    await logSchedulerError('dead_letter_move_failed', '', jobId, '', error);
    throw new Error(
      `Failed to move job to dead letter: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ─── Get Queue Status ────────────────────────────────────────────────────────

export async function getQueueStatus(workspaceId: string): Promise<QueueStats> {
  try {
    const [pending, locked, running, completed, failed, deadLetter] = await Promise.all([
      db.schedulerJob.count({ where: { workspaceId, status: 'pending' } }),
      db.schedulerJob.count({ where: { workspaceId, status: 'locked' } }),
      db.schedulerJob.count({ where: { workspaceId, status: 'running' } }),
      db.schedulerJob.count({ where: { workspaceId, status: 'completed' } }),
      db.schedulerJob.count({ where: { workspaceId, status: 'failed' } }),
      db.schedulerJob.count({ where: { workspaceId, status: 'dead_letter' } }),
    ]);

    // Get oldest pending job
    const oldestPending = await db.schedulerJob.findFirst({
      where: { workspaceId, status: 'pending' },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    });

    return {
      pending,
      locked,
      running,
      completed,
      failed,
      deadLetter,
      total: pending + locked + running + completed + failed + deadLetter,
      oldestPending: oldestPending?.createdAt,
    };
  } catch (error) {
    await logSchedulerError('queue_status_failed', workspaceId, '', '', error);
    return {
      pending: 0,
      locked: 0,
      running: 0,
      completed: 0,
      failed: 0,
      deadLetter: 0,
      total: 0,
    };
  }
}

// ─── Retry Failed Jobs ───────────────────────────────────────────────────────

export async function retryFailedJobs(workspaceId: string): Promise<{
  retried: number;
  deadLettered: number;
}> {
  let retried = 0;
  let deadLettered = 0;

  try {
    const failedJobs = await db.schedulerJob.findMany({
      where: {
        workspaceId,
        status: 'failed',
      },
    });

    for (const job of failedJobs) {
      if (job.retryCount < job.maxRetries) {
        // Reset for retry
        await db.schedulerJob.update({
          where: { id: job.id },
          data: {
            status: 'pending',
            nextAttempt: new Date(),
            lastError: null,
            lockedBy: null,
            lockUntil: null,
          },
        });
        retried++;
      } else {
        // Move to dead letter
        await moveToDeadLetter(job.id);
        deadLettered++;
      }
    }

    await logSchedulerAction('failed_jobs_retried', workspaceId, '', '', {
      retried,
      deadLettered,
    });
  } catch (error) {
    await logSchedulerError('retry_failed_jobs_error', workspaceId, '', '', error);
  }

  return { retried, deadLettered };
}

// ─── Schedule Content ────────────────────────────────────────────────────────

export async function scheduleContent(input: ScheduleContentInput): Promise<{
  schedulerJobId: string;
  publishJobId: string;
}> {
  const { workspaceId, contentId, platform, scheduledTime, contentVariantId, isDryRun = false } = input;

  try {
    // Create the publish job record
    const publishJob = await db.publishJob.create({
      data: {
        workspaceId,
        contentId,
        contentVariantId,
        platform,
        status: 'queued',
        scheduledTime,
        isDryRun,
        retryCount: 0,
        maxRetries: 3,
      },
    });

    // Enqueue the scheduler job that will trigger the publish
    const schedulerJob = await enqueueJob(
      workspaceId,
      'publish_job',
      {
        publishJobId: publishJob.id,
        contentId,
        contentVariantId,
        platform,
        isDryRun,
      },
      3 // High priority for publish jobs
    );

    // Update the content item status
    await db.contentItem.update({
      where: { id: contentId },
      data: { status: 'scheduled' },
    });

    await logSchedulerAction('content_scheduled', workspaceId, contentId, 'publish_job', {
      platform,
      scheduledTime: scheduledTime.toISOString(),
      publishJobId: publishJob.id,
    });

    return {
      schedulerJobId: schedulerJob.id,
      publishJobId: publishJob.id,
    };
  } catch (error) {
    await logSchedulerError('content_schedule_failed', workspaceId, contentId, 'publish_job', error);
    throw new Error(
      `Failed to schedule content: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ─── Daily Autonomous Cycle ──────────────────────────────────────────────────

export async function runDailyCycle(workspaceId: string): Promise<{
  jobsProcessed: number;
  jobsFailed: number;
  contentScheduled: number;
}> {
  let jobsProcessed = 0;
  let jobsFailed = 0;
  let contentScheduled = 0;

  try {
    await logSchedulerAction('daily_cycle_started', workspaceId, '', '', {});

    // Step 1: Process pending jobs (up to 50 per cycle)
    for (let i = 0; i < 50; i++) {
      const job = await dequeueNextJob(workspaceId);
      if (!job) break;

      const result = await processJob(job.id);
      if (result.success) {
        jobsProcessed++;
      } else {
        jobsFailed++;
      }
    }

    // Step 2: Find content ready for scheduling
    const readyContent = await db.contentItem.findMany({
      where: {
        workspaceId,
        status: 'ready',
        qualityScore: { gte: 80 },
      },
      take: 10,
    });

    for (const content of readyContent) {
      try {
        // Schedule for next available time slot
        const scheduledTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
        await scheduleContent({
          workspaceId,
          contentId: content.id,
          platform: 'wordpress', // Default platform
          scheduledTime,
        });
        contentScheduled++;
      } catch {
        jobsFailed++;
      }
    }

    // Step 3: Clean up stale locks
    await db.schedulerJob.updateMany({
      where: {
        workspaceId,
        status: 'locked',
        lockUntil: { lt: new Date() },
      },
      data: {
        status: 'pending',
        lockedBy: null,
        lockUntil: null,
      },
    });

    // Step 4: Retry failed jobs
    await retryFailedJobs(workspaceId);

    await logSchedulerAction('daily_cycle_completed', workspaceId, '', '', {
      jobsProcessed,
      jobsFailed,
      contentScheduled,
    });
  } catch (error) {
    await logSchedulerError('daily_cycle_failed', workspaceId, '', '', error);
  }

  return { jobsProcessed, jobsFailed, contentScheduled };
}

// ─── Job Processors (Stubs that return structured results) ────────────────────
// Actual processing logic is handled by the ai-orchestrator and other modules

async function processDraftJob(payload: JobPayload): Promise<JobPayload> {
  return {
    status: 'draft_created',
    contentId: payload.contentId || null,
    message: 'Draft generation job processed',
  };
}

async function processRewriteJob(payload: JobPayload): Promise<JobPayload> {
  return {
    status: 'rewrite_completed',
    contentId: payload.contentId || null,
    message: 'Humanic rewrite job processed',
  };
}

async function processSeoJob(payload: JobPayload): Promise<JobPayload> {
  return {
    status: 'seo_completed',
    contentId: payload.contentId || null,
    message: 'SEO generation job processed',
  };
}

async function processPublishJob(payload: JobPayload): Promise<JobPayload> {
  return {
    status: 'publish_processed',
    publishJobId: payload.publishJobId || null,
    platform: payload.platform || null,
    message: 'Publish job processed',
  };
}

async function processAnalyticsJob(payload: JobPayload): Promise<JobPayload> {
  return {
    status: 'analytics_collected',
    contentId: payload.contentId || null,
    message: 'Analytics collection job processed',
  };
}

async function processMemoryUpdateJob(payload: JobPayload): Promise<JobPayload> {
  return {
    status: 'memory_updated',
    category: payload.category || null,
    message: 'Memory update job processed',
  };
}

async function processRepurposeJob(payload: JobPayload): Promise<JobPayload> {
  return {
    status: 'repurpose_completed',
    contentId: payload.contentId || null,
    platform: payload.platform || null,
    message: 'Repurpose job processed',
  };
}

async function processScoringJob(payload: JobPayload): Promise<JobPayload> {
  return {
    status: 'scoring_completed',
    contentId: payload.contentId || null,
    message: 'Content scoring job processed',
  };
}

// ─── Cleanup: Purge Old Completed Jobs ───────────────────────────────────────

export async function purgeOldJobs(
  workspaceId: string,
  olderThanDays: number = 30
): Promise<{ purged: number }> {
  try {
    const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

    const result = await db.schedulerJob.deleteMany({
      where: {
        workspaceId,
        status: { in: ['completed', 'dead_letter'] },
        updatedAt: { lt: cutoff },
      },
    });

    await logSchedulerAction('old_jobs_purged', workspaceId, '', '', {
      purged: result.count,
      olderThanDays,
    });

    return { purged: result.count };
  } catch (error) {
    await logSchedulerError('purge_failed', workspaceId, '', '', error);
    return { purged: 0 };
  }
}

// ─── Logging ─────────────────────────────────────────────────────────────────

async function logSchedulerAction(
  action: string,
  workspaceId: string,
  jobId: string,
  jobType: string,
  metadata: Record<string, unknown>
): Promise<void> {
  try {
    await db.systemLog.create({
      data: {
        service: 'scheduler',
        level: 'info',
        action,
        message: `Scheduler: ${action} ${jobType ? `[${jobType}]` : ''} ${jobId ? `job=${jobId}` : ''}`,
        metadataJson: JSON.stringify({ workspaceId, jobId, jobType, ...metadata }),
      },
    });
  } catch {
    // Logging failure should not break scheduler operations
  }
}

async function logSchedulerError(
  action: string,
  workspaceId: string,
  jobId: string,
  jobType: string,
  error: unknown
): Promise<void> {
  try {
    await db.systemLog.create({
      data: {
        service: 'scheduler',
        level: 'error',
        action,
        message: `Scheduler error: ${action} ${jobType ? `[${jobType}]` : ''} ${jobId ? `job=${jobId}` : ''}`,
        metadataJson: JSON.stringify({
          workspaceId,
          jobId,
          jobType,
          error: error instanceof Error ? error.message : String(error),
        }),
      },
    });
  } catch {
    // Logging failure should not break scheduler operations
  }
}
