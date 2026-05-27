// ────────────────────────────────────────────────────────────────────────────────
// POST /api/clip/generate — Proxy to Heatmap Clipper /api/clip
// Generates a video clip and tracks the job in HeatmapClipJob
// ────────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { getHeatmapClipperUrl, proxyRequest } from "@/lib/python-engines";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    const targetUrl = `${getHeatmapClipperUrl()}/api/clip`;
    const response = await proxyRequest(request, targetUrl, { timeoutMs: 30_000 });

    // If the clip job was accepted, update the HeatmapClipJob in our DB
    if (response.ok) {
      try {
        const body = await request.clone().json();
        const jobId = body?.jobId;

        if (jobId) {
          // Mark the job as processing
          await db.heatmapClipJob.update({
            where: { id: jobId },
            data: { status: "processing" },
          });
        }
      } catch (dbError) {
        console.error("[clip/generate] DB update error:", dbError);
      }
    }

    return response;
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("[clip/generate] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate clip" },
      { status: 500 }
    );
  }
}
