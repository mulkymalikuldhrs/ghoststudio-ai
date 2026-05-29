// ────────────────────────────────────────────────────────────────────────────────
// GET /api/clip/job/[id] — Proxy to Heatmap Clipper /api/job/{id}
// Retrieves the status of a clip generation job
// Includes ownership verification via HeatmapClipJob DB record
// ────────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { getHeatmapClipperUrl, proxyRequest } from "@/lib/python-engines";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    const { id } = await params;

    // Verify the clip job belongs to the authenticated user
    const clipJob = await db.heatmapClipJob.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!clipJob) {
      return NextResponse.json(
        { error: "Clip job not found" },
        { status: 404 }
      );
    }

    if (clipJob.userId !== auth.userId) {
      return NextResponse.json(
        { error: "Forbidden: You do not own this clip job" },
        { status: 403 }
      );
    }

    const targetUrl = `${getHeatmapClipperUrl()}/api/job/${id}`;
    return await proxyRequest(request, targetUrl);
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("[clip/job] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch clip job status" },
      { status: 500 }
    );
  }
}
