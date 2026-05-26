import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";

// GET /api/projects/[id] - Get project by ID
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
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (project.userId !== auth.userId) {
      return NextResponse.json(
        { error: "You do not have access to this project", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Project get error:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete project
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
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (existing.userId !== auth.userId) {
      return NextResponse.json(
        { error: "You do not have access to this project", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    await db.videoProject.delete({ where: { id } });
    return NextResponse.json({ message: "Project deleted" });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Project delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
