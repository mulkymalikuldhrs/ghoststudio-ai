import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/projects - List all projects
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") ?? "demo-user";
    const status = searchParams.get("status");

    const where: Record<string, unknown> = { userId };
    if (status) {
      where.status = status;
    }

    const projects = await db.project.findMany({
      where,
      include: { videos: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, prompt, userId, niche } = body;

    if (!title || !userId) {
      return NextResponse.json(
        { error: "Title and userId are required" },
        { status: 400 }
      );
    }

    const project = await db.project.create({
      data: {
        title,
        prompt: prompt ?? null,
        userId,
        status: "draft",
      },
    });

    // Create initial video entry
    await db.video.create({
      data: {
        projectId: project.id,
        status: "pending",
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("Failed to create project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
