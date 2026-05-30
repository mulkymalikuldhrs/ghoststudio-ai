// ────────────────────────────────────────────────────────────────────────────────
// POST /api/image/generate — Proxy to Pixelle Video /api/image/generate
// Generates an AI image from a text prompt
// ────────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { getPixelleVideoUrl, proxyRequest } from "@/lib/python-engines";
import { z } from "zod";

const imageGenerateSchema = z.object({
  prompt: z.string().max(5000).optional(),
  width: z.number().min(64).max(4096).optional(),
  height: z.number().min(64).max(4096).optional(),
}).passthrough();

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);

    // Validate body
    const body = await request.json();
    const validation = imageGenerateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request parameters", details: validation.error.issues },
        { status: 400 }
      );
    }

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
