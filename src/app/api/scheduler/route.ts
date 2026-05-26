import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requireWorkspaceAccess } from "@/lib/auth-guard";
import { CreateSchedulerJobSchema, formatZodErrors } from "@/lib/validators";
import { enqueueJob, getQueueStatus } from "@/lib/scheduler";

// GET /api/scheduler - List scheduler jobs
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const status = searchParams.get("status");
    const jobType = searchParams.get("jobType");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required" },
        { status: 400 }
      );
    }

    // Verify workspace access
    await requireWorkspaceAccess(request, workspaceId);

    const where: Record<string, unknown> = { workspaceId };
    if (status) where.status = status;
    if (jobType) where.jobType = jobType;

    const [jobs, queueStatus] = await Promise.all([
      db.schedulerJob.findMany({
        where,
        orderBy: [{ priority: "asc" }, { nextAttempt: "asc" }],
        take: limit,
      }),
      getQueueStatus(workspaceId),
    ]);

    return NextResponse.json({ jobs, queueStatus });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Scheduler list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch scheduler jobs" },
      { status: 500 }
    );
  }
}

// POST /api/scheduler - Create scheduler job
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    const body = await request.json();
    const validation = CreateSchedulerJobSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: formatZodErrors(validation.error) },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verify workspace access
    await requireWorkspaceAccess(request, data.workspaceId);

    const job = await enqueueJob(
      data.workspaceId,
      data.jobType,
      data.payloadJson,
      data.priority
    );

    // If nextAttempt was specified, update it
    if (data.nextAttempt) {
      await db.schedulerJob.update({
        where: { id: job.id },
        data: { nextAttempt: new Date(data.nextAttempt) },
      });
    }

    const createdJob = await db.schedulerJob.findUnique({ where: { id: job.id } });

    return NextResponse.json(createdJob, { status: 201 });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Scheduler create error:", error);
    return NextResponse.json(
      { error: "Failed to create scheduler job" },
      { status: 500 }
    );
  }
}
