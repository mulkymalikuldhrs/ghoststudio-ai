import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { CreateHeatmapSchema, formatZodErrors } from "@/lib/validators";
import { routeToAgent } from "@/lib/ai-orchestrator";

// GET /api/heatmap - List heatmap clip jobs
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = { userId: auth.userId };
    if (status) where.status = status;

    const jobs = await db.heatmapClipJob.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Heatmap list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch heatmap clip jobs" },
      { status: 500 }
    );
  }
}

// POST /api/heatmap - Create heatmap clip job (wired to heatmap-agent)
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    const body = await request.json();
    const validation = CreateHeatmapSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: formatZodErrors(validation.error) },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Extract YouTube video ID from URL
    const videoIdMatch = data.videoUrl.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    const videoId = videoIdMatch ? videoIdMatch[1] : null;

    const job = await db.heatmapClipJob.create({
      data: {
        userId: auth.userId,
        videoUrl: data.videoUrl,
        videoId,
        resolution: data.resolution,
        outputFormat: data.outputFormat,
        metadataJson: JSON.stringify({
          ...data.metadataJson,
          workspaceId: data.workspaceId,
        }),
        status: "pending",
      },
    });

    // Wire to heatmap-agent for analysis
    try {
      const agentResult = await routeToAgent("heatmap_job", {
        jobId: job.id,
        videoUrl: data.videoUrl,
        videoId,
        workspaceId: data.workspaceId,
      }, data.workspaceId);

      if (agentResult.status === "agent_completed" && agentResult.result) {
        const result = agentResult.result as Record<string, unknown>;
        await db.heatmapClipJob.update({
          where: { id: job.id },
          data: {
            status: "analyzing",
            heatmapData: result.heatmapData ? JSON.stringify(result.heatmapData) : undefined,
            transcriptData: result.transcriptData ? JSON.stringify(result.transcriptData) : undefined,
            peakScore: (result.peakScore as number) || 0,
          },
        });
      }
    } catch (agentError) {
      // Agent failure should not prevent job creation
      console.error("Heatmap agent error:", agentError);
    }

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Heatmap create error:", error);
    return NextResponse.json(
      { error: "Failed to create heatmap clip job" },
      { status: 500 }
    );
  }
}
