import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requireWorkspaceAccess } from "@/lib/auth-guard";
import { SubmitReviewSchema, formatZodErrors } from "@/lib/validators";
import { routeToAgent } from "@/lib/ai-orchestrator";

// POST /api/review - Submit content for AI review (wired to review-agent)
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    const body = await request.json();
    const validation = SubmitReviewSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: formatZodErrors(validation.error) },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verify workspace access
    await requireWorkspaceAccess(request, data.workspaceId);

    // Fetch the content item
    const contentItem = await db.contentItem.findUnique({
      where: { id: data.contentId },
      include: { seoData: true, contentTags: true },
    });

    if (!contentItem) {
      return NextResponse.json(
        { error: "Content item not found" },
        { status: 404 }
      );
    }

    if (contentItem.workspaceId !== data.workspaceId) {
      return NextResponse.json(
        { error: "Content item does not belong to this workspace" },
        { status: 403 }
      );
    }

    // Wire to review-agent for AI editorial review
    const agentResult = await routeToAgent("review_job", {
      contentId: data.contentId,
      content: contentItem.masterMarkdown || "",
      title: contentItem.title,
      reviewType: data.reviewType,
      workspaceId: data.workspaceId,
      sourceType: contentItem.sourceType,
      angle: contentItem.angle,
      options: data.options,
    }, data.workspaceId);

    // Process review results
    let reviewResult: Record<string, unknown> = {
      contentId: data.contentId,
      reviewType: data.reviewType,
      status: "completed",
    };

    if (agentResult.status === "agent_completed" && agentResult.result) {
      const result = agentResult.result as Record<string, unknown>;
      reviewResult = {
        ...reviewResult,
        ...result,
        agentExecutionTime: agentResult.executionTime,
      };

      // If review found issues, update content status
      const passed = result.passed as boolean | undefined;
      const qualityScore = result.qualityScore as number | undefined;

      if (passed === false || (qualityScore !== undefined && qualityScore < 60)) {
        await db.contentItem.update({
          where: { id: data.contentId },
          data: {
            status: "editing",
            humanReviewRequired: true,
          },
        });
      }

      // Log the review
      await db.systemLog.create({
        data: {
          service: "ai",
          level: "info",
          action: "content_review",
          message: `AI review completed for: ${contentItem.title} (${data.reviewType})`,
          metadataJson: JSON.stringify({
            contentId: data.contentId,
            reviewType: data.reviewType,
            passed: result.passed,
            qualityScore: result.qualityScore,
            executionTime: agentResult.executionTime,
          }),
        },
      });
    } else {
      reviewResult.status = "failed";
      reviewResult.agentStatus = agentResult.status;
      reviewResult.error = agentResult.error;
    }

    return NextResponse.json(reviewResult);
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Review error:", error);
    return NextResponse.json(
      { error: "Failed to submit content for review" },
      { status: 500 }
    );
  }
}
