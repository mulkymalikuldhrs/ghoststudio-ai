import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requireWorkspaceAccess } from "@/lib/auth-guard";
import { CreateVideoSchema, formatZodErrors } from "@/lib/validators";

// GET /api/video - List video projects
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = { userId: auth.userId };
    if (workspaceId) {
      // Verify workspace access if filtering by workspace
      await requireWorkspaceAccess(request, workspaceId);
      where.workspaceId = workspaceId;
    }
    if (status) where.status = status;

    const projects = await db.videoProject.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: limit,
      include: {
        scenes: { orderBy: { order: "asc" } },
        _count: { select: { assets: true, renderJobs: true } },
      },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Video list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch video projects" },
      { status: 500 }
    );
  }
}

// POST /api/video - Create video project
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    const body = await request.json();
    const validation = CreateVideoSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: formatZodErrors(validation.error) },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verify workspace access if workspaceId provided
    if (data.workspaceId) {
      await requireWorkspaceAccess(request, data.workspaceId);
    }

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
    console.error("Video create error:", error);
    return NextResponse.json(
      { error: "Failed to create video project" },
      { status: 500 }
    );
  }
}
