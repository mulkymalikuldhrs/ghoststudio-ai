// Memory Agent — Store, retrieve, search memory entries with pattern detection
// Reinforcement learning score updates

import { type Agent, type AgentResult, registerAgent, type AgentType } from "./index";
import { generateText } from "@/lib/ai";
import { db } from "@/lib/db";

async function runMemoryAgent(payload: Record<string, unknown>): Promise<AgentResult> {
  const { workspaceId, action, category, key, value, score, searchQuery } = payload;
  const startTime = Date.now();

  try {
    switch (action as string) {
      case "store": {
        if (!workspaceId || !category || !key || !value) {
          return {
            success: false,
            error: "Missing required fields: workspaceId, category, key, value",
          };
        }
        const entry = await db.memoryEntry.upsert({
          where: {
            workspaceId_category_key: {
              workspaceId: workspaceId as string,
              category: category as string,
              key: key as string,
            },
          },
          create: {
            workspaceId: workspaceId as string,
            category: category as string,
            key: key as string,
            value: value as string,
            score: Number(score) || 0,
            source: "ai",
          },
          update: {
            value: value as string,
            score: Number(score) || 0,
            isActive: true,
          },
        });
        return {
          success: true,
          data: {
            entries: [entry],
            patterns: [],
            stats: { stored: 1, updated: 0 },
          },
          metadata: { durationMs: Date.now() - startTime },
        };
      }

      case "retrieve": {
        if (!workspaceId) {
          return { success: false, error: "workspaceId is required" };
        }
        const where: Record<string, unknown> = {
          workspaceId: workspaceId as string,
          isActive: true,
        };
        if (category) where.category = category;

        const entries = await db.memoryEntry.findMany({
          where,
          orderBy: { score: "desc" },
          take: 50,
        });

        return {
          success: true,
          data: {
            entries,
            patterns: [],
            stats: { total: entries.length },
          },
          metadata: { durationMs: Date.now() - startTime },
        };
      }

      case "search": {
        if (!workspaceId || !searchQuery) {
          return { success: false, error: "workspaceId and searchQuery are required" };
        }

        const allEntries = await db.memoryEntry.findMany({
          where: { workspaceId: workspaceId as string, isActive: true },
          orderBy: { score: "desc" },
        });

        // Use LLM to find relevant entries and detect patterns
        const systemPrompt = `You are a memory retrieval AI at GhostStudio AI. Given a search query and a list of memory entries, return:
1. The entries most relevant to the query (ranked by relevance)
2. Any patterns you detect across the entries

Return ONLY valid JSON:
{
  "relevantEntries": [{"id": "...", "relevanceScore": 0.95}],
  "patterns": [{"pattern": "...", "confidence": 0.8, "entries": ["id1", "id2"]}]
}`;

        const entriesContext = allEntries.map((e) => ({
          id: e.id,
          category: e.category,
          key: e.key,
          value: e.value,
          score: e.score,
        }));

        const result = await generateText({
          prompt: `Search query: "${searchQuery}"\n\nMemory entries:\n${JSON.stringify(entriesContext, null, 2).substring(0, 6000)}`,
          system: systemPrompt,
          temperature: 0.2,
          maxTokens: 2000,
        });

        let parsed: { relevantEntries: Array<{ id: string; relevanceScore: number }>; patterns: Array<{ pattern: string; confidence: number; entries: string[] }> };
        try {
          const text = result.text.trim();
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { relevantEntries: [], patterns: [] };
        } catch {
          parsed = { relevantEntries: [], patterns: [] };
        }

        const relevantIds = new Set(parsed.relevantEntries.map((e) => e.id));
        const relevantEntries = allEntries.filter((e) => relevantIds.has(e.id));

        return {
          success: true,
          data: {
            entries: relevantEntries,
            patterns: parsed.patterns,
            stats: { total: allEntries.length, relevant: relevantEntries.length },
          },
          metadata: {
            tokensUsed: result.usage?.totalTokens,
            durationMs: Date.now() - startTime,
          },
        };
      }

      case "reinforce": {
        if (!workspaceId || !key || !category) {
          return { success: false, error: "workspaceId, category, and key are required for reinforcement" };
        }

        const scoreDelta = Number(score) || 0;
        const entry = await db.memoryEntry.findUnique({
          where: {
            workspaceId_category_key: {
              workspaceId: workspaceId as string,
              category: category as string,
              key: key as string,
            },
          },
        });

        if (!entry) {
          return { success: false, error: "Memory entry not found for reinforcement" };
        }

        const newScore = Math.min(100, Math.max(0, entry.score + scoreDelta));
        const updated = await db.memoryEntry.update({
          where: { id: entry.id },
          data: { score: newScore },
        });

        return {
          success: true,
          data: {
            entries: [updated],
            patterns: [],
            stats: { reinforced: 1, scoreDelta, newScore },
          },
          metadata: { durationMs: Date.now() - startTime },
        };
      }

      case "detect_patterns": {
        if (!workspaceId) {
          return { success: false, error: "workspaceId is required" };
        }

        const allEntries = await db.memoryEntry.findMany({
          where: { workspaceId: workspaceId as string, isActive: true },
          orderBy: { score: "desc" },
        });

        if (allEntries.length === 0) {
          return {
            success: true,
            data: { entries: [], patterns: [], stats: { total: 0 } },
            metadata: { durationMs: Date.now() - startTime },
          };
        }

        const systemPrompt = `You are a pattern detection AI at GhostStudio AI. Analyze the given memory entries and detect:
1. Recurring themes and topics that perform well
2. Patterns in timing, format, or approach
3. Correlations between different memory categories
4. Fatigue signals (declining scores in certain areas)

Return ONLY valid JSON:
{
  "patterns": [
    {"pattern": "description", "confidence": 0.85, "category": "topic|timing|format|tone", "relatedEntries": ["id1", "id2"], "recommendation": "actionable advice"}
  ],
  "stats": {"totalEntries": 10, "avgScore": 65, "topCategories": ["hook", "topic"]}
}`;

        const result = await generateText({
          prompt: `Analyze these memory entries for patterns:\n${JSON.stringify(allEntries.map((e) => ({ id: e.id, category: e.category, key: e.key, value: e.value, score: e.score })), null, 2).substring(0, 6000)}`,
          system: systemPrompt,
          temperature: 0.3,
          maxTokens: 2500,
        });

        let parsed: { patterns: Array<Record<string, unknown>>; stats: Record<string, unknown> };
        try {
          const text = result.text.trim();
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { patterns: [], stats: {} };
        } catch {
          parsed = { patterns: [], stats: {} };
        }

        return {
          success: true,
          data: {
            entries: allEntries,
            patterns: parsed.patterns,
            stats: { total: allEntries.length, ...parsed.stats },
          },
          metadata: {
            tokensUsed: result.usage?.totalTokens,
            durationMs: Date.now() - startTime,
          },
        };
      }

      default:
        return { success: false, error: `Unknown action: ${action}. Valid: store, retrieve, search, reinforce, detect_patterns` };
    }
  } catch (error) {
    console.error("[MemoryAgent] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Memory operation failed",
      metadata: { durationMs: Date.now() - startTime },
    };
  }
}

const memoryAgent: Agent = {
  type: "memory" as AgentType,
  name: "Memory Agent",
  description: "Updates and manages the memory system. Learns from analytics and reinforces patterns.",
  category: "analytics",
  run: runMemoryAgent,
  execute: async (payload) => {
    const result = await runMemoryAgent(payload);
    if (!result.success) throw new Error(result.error || "Memory agent failed");
    return result.data ?? {};
  },
};

registerAgent(memoryAgent);
export { memoryAgent };
