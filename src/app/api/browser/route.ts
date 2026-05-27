import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { browserManager } from "@/lib/browser/browser-manager";
import { z } from "zod";

// Validation schema for creating a browser session
const createSessionSchema = z.object({
  platform: z.string().optional(),
  headless: z.boolean().optional().default(true),
  viewport: z
    .object({
      width: z.number().min(320).max(3840).optional().default(1920),
      height: z.number().min(240).max(2160).optional().default(1080),
    })
    .optional()
    .default({ width: 1920, height: 1080 }),
  userAgent: z.string().optional(),
});

// POST /api/browser — Create a new browser session
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = createSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request parameters",
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const options = parsed.data;
    const userId = (session.user as { id?: string })?.id || session.user?.email || undefined;
    const browserSession = await browserManager.createSession({ ...options, userId });

    return NextResponse.json(
      {
        session: browserSession,
        message: "Browser session created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Browser session creation error:", error);

    if (
      error instanceof Error &&
      error.message.includes("Maximum browser instances")
    ) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }

    return NextResponse.json(
      { error: "Failed to create browser session" },
      { status: 500 }
    );
  }
}

// GET /api/browser — List all active browser sessions
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const userId = (session.user as { id?: string })?.id || session.user?.email;
    // Only list sessions owned by this user
    const status = browserManager.getStatus();
    const userSessions = status.sessions.filter(
      (s) => !s.userId || s.userId === userId
    );

    return NextResponse.json({
      sessions: userSessions,
      activeSessions: userSessions.length,
      maxInstances: status.maxInstances,
      idleTimeoutMs: status.idleTimeoutMs,
      uptime: status.uptime,
    });
  } catch (error) {
    console.error("Browser sessions list error:", error);
    return NextResponse.json(
      { error: "Failed to list browser sessions" },
      { status: 500 }
    );
  }
}
