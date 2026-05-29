import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { browserManager } from "@/lib/browser/browser-manager";
import { z } from "zod";

// Validation schema for screenshot request
const screenshotSchema = z.object({
  sessionId: z.string().min(1, "sessionId is required"),
  selector: z.string().optional(),
  fullPage: z.boolean().optional().default(false),
  format: z.enum(["png", "jpeg", "webp"]).optional().default("png"),
  quality: z.number().min(1).max(100).optional(),
});

// POST /api/browser/screenshot — Take a screenshot
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    const body = await request.json();
    const parsed = screenshotSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request parameters",
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const { sessionId, selector, fullPage, format, quality } = parsed.data;

    // Verify session exists and ownership
    if (!browserManager.hasSession(sessionId)) {
      return NextResponse.json(
        { error: `Session not found: ${sessionId}` },
        { status: 404 }
      );
    }

    if (!browserManager.isSessionOwner(sessionId, auth.userId)) {
      return NextResponse.json(
        { error: "Forbidden: You do not own this session" },
        { status: 403 }
      );
    }

    const page = browserManager.getPage(sessionId);

    let screenshotBuf: Buffer;

    if (selector) {
      // Screenshot a specific element
      const element = await page.$(selector);
      if (!element) {
        return NextResponse.json(
          { error: `Element not found: ${selector}` },
          { status: 404 }
        );
      }

      const screenshotOptions: Record<string, unknown> = { type: format };
      if (format === "jpeg" && quality) {
        screenshotOptions.quality = quality;
      }

      screenshotBuf = (await element.screenshot(screenshotOptions)) as Buffer;
    } else {
      // Screenshot the full page or viewport
      const screenshotOptions: Record<string, unknown> = {
        type: format,
        fullPage,
      };
      if (format === "jpeg" && quality) {
        screenshotOptions.quality = quality;
      }

      screenshotBuf = (await page.screenshot(screenshotOptions)) as Buffer;
    }

    const screenshot = Buffer.isBuffer(screenshotBuf)
      ? screenshotBuf.toString("base64")
      : String(screenshotBuf);

    const title = await page.title();
    const viewport = page.viewport();

    return NextResponse.json({
      screenshot,
      url: page.url(),
      title,
      timestamp: new Date().toISOString(),
      viewport: viewport || { width: 1920, height: 1080 },
      format,
      fullPage,
    });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Browser screenshot error:", error);
    return NextResponse.json(
      { error: "Failed to take screenshot" },
      { status: 500 }
    );
  }
}
