// ────────────────────────────────────────────────────────────────────────────────
// POST /api/content/narration — Proxy to Pixelle Video /api/content/narration
// Generates narration script from content
// ────────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { getPixelleVideoUrl, proxyRequest } from "@/lib/python-engines";

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);

    const targetUrl = `${getPixelleVideoUrl()}/api/content/narration`;
    return await proxyRequest(request, targetUrl, { timeoutMs: 30_000 });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("[content/narration] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate narration" },
      { status: 500 }
    );
  }
}
