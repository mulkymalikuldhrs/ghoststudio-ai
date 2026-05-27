// ────────────────────────────────────────────────────────────────────────────────
// POST /api/heatmap/scan — Proxy to Heatmap Clipper /api/scan
// Scans a YouTube video heatmap and saves result to HeatmapClipJob
// ────────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { getHeatmapClipperUrl, proxyRequest } from "@/lib/python-engines";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    const targetUrl = `${getHeatmapClipperUrl()}/api/scan`;
    const response = await proxyRequest(request, targetUrl);

    // If the scan succeeded, persist the result to the database
    if (response.ok) {
      try {
        const scanResult = await response.clone().json();

        if (scanResult?.id || scanResult?.jobId) {
          await db.heatmapClipJob.update({
            where: { id: scanResult.id || scanResult.jobId },
            data: {
              status: "analyzing",
              heatmapData: scanResult.heatmapData
                ? JSON.stringify(scanResult.heatmapData)
                : undefined,
              transcriptData: scanResult.transcriptData
                ? JSON.stringify(scanResult.transcriptData)
                : undefined,
              peakScore: scanResult.peakScore ?? 0,
            },
          });
        }
      } catch (dbError) {
        // Database persistence failure should not break the proxy response
        console.error("[heatmap/scan] DB save error:", dbError);
      }
    }

    return response;
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("[heatmap/scan] Error:", error);
    return NextResponse.json(
      { error: "Failed to scan heatmap" },
      { status: 500 }
    );
  }
}
