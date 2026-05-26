import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requireWorkspaceAccess } from "@/lib/auth-guard";
import { UpdateContentSchema, formatZodErrors } from "@/lib/validators";

// GET /api/content/[id] - Get content item by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    const { id } = await params;

    const item = await db.contentItem.findUnique({
      where: { id },
      include: {
        variants: true,
        seoData: true,
        contentTags: true,
        publishJobs: true,
        analyticsEvents: {
          take: 20,
          orderBy: { capturedAt: "desc" },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Content item not found" },
        { status: 404 }
      );
    }

    // Verify workspace access
    await requireWorkspaceAccess(request, item.workspaceId);

    return NextResponse.json(item);
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Content get error:", error);
    return NextResponse.json(
      { error: "Failed to fetch content item" },
      { status: 500 }
    );
  }
}

// PUT /api/content/[id] - Update content item (whitelist only allowed fields)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    const { id } = await params;

    // First fetch the item to verify workspace access
    const existing = await db.contentItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Content item not found" },
        { status: 404 }
      );
    }

    await requireWorkspaceAccess(request, existing.workspaceId);

    const body = await request.json();
    const validation = UpdateContentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: formatZodErrors(validation.error) },
        { status: 400 }
      );
    }

    // Only update whitelisted fields — prevent mass assignment
    const allowedData = validation.data;

    const item = await db.contentItem.update({
      where: { id },
      data: allowedData,
    });

    return NextResponse.json(item);
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Content update error:", error);
    return NextResponse.json(
      { error: "Failed to update content item" },
      { status: 500 }
    );
  }
}

// DELETE /api/content/[id] - Delete content item (verify ownership)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    const { id } = await params;

    const existing = await db.contentItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Content item not found" },
        { status: 404 }
      );
    }

    // Verify workspace access (ownership)
    await requireWorkspaceAccess(request, existing.workspaceId);

    await db.contentItem.delete({ where: { id } });
    return NextResponse.json({ message: "Content item deleted" });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Content delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete content item" },
      { status: 500 }
    );
  }
}
