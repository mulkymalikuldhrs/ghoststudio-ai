// ────────────────────────────────────────────────────────────────────────────────
// GET /api/resources/templates — Proxy to Pixelle Video /api/resources/templates
// Retrieves available video/image templates
// ────────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { getPixelleVideoUrl, proxyRequest } from "@/lib/python-engines";

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);

    const targetUrl = `${getPixelleVideoUrl()}/api/resources/templates`;
    return await proxyRequest(request, targetUrl);
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("[resources/templates] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}
