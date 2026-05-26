// Strategy Agent — Analyzes analytics + memory to update content strategy
// Generates recommendations for topics, timing, platforms

import { type Agent, type AgentResult, registerAgent, type AgentType } from "./index";
import { generateText } from "@/lib/ai";
import { db } from "@/lib/db";

async function runStrategyAgent(payload: Record<string, unknown>): Promise<AgentResult> {
  const { workspaceId, timeframe, currentGoals } = payload;
  const startTime = Date.now();

  if (!workspaceId) {
    return { success: false, error: "workspaceId is required" };
  }

  try {
    // Gather context from memory and analytics
    const memoryEntries = await db.memoryEntry.findMany({
      where: { workspaceId: workspaceId as string, isActive: true },
      orderBy: { score: "desc" },
      take: 30,
    });

    const recentAnalytics = await db.analyticsEvent.findMany({
      where: { workspaceId: workspaceId as string },
      orderBy: { capturedAt: "desc" },
      take: 30,
    });

    const energyEntries = await db.energyEntry.findMany({
      where: { workspaceId: workspaceId as string },
      orderBy: { fatigueScore: "desc" },
      take: 10,
    });

    const recentContent = await db.contentItem.findMany({
      where: { workspaceId: workspaceId as string },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { title: true, topic: true, status: true, qualityScore: true, humanicScore: true, seoScore: true, trustScore: true, createdAt: true },
    });

    const systemPrompt = `You are a content strategy AI at GhostStudio AI. Analyze the provided data to generate strategic recommendations.

Consider:
1. What topics have performed well (high memory scores) vs. poorly
2. Fatigue/saturation signals from energy entries
3. Recent content performance (quality, humanic, SEO, trust scores)
4. Analytics trends (which platforms, formats, times work best)
5. Gaps in content coverage

Generate:
- Topic recommendations with confidence scores
- Optimal publishing timing
- Platform focus recommendations
- Content format suggestions
- Topics/niches to AVOID (fatigued)
- A strategy update summary

Return ONLY valid JSON:
{
  "recommendations": [
    {"type": "topic", "title": "...", "reason": "...", "confidence": 0.85, "priority": "high"},
    {"type": "timing", "title": "...", "reason": "...", "confidence": 0.9, "priority": "medium"},
    {"type": "platform", "title": "...", "reason": "...", "confidence": 0.75, "priority": "high"}
  ],
  "strategy_update": {
    "focusTopics": ["topic1", "topic2"],
    "avoidTopics": ["topic3"],
    "optimalTimes": ["08:00", "12:00", "18:00"],
    "recommendedPlatforms": ["medium", "twitter"],
    "contentFormatMix": {"long_form": 0.4, "short_form": 0.3, "video": 0.2, "thread": 0.1},
    "summary": "Brief strategic summary"
  }
}`;

    const contextData = {
      memory: memoryEntries.map((e) => ({ category: e.category, key: e.key, value: e.value, score: e.score })),
      analytics: recentAnalytics.map((a) => ({ metricType: a.metricType, metricValue: a.metricValue, platform: a.platform, capturedAt: a.capturedAt })),
      energy: energyEntries.map((e) => ({ category: e.category, topic: e.topic, fatigueScore: e.fatigueScore, publishCount: e.publishCount })),
      recentContent,
      timeframe: timeframe || "next_2_weeks",
      currentGoals: currentGoals || "grow_audience",
    };

    const result = await generateText({
      prompt: `Analyze this workspace data and generate content strategy recommendations:\n\n${JSON.stringify(contextData, null, 2).substring(0, 8000)}`,
      system: systemPrompt,
      temperature: 0.4,
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
        recommendations: (parsed.recommendations as Array<Record<string, unknown>>) || [],
        strategy_update: (parsed.strategy_update as Record<string, unknown>) || {},
      },
      metadata: {
        tokensUsed: result.usage?.totalTokens,
        durationMs: Date.now() - startTime,
      },
    };
  } catch (error) {
    console.error("[StrategyAgent] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Strategy analysis failed",
      metadata: { durationMs: Date.now() - startTime },
    };
  }
}

const strategyAgent: Agent = {
  type: "strategy" as AgentType,
  name: "Strategy Agent",
  description: "Recommends content strategy based on memory, energy levels, and analytics",
  category: "analytics",
  run: runStrategyAgent,
  execute: async (payload) => {
    const result = await runStrategyAgent(payload);
    if (!result.success) throw new Error(result.error || "Strategy agent failed");
    return result.data ?? {};
  },
};

registerAgent(strategyAgent);
export { strategyAgent };
