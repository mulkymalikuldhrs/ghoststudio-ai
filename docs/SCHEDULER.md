# Scheduler System

**AI Media Intelligence OS — Scheduler Documentation**

---

## Overview

The scheduler is the operational backbone of the AI Media Intelligence OS. It manages all asynchronous operations through a persistent, priority-based job queue with locking semantics for safe concurrent processing. Without the scheduler, every operation would need to complete synchronously, making the system fragile, slow, and unable to operate autonomously.

The scheduler enables the system's autonomous operation: in Full-Auto mode, the daily cycle processes jobs, schedules content, and maintains the system without human intervention. The human operator sets the direction; the scheduler executes it.

---

## Core Concepts

### Job Queue

The job queue is implemented as a database table (`SchedulerJob`) with priority ordering and time-based scheduling. This is not an in-memory queue — it is persistent, surviving restarts and crashes without data loss.

### Priority System

Jobs have a priority from 1 (highest) to 10 (lowest). When multiple jobs are ready to run, the scheduler always picks the highest priority job first. Within the same priority, it picks the oldest job (FIFO).

### Locking

When a worker starts processing a job, it locks the job by setting `lockedBy` (worker ID) and `lockUntil` (expiration timestamp). This prevents concurrent workers from processing the same job. If a worker crashes, the lock eventually expires and the job becomes available again.

### Retry with Exponential Backoff

When a job fails, it is retried with exponential backoff:
- Retry 1: After 1 minute
- Retry 2: After 2 minutes
- Retry 3: After 4 minutes
- Maximum delay: 1 hour

After `maxRetries` (default: 3) failures, the job is moved to the dead letter queue.

### Dead Letter Queue

Jobs that exceed their maximum retry count are moved to `dead_letter` status. These jobs are permanently failed but retained in the database for inspection, debugging, and potential manual retry.

---

## Job Types

| Job Type | Default Priority | Description | Typical Duration |
|----------|-----------------|-------------|-----------------|
| `publish_job` | 3 (High) | Publish content to a platform | 5-15 seconds |
| `draft_job` | 5 (Normal) | Generate a master article draft | 30-60 seconds |
| `rewrite_job` | 5 (Normal) | Apply humanic rewrite | 30-60 seconds |
| `seo_job` | 5 (Normal) | Generate SEO metadata pack | 15-30 seconds |
| `scoring_job` | 5 (Normal) | Score content quality | 15-30 seconds |
| `repurpose_job` | 7 (Low) | Create platform-specific variant | 15-30 seconds |
| `analytics_job` | 7 (Low) | Collect and aggregate analytics | 5-10 seconds |
| `memory_update_job` | 8 (Low) | Update memory from outcomes | 5-10 seconds |
| `retry_job` | 9 (Lowest) | Retry previously failed jobs | Varies |

### Priority Rationale

- **Publish jobs (3)** are high priority because publishing is time-sensitive. If content is scheduled for a specific time, missing that window reduces engagement.
- **Content generation jobs (5)** are normal priority because they are not time-sensitive. A draft generated 5 minutes late is still valuable.
- **Repurpose and analytics jobs (7)** are lower priority because they are derivative. The master content must exist before variants can be created.
- **Memory updates (8)** are lowest priority (above retry) because they are background learning operations that don't directly affect content quality.
- **Retry jobs (9)** are lowest priority because they represent second-chance processing of previously failed work.

---

## Job Lifecycle

```
                    ┌───────────┐
                    │  PENDING  │  Job created, waiting to be processed
                    └─────┬─────┘
                          │ Worker picks up the job
                          ▼
                    ┌───────────┐
                    │  LOCKED   │  Job locked by worker (lockUntil set)
                    └─────┬─────┘
                          │ Worker starts processing
                          ▼
                    ┌───────────┐
                    │  RUNNING  │  Job is being processed
                    └─────┬─────┘
                          │
              ┌───────────┴───────────┐
              │                       │
              ▼                       ▼
        ┌───────────┐          ┌───────────┐
        │ COMPLETED │          │   FAILED   │
        │           │          │  (retry    │
        │           │          │  pending)  │
        └───────────┘          └─────┬─────┘
                                     │ Retry with backoff
                                     ▼
                               ┌───────────┐
                               │  PENDING  │  (retryCount incremented,
                               │           │   nextAttempt set to future)
                               └─────┬─────┘
                                     │ Max retries exceeded
                                     ▼
                               ┌───────────────┐
                               │  DEAD LETTER  │  Permanently failed
                               │               │  (awaiting inspection)
                               └───────────────┘
```

### State Transitions

| From | To | Trigger |
|------|----|---------|
| pending | locked | Worker dequeues job |
| locked | running | Worker begins processing |
| running | completed | Job finishes successfully |
| running | failed | Job throws an error |
| failed | pending | Retry scheduled (retryCount < maxRetries) |
| failed | dead_letter | Max retries exceeded |
| locked | pending | Lock expired (stale lock cleanup) |

---

## API Reference

### enqueueJob

```typescript
async function enqueueJob(
  workspaceId: string,
  jobType: JobType | string,
  payload: JobPayload,
  priority: number = 5
): Promise<{ id: string }>
```

Creates a new job in the queue. Priority is clamped to [1, 10]. The job is immediately available for processing (`nextAttempt` = now).

### dequeueNextJob

```typescript
async function dequeueNextJob(
  workspaceId: string
): Promise<{
  id: string;
  jobType: string;
  payload: JobPayload;
  retryCount: number;
} | null>
```

