import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { CreateVideoSchema, formatZodErrors } from "@/lib/validators";

// GET /api/projects - List projects (legacy compatibility)
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = { userId: auth.userId };
    if (status) where.status = status;

    const projects = await db.videoProject.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ projects });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Projects list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create project (legacy compatibility)
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    const body = await request.json();

    // Validate with a subset of the video schema for legacy compatibility
    const validation = CreateVideoSchema.safeParse({
      ...body,
      userId: auth.userId,
    });
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: formatZodErrors(validation.error) },
        { status: 400 }
      );
    }

    const data = validation.data;

    const project = await db.videoProject.create({
      data: {
        userId: auth.userId,
        workspaceId: data.workspaceId,
        title: data.title,
        prompt: data.prompt,
        niche: data.niche,
        style: data.style,
        aspectRatio: data.aspectRatio,
        voiceId: data.voiceId,
        subtitleStyle: data.subtitleStyle,
        resolution: data.resolution,
        configJson: JSON.stringify(data.configJson),
        status: "draft",
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Project create error:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
