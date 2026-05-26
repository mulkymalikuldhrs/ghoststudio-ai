import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requireWorkspaceAccess } from "@/lib/auth-guard";
import { CreateTikTokCampaignSchema, formatZodErrors } from "@/lib/validators";
import { routeToAgent } from "@/lib/ai-orchestrator";

// GET /api/tiktok - List TikTok campaigns
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const status = searchParams.get("status");
    const campaignType = searchParams.get("campaignType");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = { userId: auth.userId };
    if (workspaceId) where.workspaceId = workspaceId;
    if (status) where.status = status;
    if (campaignType) where.campaignType = campaignType;

    const campaigns = await db.tikTokCampaign.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ campaigns });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("TikTok list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch TikTok campaigns" },
      { status: 500 }
    );
  }
}

// POST /api/tiktok - Create TikTok campaign (wired to tiktok-agent)
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    const body = await request.json();
    const validation = CreateTikTokCampaignSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: formatZodErrors(validation.error) },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verify workspace access if workspaceId provided
    if (data.workspaceId) {
      await requireWorkspaceAccess(request, data.workspaceId);
    }

    // Create the campaign in DB
    const campaign = await db.tikTokCampaign.create({
      data: {
        userId: auth.userId,
        workspaceId: data.workspaceId,
        name: data.name,
        campaignType: data.campaignType,
        productId: data.productId,
        productTitle: data.productTitle,
        affiliateLink: data.affiliateLink,
        targetAudience: data.targetAudience,
        hashtags: JSON.stringify(data.hashtags),
        sounds: JSON.stringify(data.sounds),
        contentPillars: JSON.stringify(data.contentPillars),
        postingSchedule: JSON.stringify(data.postingSchedule),
        budgetCents: data.budgetCents,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });

    // Wire to tiktok-agent for content generation and strategy
    try {
      const agentResult = await routeToAgent("tiktok_job", {
        campaignId: campaign.id,
        name: data.name,
        campaignType: data.campaignType,
        productId: data.productId,
        productTitle: data.productTitle,
        targetAudience: data.targetAudience,
        hashtags: data.hashtags,
        sounds: data.sounds,
        contentPillars: data.contentPillars,
        workspaceId: data.workspaceId,
        action: "create_campaign",
      }, data.workspaceId || undefined);

      // Update campaign with agent-generated insights
      if (agentResult.status === "agent_completed" && agentResult.result) {
        const result = agentResult.result as Record<string, unknown>;
        await db.tikTokCampaign.update({
          where: { id: campaign.id },
          data: {
            metricsJson: JSON.stringify({
              suggestedHashtags: result.hashtags,
              suggestedSounds: result.sounds,
              contentStrategy: result.contentStrategy,
              hookSuggestions: result.hooks,
            }),
          },
        });
      }
    } catch (agentError) {
      // Agent failure should not prevent campaign creation
      console.error("TikTok agent error:", agentError);
    }

    const updatedCampaign = await db.tikTokCampaign.findUnique({
      where: { id: campaign.id },
    });

    return NextResponse.json(updatedCampaign, { status: 201 });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("TikTok campaign create error:", error);
    return NextResponse.json(
      { error: "Failed to create TikTok campaign" },
      { status: 500 }
    );
  }
}
