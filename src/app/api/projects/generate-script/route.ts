import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/projects/generate-script - Generate a script for a video project
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, prompt, niche, style, language = "en" } = body;

    if (!projectId && !prompt) {
      return NextResponse.json(
        { error: "projectId or prompt is required" },
        { status: 400 }
      );
    }

    let project;
    if (projectId) {
      project = await db.videoProject.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 }
        );
      }

      // Verify ownership
      if (project.userId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Log script generation request
    await db.systemLog.create({
      data: {
        service: "ai",
        level: "info",
        action: "script_generate",
        message: `Script generation requested for: ${project?.title || "new project"}`,
        metadataJson: JSON.stringify({ projectId, prompt: prompt?.substring(0, 100), niche, style }),
      },
    });

    return NextResponse.json({
      message: "Script generation started",
      projectId: projectId || null,
      status: "generating",
    });
  } catch (error) {
    console.error("Script generate error:", error);
    return NextResponse.json(
      { error: "Failed to generate script" },
      { status: 500 }
    );
  }
}