Finds the highest priority, oldest pending job that is ready to run (nextAttempt ≤ now). Locks the job for 10 minutes. Returns null if no jobs are available.

### processJob

```typescript
async function processJob(
  jobId: string
): Promise<{
  success: boolean;
  result?: JobPayload;
  error?: string;
}>
```

Processes a locked job by dispatching to the appropriate job processor. If the job succeeds, it is marked as completed. If it fails, the retry logic is triggered.

### completeJob

```typescript
async function completeJob(
  jobId: string,
  result?: JobPayload
): Promise<void>
```

Marks a job as completed and stores the result. Clears the lock.

### failJob

```typescript
async function failJob(
  jobId: string,
  error: string
): Promise<void>
```

Handles a failed job. If retries remain, the job is rescheduled with exponential backoff. If max retries are exceeded, the job remains in `failed` status.

### moveToDeadLetter

```typescript
async function moveToDeadLetter(
  jobId: string
): Promise<void>
```

Moves a job to `dead_letter` status. Clears the lock. Dead letter jobs are permanently failed but retained for inspection.

### getQueueStatus

```typescript
async function getQueueStatus(
  workspaceId: string
): Promise<QueueStats>
```

Returns current queue statistics including counts for each status and the oldest pending job timestamp.

### scheduleContent

```typescript
async function scheduleContent(
  input: ScheduleContentInput
): Promise<{
  schedulerJobId: string;
  publishJobId: string;
}>
```

High-level function that creates both a `PublishJob` and a `SchedulerJob` for publishing content at a specific time. Updates the content item status to "scheduled".

### runDailyCycle

```typescript
async function runDailyCycle(
  workspaceId: string
): Promise<{
  jobsProcessed: number;
  jobsFailed: number;
  contentScheduled: number;
}>
```

The autonomous daily cycle. See below for details.

### retryFailedJobs

```typescript
async function retryFailedJobs(
  workspaceId: string
): Promise<{
  retried: number;
  deadLettered: number;
}>
```

Resets all failed jobs with remaining retries to pending status. Moves permanently failed jobs to dead letter.

### purgeOldJobs

```typescript
async function purgeOldJobs(
  workspaceId: string,
  olderThanDays: number = 30
): Promise<{ purged: number }>
```

Deletes completed and dead_letter jobs older than the specified number of days. Helps keep the database size manageable.

---

## Daily Autonomous Cycle

The `runDailyCycle` function is the system's heartbeat in autonomous mode. It runs once per day and performs four critical operations:

### Step 1: Process Pending Jobs

Processes up to 50 pending jobs from the queue. Each job is dequeued, processed, and either completed or failed. This limit prevents the cycle from running indefinitely if the queue is very large.

### Step 2: Schedule Ready Content

Finds all content items with:
- Status: `ready`
- Quality score: ≥ 80

For each qualifying content item, it schedules publishing 2 hours from now on the default platform (WordPress). This ensures that high-quality content is published promptly without human intervention.

### Step 3: Clean Up Stale Locks

Finds all jobs with:
- Status: `locked`
- `lockUntil` < now (lock has expired)

These are jobs where the worker crashed or disconnected before completing processing. They are reset to `pending` status with locks cleared, making them available for reprocessing.

### Step 4: Retry Failed Jobs

Calls `retryFailedJobs` to give failed jobs another chance or move them to dead letter.

---

## Queue Rules

### Rule 1: One Job Per Content Step

Only one job of each type should be active per content item at a time. If a `draft_job` for content X is already pending or running, do not enqueue another `draft_job` for the same content.

### Rule 2: Priority Is Non-Preemptive

Once a job is running, it cannot be interrupted by a higher-priority job. Priority only affects dequeue order.

### Rule 3: Locks Expire After 10 Minutes

If a worker does not complete a job within 10 minutes, the lock expires and another worker can pick it up. This prevents permanently stuck jobs.

### Rule 4: Max 3 Retries

Failed jobs are retried up to 3 times with exponential backoff. After 3 failures, the job is moved to dead letter.

### Rule 5: Dead Letter Jobs Require Manual Intervention

Dead letter jobs are not automatically retried. They must be inspected, the root cause fixed, and then either manually retried or deleted.

### Rule 6: Purge After 30 Days

Completed and dead letter jobs older than 30 days should be purged to prevent database bloat.

---

## Concurrency Model

V1 uses a single-worker model where one process dequeues and processes jobs sequentially. This simplifies the implementation and avoids concurrency issues.

Future versions may support multiple workers with the following considerations:
- Each worker must have a unique `lockedBy` identifier
- The `lockUntil` timestamp prevents permanent locks
- Workers should heartbeat to extend their lock if processing takes longer than expected
- The stale lock cleanup in the daily cycle provides a safety net

---

## Monitoring and Observability

All scheduler actions are logged to the `SystemLog` model with:
- Service: `scheduler`
- Action: Descriptive action name (e.g., `job_enqueued`, `job_completed`, `daily_cycle_started`)
- Metadata: Structured JSON including workspace ID, job ID, job type, and relevant details

Key metrics to monitor:
- **Queue depth**: Number of pending jobs (should stay below 100 in normal operation)
- **Processing rate**: Jobs completed per daily cycle
- **Failure rate**: Percentage of jobs that fail (should stay below 5%)
- **Dead letter rate**: Percentage of jobs that reach dead letter (should stay below 1%)
- **Cycle duration**: How long the daily cycle takes to complete
