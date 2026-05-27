import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { GetTrendsSchema, formatZodErrors } from "@/lib/validators";
import { routeToAgent } from "@/lib/ai-orchestrator";

// GET /api/trends - Get trending topics (wired to trend-agent)
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const niche = searchParams.get("niche") || undefined;
    const platform = searchParams.get("platform") || "general";
    const limit = parseInt(searchParams.get("limit") || "10");

    const validation = GetTrendsSchema.safeParse({ niche, platform, limit });
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: formatZodErrors(validation.error) },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Wire to trend-agent for real trend analysis
    const agentResult = await routeToAgent("trend_job", {
      niche: data.niche || "general",
      platform: data.platform,
      limit: data.limit,
    });

    if (agentResult.status === "agent_completed" && agentResult.result) {
      const result = agentResult.result as Record<string, unknown>;
      return NextResponse.json({
        trends: result.trends || result.data || [],
        niche: data.niche,
        platform: data.platform,
        agentResult,
      });
    }

    // Fallback: return agent status if not completed
    return NextResponse.json({
      trends: [],
      niche: data.niche,
      platform: data.platform,
      agentStatus: agentResult.status,
      message: agentResult.status === "agent_not_available"
        ? "Trend agent is not available"
        : "Trend analysis could not be completed",
    });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Trends error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trending topics" },
      { status: 500 }
    );
  }
}
