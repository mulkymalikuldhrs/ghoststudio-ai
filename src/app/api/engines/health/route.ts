// ────────────────────────────────────────────────────────────────────────────────
// GET /api/engines/health — Check health of both Python engines
// Public endpoint — no authentication required
// Returns: { heatmapClipper: { status, url }, pixelleVideo: { status, url } }
// ────────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { getHeatmapClipperUrl, getPixelleVideoUrl } from "@/lib/python-engines";

interface EngineHealth {
  status: "up" | "down";
  url: string;
  responseTimeMs?: number;
  error?: string;
}

async function checkEngineHealth(
  baseUrl: string,
  healthPath: string = "/health"
): Promise<EngineHealth> {
  const start = Date.now();
  try {
    const response = await fetch(`${baseUrl}${healthPath}`, {
      method: "GET",
      signal: AbortSignal.timeout(5_000), // 5s timeout for health checks
    });

    const responseTimeMs = Date.now() - start;

    if (response.ok) {
      return { status: "up", url: baseUrl, responseTimeMs };
    }

    return {
      status: "down",
      url: baseUrl,
      responseTimeMs,
      error: `HTTP ${response.status}`,
    };
  } catch (error) {
    const responseTimeMs = Date.now() - start;
    return {
      status: "down",
      url: baseUrl,
      responseTimeMs,
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

export async function GET() {
  try {
    const [heatmapClipper, pixelleVideo] = await Promise.all([
      checkEngineHealth(getHeatmapClipperUrl(), "/health"),
      checkEngineHealth(getPixelleVideoUrl(), "/health"),
    ]);

    const allUp = heatmapClipper.status === "up" && pixelleVideo.status === "up";

    return NextResponse.json(
      {
        heatmapClipper,
        pixelleVideo,
        overall: allUp ? "healthy" : "degraded",
      },
      { status: allUp ? 200 : 503 }
    );
  } catch (error) {
    console.error("[engines/health] Error:", error);
    return NextResponse.json(
      {
        heatmapClipper: { status: "down" as const, url: getHeatmapClipperUrl(), error: "Health check failed" },
        pixelleVideo: { status: "down" as const, url: getPixelleVideoUrl(), error: "Health check failed" },
        overall: "down",
      },
      { status: 503 }
    );
  }
}
