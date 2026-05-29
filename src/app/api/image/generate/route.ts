// ────────────────────────────────────────────────────────────────────────────────
// POST /api/image/generate — Proxy to Pixelle Video /api/image/generate
// Generates an AI image from a text prompt
// ────────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { getPixelleVideoUrl, proxyRequest } from "@/lib/python-engines";

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);

    const targetUrl = `${getPixelleVideoUrl()}/api/image/generate`;
    return await proxyRequest(request, targetUrl, { timeoutMs: 30_000 });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("[image/generate] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}
