import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateScript } from "@/lib/ai";

// POST /api/projects/[id]/generate - Start video generation pipeline
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await db.project.findUnique({
      where: { id },
      include: { videos: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Update project status
    await db.project.update({
      where: { id },
      data: { status: "generating" },
    });

    // Generate script using AI
    const script = await generateScript(
      project.prompt ?? project.title,
      "general",
      project.duration || 30
    );

    // Update video with script
    if (project.videos.length > 0) {
      await db.video.update({
        where: { id: project.videos[0].id },
        data: {
          script,
          status: "rendering",
          renderProgress: 0,
        },
      });
    }

    return NextResponse.json({
      message: "Generation started",
      script,
      projectId: id,
    });
  } catch (error) {
    console.error("Failed to generate video:", error);
    return NextResponse.json(
      { error: "Failed to generate video" },
      { status: 500 }
    );
  }
}
