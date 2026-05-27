import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { GenerateClipSchema, formatZodErrors } from "@/lib/validators";
import { routeToAgent } from "@/lib/ai-orchestrator";

// POST /api/clip - Generate a clip from a heatmap clip job (wired to clip-agent)
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    const body = await request.json();
    const validation = GenerateClipSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: formatZodErrors(validation.error) },
        { status: 400 }
      );
    }

    const data = validation.data;

    const job = await db.heatmapClipJob.findUnique({
      where: { id: data.jobId },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Heatmap clip job not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (job.userId !== auth.userId) {
      return NextResponse.json(
        { error: "You do not have access to this clip job", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    // Update status to clipping
    await db.heatmapClipJob.update({
      where: { id: data.jobId },
      data: { status: "processing" },
    });

    // Wire to clip-agent for actual clip generation
    try {
      const agentResult = await routeToAgent("clip_job", {
        jobId: data.jobId,
        videoPath: job.videoUrl,
        cropMode: data.cropMode,
        outputRatio: data.outputRatio,
        generateSubtitles: data.generateSubtitles,
        workspaceId: undefined,
      });

      if (agentResult.status === "agent_completed" && agentResult.result) {
        const result = agentResult.result as Record<string, unknown>;
        await db.heatmapClipJob.update({
          where: { id: data.jobId },
          data: {
            status: "completed",
            outputUrl: (result.outputUrl as string) || undefined,
          },
        });

        return NextResponse.json({
          message: "Clip generation completed",
          jobId: data.jobId,
          videoUrl: job.videoUrl,
          outputUrl: result.outputUrl,
          status: "completed",
          agentResult,
        });
      }
    } catch (agentError) {
      // Agent failure — mark as failed
      await db.heatmapClipJob.update({
        where: { id: data.jobId },
        data: {
          status: "failed",
          errorMessage: agentError instanceof Error ? agentError.message : "Clip agent failed",
        },
      });
    }

    return NextResponse.json({
      message: "Clip generation started",
      jobId: data.jobId,
      videoUrl: job.videoUrl,
      status: "processing",
    });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Clip generate error:", error);
    return NextResponse.json(
      { error: "Failed to generate clip" },
      { status: 500 }
    );
  }
}
