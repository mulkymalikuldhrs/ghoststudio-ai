// ────────────────────────────────────────────────────────────────────────────────
// GET /api/resources/templates — Proxy to Pixelle Video /api/resources/templates
// Retrieves available video/image templates
// ────────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPixelleVideoUrl, proxyRequest } from "@/lib/python-engines";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

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
