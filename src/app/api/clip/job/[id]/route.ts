// ────────────────────────────────────────────────────────────────────────────────
// GET /api/clip/job/[id] — Proxy to Heatmap Clipper /api/job/{id}
// Retrieves the status of a clip generation job
// ────────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { getHeatmapClipperUrl, proxyRequest } from "@/lib/python-engines";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(request);
    const { id } = await params;

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
