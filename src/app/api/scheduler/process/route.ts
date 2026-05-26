import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireWorkspaceAccess } from "@/lib/auth-guard";
import { ProcessSchedulerSchema, formatZodErrors } from "@/lib/validators";
import {
  processJob,
  dequeueNextJob,
  retryFailedJobs,
  runDailyCycle,
} from "@/lib/scheduler";
import { routeToAgent } from "@/lib/ai-orchestrator";
import { db } from "@/lib/db";

// POST /api/scheduler/process - Process scheduler jobs
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    const body = await request.json();
    const validation = ProcessSchedulerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: formatZodErrors(validation.error) },
        { status: 400 }
      );
    }

    const { action, workspaceId, jobId } = validation.data;

    // Verify workspace access
    await requireWorkspaceAccess(request, workspaceId);

    switch (action) {
      case "process": {
        // Process a specific job or the next available job
        if (jobId) {
          // Lock the job first
          const job = await db.schedulerJob.findUnique({ where: { id: jobId } });
          if (!job) {
            return NextResponse.json(
              { error: "Job not found" },
              { status: 404 }
            );
          }
          if (job.workspaceId !== workspaceId) {
            return NextResponse.json(
              { error: "Job does not belong to this workspace" },
              { status: 403 }
            );
          }

          // Lock the job
          const lockUntil = new Date(Date.now() + 10 * 60 * 1000);
          await db.schedulerJob.update({
            where: { id: jobId },
            data: {
              status: "locked",
              lockedBy: `worker-${Date.now()}`,
              lockUntil,
            },
          });

          const result = await processJob(jobId);

          return NextResponse.json({
            message: result.success ? "Job processed successfully" : "Job processing failed",
            jobId,
            result,
          });
        } else {
          // Dequeue and process the next available job
          const job = await dequeueNextJob(workspaceId);
          if (!job) {
            return NextResponse.json({ message: "No jobs to process" });
          }

          const result = await processJob(job.id);

          return NextResponse.json({
            message: result.success ? "Job processed successfully" : "Job processing failed",
            jobId: job.id,
            jobType: job.jobType,
            result,
          });
        }
      }

      case "retry_failed": {
        // Retry all failed jobs in the workspace
        const retryResult = await retryFailedJobs(workspaceId);

        return NextResponse.json({
          message: "Failed jobs retry completed",
          ...retryResult,
        });
      }

      case "daily_cycle": {
        // Run the full daily autonomous cycle
        const cycleResult = await runDailyCycle(workspaceId);

        return NextResponse.json({
          message: "Daily cycle completed",
          ...cycleResult,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unsupported action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Scheduler process error:", error);
    return NextResponse.json(
      { error: "Failed to process scheduler job" },
      { status: 500 }
    );
  }
}
