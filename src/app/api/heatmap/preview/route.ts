// ────────────────────────────────────────────────────────────────────────────────
// POST /api/heatmap/preview — Proxy to Heatmap Clipper /api/preview
// Generates a heatmap preview image for a YouTube video
// ────────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { getHeatmapClipperUrl, proxyRequest } from "@/lib/python-engines";

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);

    const targetUrl = `${getHeatmapClipperUrl()}/api/preview`;
    return await proxyRequest(request, targetUrl);
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("[heatmap/preview] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate heatmap preview" },
      { status: 500 }
    );
  }
}
