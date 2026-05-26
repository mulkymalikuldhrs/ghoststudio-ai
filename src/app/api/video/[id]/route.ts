import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { UpdateVideoSchema, formatZodErrors } from "@/lib/validators";

// GET /api/video/[id] - Get video project by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    const { id } = await params;

    const project = await db.videoProject.findUnique({
      where: { id },
      include: {
        scenes: { orderBy: { order: "asc" } },
        assets: true,
        renderJobs: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Video project not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (project.userId !== auth.userId) {
      return NextResponse.json(
        { error: "You do not have access to this video project", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Video get error:", error);
    return NextResponse.json(
      { error: "Failed to fetch video project" },
      { status: 500 }
    );
  }
}

// PUT /api/video/[id] - Update video project (whitelist only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    const { id } = await params;

    const existing = await db.videoProject.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Video project not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (existing.userId !== auth.userId) {
      return NextResponse.json(
        { error: "You do not have access to this video project", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = UpdateVideoSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: formatZodErrors(validation.error) },
        { status: 400 }
      );
    }

    const allowedData = validation.data;
    // Convert configJson from object to string if present
    const updateData: Record<string, unknown> = { ...allowedData };
    if (allowedData.configJson) {
      updateData.configJson = JSON.stringify(allowedData.configJson);
    }

    const project = await db.videoProject.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(project);
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Video update error:", error);
    return NextResponse.json(
      { error: "Failed to update video project" },
      { status: 500 }
    );
  }
}

// DELETE /api/video/[id] - Delete video project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    const { id } = await params;

    const existing = await db.videoProject.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Video project not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (existing.userId !== auth.userId) {
      return NextResponse.json(
        { error: "You do not have access to this video project", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    await db.videoProject.delete({ where: { id } });
    return NextResponse.json({ message: "Video project deleted" });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Video delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete video project" },
      { status: 500 }
    );
  }
}
