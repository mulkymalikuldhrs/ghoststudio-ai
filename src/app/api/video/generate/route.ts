// ────────────────────────────────────────────────────────────────────────────────
// POST /api/video/generate — Proxy to Pixelle Video /api/video/generate/async
// Starts an async video generation job and tracks it in VideoRenderJob
// ────────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { getPixelleVideoUrl, proxyRequest } from "@/lib/python-engines";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    const targetUrl = `${getPixelleVideoUrl()}/api/video/generate/async`;
    const response = await proxyRequest(request, targetUrl, {
      timeoutMs: 120_000,
    });

    // If the video generation job was accepted, track it in VideoRenderJob
    if (response.ok) {
      try {
        const result = await response.clone().json();

        if (result?.task_id || result?.taskId) {
          const taskId = result.task_id || result.taskId;

          // Extract projectId from the original request body if available
          let projectId: string | undefined;
          try {
            const body = await request.clone().json();
            projectId = body?.projectId;
          } catch {
            // No body or invalid JSON — skip
          }

          if (projectId) {
            await db.videoRenderJob.create({
              data: {
                projectId,
                jobType: "full",
                status: "queued",
                engineUrl: targetUrl,
                configJson: JSON.stringify({ taskId }),
              },
            });
          }
        }
      } catch (dbError) {
        console.error("[video/generate] DB track error:", dbError);
      }
    }

    return response;
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("[video/generate] Error:", error);
    return NextResponse.json(
      { error: "Failed to start video generation" },
      { status: 500 }
    );
  }
}
