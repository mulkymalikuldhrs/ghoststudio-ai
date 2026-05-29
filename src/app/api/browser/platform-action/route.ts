import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { browserManager } from "@/lib/browser/browser-manager";
import { dispatchPlatformAction } from "@/lib/browser/platform-actions";
import { z } from "zod";
import type { PlatformActionType } from "@/types/browser";

// Validation schema for platform action
const platformActionSchema = z.object({
  sessionId: z.string().min(1, "sessionId is required"),
  action: z.enum([
    "wordpress-login",
    "wordpress-create-draft",
    "wordpress-publish",
    "tiktok-login",
    "tiktok-upload",
    "youtube-studio-login",
    "generic-login",
  ] as const),
  params: z.record(z.string(), z.unknown()),
});

// POST /api/browser/platform-action — Execute a pre-built platform action
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    const body = await request.json();
    const parsed = platformActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request parameters",
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const { sessionId, action, params: actionParams } = parsed.data;

    // Verify session exists
    if (!browserManager.hasSession(sessionId)) {
      return NextResponse.json(
        { error: `Session not found: ${sessionId}` },
        { status: 404 }
      );
    }

    // Verify session ownership
    if (!browserManager.isSessionOwner(sessionId, auth.userId)) {
      return NextResponse.json(
        { error: "Forbidden: You do not own this session" },
        { status: 403 }
      );
    }

    // Execute the platform action
    const result = await dispatchPlatformAction(
      sessionId,
      action as PlatformActionType,
      actionParams
    );

    const statusCode = result.success ? 200 : 422;

    return NextResponse.json({ result }, { status: statusCode });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Platform action error:", error);
    return NextResponse.json(
      { error: "Failed to execute platform action" },
      { status: 500 }
    );
  }
}
