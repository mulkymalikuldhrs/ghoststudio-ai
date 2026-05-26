import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateText, PROMPTS } from "@/lib/ai";

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
    const existingProject = await db.videoProject.findUnique({ where: { id } });
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
    await db.videoProject.update({
      where: { id },
      data: { status: "generating" },
    });

    // Generate script using AI
    const scriptPrompt = PROMPTS.generateScript(
      existingProject.prompt ?? existingProject.title,
      existingProject.niche,
      existingProject.duration || 30
    );
    const scriptResult = await generateText({
      prompt: scriptPrompt,
      system: "You are an expert video script writer. Create engaging, viral video scripts.",
      temperature: 0.7,
      maxTokens: 2000,
    });

    return NextResponse.json({
      message: "Generation started",
      script: scriptResult.text,
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
