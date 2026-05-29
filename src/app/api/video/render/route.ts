import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { db } from "@/lib/db";

// POST /api/video/render - Start a render job
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    const body = await request.json();
    const { projectId, jobType = "full", configJson = {} } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    const project = await db.videoProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Video project not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (project.userId !== auth.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const renderJob = await db.videoRenderJob.create({
      data: {
        projectId,
        jobType,
        status: "queued",
        configJson: JSON.stringify(configJson),
      },
    });

    // Update project status
    await db.videoProject.update({
      where: { id: projectId },
      data: { status: "rendering" },
    });

    return NextResponse.json(renderJob, { status: 201 });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Video render error:", error);
    return NextResponse.json(
      { error: "Failed to create render job" },
      { status: 500 }
    );
  }
}
