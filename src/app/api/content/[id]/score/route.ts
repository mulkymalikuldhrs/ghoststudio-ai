import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requireWorkspaceAccess } from "@/lib/auth-guard";
import { ScoreContentSchema, formatZodErrors } from "@/lib/validators";
import { routeToAgent } from "@/lib/ai-orchestrator";

// POST /api/content/[id]/score - Score content using 4-dimension scoring
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    const { id } = await params;

    const body = await request.json();
    const validation = ScoreContentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: formatZodErrors(validation.error) },
        { status: 400 }
      );
    }

    const { dimensions, useAgent } = validation.data;

    const contentItem = await db.contentItem.findUnique({
      where: { id },
    });

    if (!contentItem) {
      return NextResponse.json(
        { error: "Content item not found" },
        { status: 404 }
      );
    }

    // Verify workspace access
    await requireWorkspaceAccess(request, contentItem.workspaceId);

    let qualityScore: number;
    let humanicScore: number;
    let seoScore: number;
    let trustScore: number;

    if (useAgent) {
      // Route to the scoring agent via the AI orchestrator
      const agentResult = await routeToAgent("scoring_job", {
        contentId: id,
        content: contentItem.masterMarkdown || "",
        title: contentItem.title,
        sourceType: contentItem.sourceType,
        sourceNotes: contentItem.sourceNotes,
        angle: contentItem.angle,
        seoData: null,
        workspaceId: contentItem.workspaceId,
      }, contentItem.workspaceId);

      if (agentResult.status === "agent_completed" && agentResult.result) {
        const result = agentResult.result as Record<string, unknown>;
        const scores = result.scores as Record<string, number> | undefined;
        qualityScore = scores?.quality ?? dimensions?.quality ?? contentItem.qualityScore;
        humanicScore = scores?.humanic ?? dimensions?.humanic ?? contentItem.humanicScore;
        seoScore = scores?.seo ?? dimensions?.seo ?? contentItem.seoScore;
        trustScore = scores?.trust ?? dimensions?.trust ?? contentItem.trustScore;
      } else {
        // Fallback to provided dimensions or existing scores
        qualityScore = dimensions?.quality ?? contentItem.qualityScore;
        humanicScore = dimensions?.humanic ?? contentItem.humanicScore;
        seoScore = dimensions?.seo ?? contentItem.seoScore;
        trustScore = dimensions?.trust ?? contentItem.trustScore;
      }
    } else {
      // Use provided dimensions or existing scores
      qualityScore = dimensions?.quality ?? contentItem.qualityScore;
      humanicScore = dimensions?.humanic ?? contentItem.humanicScore;
      seoScore = dimensions?.seo ?? contentItem.seoScore;
      trustScore = dimensions?.trust ?? contentItem.trustScore;
    }

    // Weighted composite matching ContentScorer weights: quality=0.30, humanic=0.30, seo=0.25, trust=0.15
    const compositeScore = Math.round(
      qualityScore * 0.30 + humanicScore * 0.30 + seoScore * 0.25 + trustScore * 0.15
    );

    // Determine action based on score
    let action: string;
    let newStatus: string;
    let humanReviewRequired: boolean;

    if (compositeScore >= 80) {
      action = "auto_schedule";
      newStatus = "ready";
      humanReviewRequired = false;
    } else if (compositeScore >= 60) {
      action = "human_review";
      newStatus = "editing";
      humanReviewRequired = true;
    } else {
      action = "reject_rewrite";
      newStatus = "editing";
      humanReviewRequired = true;
    }

    await db.contentItem.update({
      where: { id },
      data: {
        qualityScore,
        humanicScore,
        seoScore,
        trustScore,
        humanReviewRequired,
        status: newStatus,
      },
    });

    return NextResponse.json({
      contentId: id,
      scores: {
        quality: qualityScore,
        humanic: humanicScore,
        seo: seoScore,
        trust: trustScore,
        composite: compositeScore,
      },
      humanReviewRequired,
      action,
      previousStatus: contentItem.status,
      newStatus,
    });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Content score error:", error);
    return NextResponse.json(
      { error: "Failed to score content" },
      { status: 500 }
    );
  }
}
