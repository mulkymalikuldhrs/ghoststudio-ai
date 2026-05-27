// ────────────────────────────────────────────────────────────────────────────────
// GET /api/video/task/[id] — Proxy to Pixelle Video /api/tasks/{id}
// Retrieves the status of a video generation task
// ────────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { getPixelleVideoUrl, proxyRequest } from "@/lib/python-engines";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(request);
    const { id } = await params;

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
