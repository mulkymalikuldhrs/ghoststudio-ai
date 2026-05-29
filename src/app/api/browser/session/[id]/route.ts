import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { browserManager } from "@/lib/browser/browser-manager";
import { livePreview } from "@/lib/browser/live-preview";

// GET /api/browser/session/[id] — Get session status
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(_request);

    const { id } = await params;

    // Verify session ownership
    if (!browserManager.isSessionOwner(id, auth.userId)) {
      return NextResponse.json(
        { error: "Forbidden: You do not own this session" },
        { status: 403 }
      );
    }

    const sessionStatus = await browserManager.getSessionStatus(id);

    if (!sessionStatus) {
      return NextResponse.json(
        { error: `Session not found: ${id}` },
        { status: 404 }
      );
    }

    // Include streaming status
    const isStreaming = livePreview.isStreaming(id);
    const lastFrame = livePreview.getLastFrame(id);

    return NextResponse.json({
      session: sessionStatus,
      streaming: {
        active: isStreaming,
        hasLastFrame: !!lastFrame,
      },
    });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Session status error:", error);
    return NextResponse.json(
      { error: "Failed to get session status" },
      { status: 500 }
    );
  }
}

// DELETE /api/browser/session/[id] — Close session
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(_request);

    const { id } = await params;

    // Verify session ownership
    if (!browserManager.isSessionOwner(id, auth.userId)) {
      return NextResponse.json(
        { error: "Forbidden: You do not own this session" },
        { status: 403 }
      );
    }

    // Stop streaming if active
    if (livePreview.isStreaming(id)) {
      livePreview.stopStreaming(id);
    }

    // Close the session
    const closed = await browserManager.closeSession(id);

    if (!closed) {
      return NextResponse.json(
        { error: `Session not found: ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: `Session ${id} closed successfully`,
    });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Session close error:", error);
    return NextResponse.json(
      { error: "Failed to close session" },
      { status: 500 }
    );
  }
}
