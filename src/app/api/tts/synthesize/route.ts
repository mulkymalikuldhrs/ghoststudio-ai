// ────────────────────────────────────────────────────────────────────────────────
// POST /api/tts/synthesize — Proxy to Pixelle Video /api/tts/synthesize
// Synthesizes text-to-speech audio
// ────────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { getPixelleVideoUrl, proxyRequest } from "@/lib/python-engines";
import { z } from "zod";

const ttsSynthesizeSchema = z.object({
  text: z.string().max(10000).optional(),
  voiceId: z.string().max(100).optional(),
}).passthrough();

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);

    // Validate body
    const body = await request.json();
    const validation = ttsSynthesizeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request parameters", details: validation.error.issues },
        { status: 400 }
      );
    }

    const targetUrl = `${getPixelleVideoUrl()}/api/tts/synthesize`;
    return await proxyRequest(request, targetUrl, { timeoutMs: 30_000 });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("[tts/synthesize] Error:", error);
    return NextResponse.json(
      { error: "Failed to synthesize speech" },
      { status: 500 }
    );
  }
}
