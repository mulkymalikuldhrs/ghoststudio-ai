import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    name: "GhostStudio AI v2.0",
    version: "2.0.0",
    status: "operational",
    modules: [
      "video-engine",
      "ai-orchestrator",
      "memory-system",
      "content-scoring",
      "energy-system",
      "scheduler",
      "publishers",
      "browser-automation",
      "heatmap-clipper",
    ],
    timestamp: new Date().toISOString(),
  });
}
