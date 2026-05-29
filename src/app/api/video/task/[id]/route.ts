// ────────────────────────────────────────────────────────────────────────────────
// GET /api/video/task/[id] — Proxy to Pixelle Video /api/tasks/{id}
// Retrieves the status of a video generation task
// Includes ownership verification via VideoProject DB record
// ────────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { getPixelleVideoUrl, proxyRequest } from "@/lib/python-engines";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    const { id } = await params;

    // Verify the video task belongs to the authenticated user
    // Video tasks are tracked via VideoRenderJob which links to VideoProject
    const renderJob = await db.videoRenderJob.findUnique({
      where: { id },
      select: { project: { select: { userId: true } } },
    });

    if (!renderJob) {
      return NextResponse.json(
        { error: "Video task not found" },
        { status: 404 }
      );
    }

    if (renderJob.project.userId !== auth.userId) {
      return NextResponse.json(
        { error: "Forbidden: You do not own this video task" },
        { status: 403 }
      );
    }

    const targetUrl = `${getPixelleVideoUrl()}/api/tasks/${id}`;
    return await proxyRequest(request, targetUrl);
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("[video/task] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch video task status" },
      { status: 500 }
    );
  }
}
