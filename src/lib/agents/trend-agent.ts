// Trend Agent — Detects and analyzes trending topics for content opportunities
// Uses LLM to evaluate trend relevance, timing, and saturation

import { type Agent, type AgentResult, registerAgent, type AgentType } from "./index";
import { generateText } from "@/lib/ai";
import { db } from "@/lib/db";

async function runTrendAgent(payload: Record<string, unknown>): Promise<AgentResult> {
  const { niche, platform, region, workspaceId, maxTrends } = payload;
  const inputNiche = (niche || "technology") as string;
  const inputPlatform = (platform || "general") as string;
  const startTime = Date.now();

  try {
    // Get workspace memory for context
    let memoryContext = "";
    if (workspaceId) {
      try {
        const topics = await db.memoryEntry.findMany({
          where: { workspaceId: workspaceId as string, category: "topic", isActive: true },
          orderBy: { score: "desc" },
          take: 10,
        });
        const fatigue = await db.energyEntry.findMany({
          where: { workspaceId: workspaceId as string },
          orderBy: { fatigueScore: "desc" },
          take: 5,
        });
        if (topics.length > 0) memoryContext += `\nYour top topics: ${topics.map((t) => t.value).join(", ")}`;
        if (fatigue.length > 0) memoryContext += `\nFatigued topics: ${fatigue.map((f) => f.topic || f.category).join(", ")}`;
      } catch {
        // Memory not available, continue without context
      }
    }

    const systemPrompt = `You are a trend analysis AI at GhostStudio AI. Identify and evaluate trending topics for content creation opportunities.

For each trend, evaluate:
1. Trend Momentum: Is it rising, peaking, or declining?
2. Relevance Score: How relevant to the given niche (0-1)?
3. Saturation Level: How much content already exists? (low/medium/high)
4. Content Window: How long before this trend passes?
5. Opportunity Score: Overall opportunity rating (0-100)

Consider the niche "${inputNiche}" and platform "${inputPlatform}".
${memoryContext}

Return ONLY valid JSON:
{
  "trends": [
    {
      "topic": "Trend topic name",
      "description": "Brief description of the trend",
      "momentum": "rising|peaking|declining|stable",
      "relevanceScore": 0.9,
      "saturation": "low|medium|high",
      "contentWindow": "48 hours|1 week|1 month|evergreen",
      "opportunityScore": 85,
      "suggestedAngle": "How to approach this trend uniquely",
      "relatedKeywords": ["keyword1", "keyword2"],
      "platformFit": ["youtube", "twitter", "linkedin"]
    }
  ],
  "meta": {
    "niche": "${inputNiche}",
    "platform": "${inputPlatform}",
    "analysisDate": "${new Date().toISOString()}",
    "topOpportunity": "Best trend to pursue right now"
  }
}`;

    const result = await generateText({
      prompt: `Identify trending content opportunities for:\n\nNiche: ${inputNiche}\nPlatform: ${inputPlatform}\nRegion: ${region || "global"}\n${memoryContext}\n\nReturn up to ${maxTrends || 8} trends.`,
      system: systemPrompt,
      temperature: 0.6,
      maxTokens: 3000,
    });

    let parsed: Record<string, unknown>;
    try {
      const text = result.text.trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      parsed = {};
    }

    return {
      success: true,
      data: {
        trends: parsed.trends || [],
        meta: parsed.meta || { niche: inputNiche, platform: inputPlatform },
      },
      metadata: {
        tokensUsed: result.usage?.totalTokens,
        durationMs: Date.now() - startTime,
      },
    };
  } catch (error) {
    console.error("[TrendAgent] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Trend analysis failed",
      metadata: { durationMs: Date.now() - startTime },
    };
  }
}

const trendAgent: Agent = {
  type: "trend" as AgentType,
  name: "Trend Agent",
  description: "Detects and analyzes trending topics for content creation opportunities",
  category: "analytics",
  run: runTrendAgent,
  execute: async (payload) => {
    const result = await runTrendAgent(payload);
    if (!result.success) throw new Error(result.error || "Trend agent failed");
    return result.data ?? {};
  },
};

registerAgent(trendAgent);
export { trendAgent };
