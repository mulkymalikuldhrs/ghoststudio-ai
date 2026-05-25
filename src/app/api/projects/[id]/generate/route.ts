import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateScript } from "@/lib/ai";

// POST /api/projects/[id]/generate - Start video generation pipeline
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const existingProject = await db.project.findUnique({ where: { id } });
    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user || existingProject.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update project status
    await db.project.update({
      where: { id },
      data: { status: "generating" },
    });

    // Generate script using AI
    const script = await generateScript(
      existingProject.prompt ?? existingProject.title,
      existingProject.niche,
      existingProject.duration || 30
    );

    // Update video with script
    const videos = await db.video.findMany({
      where: { projectId: id },
    });

    if (videos.length > 0) {
      await db.video.update({
        where: { id: videos[0].id },
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
