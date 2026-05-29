import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { browserManager } from "@/lib/browser/browser-manager";
import { dispatchInteraction } from "@/lib/browser/page-interactions";
import { z } from "zod";
import type { BrowserAction } from "@/types/browser";

// Validation schema for browser interaction
const interactSchema = z.object({
  sessionId: z.string().min(1, "sessionId is required"),
  action: z.enum([
    "navigate",
    "click",
    "type",
    "scroll",
    "select",
    "wait",
    "evaluate",
    "getContent",
    "getTitle",
    "getUrl",
    "waitForNavigation",
    "goBack",
    "goForward",
    "refresh",
    "hover",
    "screenshot",
  ] as const),
  // Optional parameters depending on action
  url: z.string().optional(),
  selector: z.string().optional(),
  value: z.string().optional(),
  expression: z.string().optional(),
  direction: z.enum(["up", "down", "left", "right"]).optional(),
  amount: z.number().optional(),
  delay: z.number().optional(),
  clear: z.boolean().optional(),
  timeout: z.number().optional(),
  waitUntil: z
    .enum(["load", "domcontentloaded", "networkidle0", "networkidle2"])
    .optional(),
  visible: z.boolean().optional(),
});

// POST /api/browser/interact — Execute a browser interaction
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    const body = await request.json();
    const parsed = interactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request parameters",
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const { sessionId, action, ...params } = parsed.data;

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

    // Execute the interaction
    const result = await dispatchInteraction(
      sessionId,
      action as BrowserAction,
      params
    );

    return NextResponse.json({ result });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Browser interact error:", error);
    return NextResponse.json(
      { error: "Failed to execute browser interaction" },
      { status: 500 }
    );
  }
}
