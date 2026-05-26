import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { browserManager } from "@/lib/browser/browser-manager";
import { dispatchTest } from "@/lib/browser/testing-runner";
import { z } from "zod";
import type { TestType } from "@/types/browser";

// Validation schema for test request
const testSchema = z.object({
  sessionId: z.string().min(1, "sessionId is required"),
  testType: z.enum([
    "accessibility",
    "visual-regression",
    "link-check",
    "performance",
    "custom",
  ] as const),
  testConfig: z
    .object({
      name: z.string().optional(),
      url: z.string().optional(),
      steps: z
        .array(
          z.object({
            action: z.string(),
            selector: z.string().optional(),
            value: z.string().optional(),
            url: z.string().optional(),
            timeout: z.number().optional(),
          })
        )
        .optional(),
      baselineScreenshot: z.string().optional(),
      options: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),
});

// POST /api/browser/test — Run an E2E test
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
    const parsed = testSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request parameters",
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const { sessionId, testType, testConfig } = parsed.data;

    // Verify session exists
    if (!browserManager.hasSession(sessionId)) {
      return NextResponse.json(
        { error: `Session not found: ${sessionId}` },
        { status: 404 }
      );
    }

    // Build the test config
    const config = testConfig
      ? {
          name: testConfig.name || `${testType} test`,
          type: testType as TestType,
          url: testConfig.url,
          steps: testConfig.steps?.map((s) => ({
            action: s.action as TestType extends "custom"
              ? never
              : "navigate" | "click" | "type" | "scroll" | "select" | "wait",
            selector: s.selector,
            value: s.value,
            url: s.url,
            timeout: s.timeout,
          })),
          baselineScreenshot: testConfig.baselineScreenshot,
          options: testConfig.options,
        }
      : {
          name: `${testType} test`,
          type: testType as TestType,
        };

    // Execute the test
    const result = await dispatchTest(
      sessionId,
      testType as TestType,
      config
    );

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Browser test error:", error);
    return NextResponse.json(
      { error: "Failed to run browser test" },
      { status: 500 }
    );
  }
}
