// Trend Agent — Detects and analyzes trending topics for content opportunities
// Uses real-time web search + LLM to evaluate trend relevance, timing, and saturation

import { type Agent, type AgentResult, registerAgent, type AgentType } from "./index";
import { generateText } from "@/lib/ai";
import { db } from "@/lib/db";

// ─── Web Search Result Types ──────────────────────────────────────────────────

interface WebSearchResult {
  url: string;
  name: string;
  snippet: string;
  host_name: string;
  rank: number;
  date?: string;
  favicon?: string;
}

// ─── Dynamic Search Query Builder ─────────────────────────────────────────────

function buildSearchQueries(niche: string, platform: string, region: string): string[] {
  const queries: string[] = [];

  // Core trending query
  queries.push(`${niche} trending topics 2025`);

  // Platform-specific query
  if (platform && platform !== "general") {
    queries.push(`${niche} trends ${platform} 2025`);
  }

  // Region-specific query if not global
  if (region && region !== "global") {
    queries.push(`${niche} trending ${region} 2025`);
  }

  // Content opportunity / viral query
  queries.push(`${niche} content ideas viral topics 2025`);

  return queries;
}

// ─── Web Search with Fallback ─────────────────────────────────────────────────

async function performWebSearch(
  queries: string[]
): Promise<{ results: WebSearchResult[]; sources: Array<{ url: string; name: string; snippet: string }>; searchFailed: boolean }> {
  const allResults: WebSearchResult[] = [];
  const seenUrls = new Set<string>();
  let searchFailed = false;

  try {
    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    const zai = await ZAI.create();

    // Run searches in parallel for speed
    const searchPromises = queries.map(async (query) => {
      try {
        const searchResult = await zai.functions.invoke("web_search", {
          query,
          num: 10,
        });

        if (Array.isArray(searchResult)) {
          return searchResult as WebSearchResult[];
        }
        return [];
      } catch (err) {
        console.warn(`[TrendAgent] Web search failed for query "${query}":`, err);
        return [];
      }
    });

    const searchResponses = await Promise.allSettled(searchPromises);

    for (const response of searchResponses) {
      if (response.status === "fulfilled") {
        for (const result of response.value) {
          // Deduplicate by URL
          if (result.url && !seenUrls.has(result.url)) {
            seenUrls.add(result.url);
            allResults.push(result);
          }
        }
      }
    }

    if (allResults.length === 0) {
      searchFailed = true;
    }
  } catch (err) {
    console.warn("[TrendAgent] Web search initialization failed, falling back to LLM-only mode:", err);
    searchFailed = true;
  }

  // Build clean sources array with only the fields we expose downstream
  const sources = allResults.map((r) => ({
    url: r.url,
    name: r.name,
    snippet: r.snippet,
  }));

  return { results: allResults, sources, searchFailed };
}

// ─── Format Search Results for LLM Context ────────────────────────────────────

function formatSearchContext(results: WebSearchResult[]): string {
  if (results.length === 0) return "";

  const lines: string[] = [
    "=== REAL-TIME WEB SEARCH RESULTS (use these to ground your analysis in actual current trends) ===",
    "",
  ];

  // Group by rank — show top results first
  const sorted = [...results].sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));

  for (const r of sorted.slice(0, 20)) {
    lines.push(`- [${r.name}](${r.url})`);
    lines.push(`  ${r.snippet}`);
    if (r.date) lines.push(`  Date: ${r.date}`);
    lines.push("");
  }

  lines.push("=== END SEARCH RESULTS ===");
  lines.push("");
  lines.push("IMPORTANT: Analyze the above search results to identify genuine current trends. Do NOT fabricate trends that aren't supported by the search data. Each trend you identify should be traceable to at least one source above.");

  return lines.join("\n");
}

// ─── Main Agent Function ──────────────────────────────────────────────────────

async function runTrendAgent(payload: Record<string, unknown>): Promise<AgentResult> {
  const { niche, platform, region, workspaceId, maxTrends } = payload;
  const inputNiche = (niche || "technology") as string;
  const inputPlatform = (platform || "general") as string;
  const inputRegion = (region || "global") as string;
  const inputMaxTrends = (maxTrends || 8) as number;
  const startTime = Date.now();

  try {
    // ── Step 1: Get workspace memory for context ────────────────────────────
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

    // ── Step 2: Perform real-time web search ────────────────────────────────
    const searchQueries = buildSearchQueries(inputNiche, inputPlatform, inputRegion);
    const { results: searchResults, sources, searchFailed } = await performWebSearch(searchQueries);

    const searchContext = formatSearchContext(searchResults);
    const searchModeLabel = searchFailed ? "LLM-only (web search unavailable)" : "Web search + LLM analysis";

    console.log(`[TrendAgent] Search mode: ${searchModeLabel} | Results: ${searchResults.length} | Queries: ${searchQueries.length}`);

    // ── Step 3: Build LLM prompt with search context ───────────────────────
    const systemPrompt = `You are a trend analysis AI at GhostStudio AI. Identify and evaluate trending topics for content creation opportunities.

For each trend, evaluate:
1. Trend Momentum: Is it rising, peaking, or declining?
2. Relevance Score: How relevant to the given niche (0-1)?
3. Saturation Level: How much content already exists? (low/medium/high)
4. Content Window: How long before this trend passes?
5. Opportunity Score: Overall opportunity rating (0-100)

Consider the niche "${inputNiche}" and platform "${inputPlatform}".
${memoryContext}

${searchContext}

Return ONLY valid JSON:
{
  "trends": [
    {
      "topic": "Trend topic name",
      "description": "Brief description of the trend based on the search results",
      "momentum": "rising|peaking|declining|stable",
      "relevanceScore": 0.9,
      "saturation": "low|medium|high",
      "contentWindow": "48 hours|1 week|1 month|evergreen",
      "opportunityScore": 85,
      "suggestedAngle": "How to approach this trend uniquely",
      "relatedKeywords": ["keyword1", "keyword2"],
      "platformFit": ["youtube", "twitter", "linkedin"],
      "sourceUrls": ["https://example.com/article"]
    }
  ],
  "meta": {
    "niche": "${inputNiche}",
    "platform": "${inputPlatform}",
    "analysisDate": "${new Date().toISOString()}",
    "topOpportunity": "Best trend to pursue right now",
    "dataFreshness": "${searchFailed ? "stale" : "real-time"}",
    "searchQueriesUsed": ${JSON.stringify(searchQueries)}
  }
}`;

    const userPrompt = searchFailed
      ? `Identify trending content opportunities for:\n\nNiche: ${inputNiche}\nPlatform: ${inputPlatform}\nRegion: ${inputRegion}\n${memoryContext}\n\nNote: Web search was unavailable, so rely on your training data. Clearly mark trends that may not reflect current reality.\n\nReturn up to ${inputMaxTrends} trends.`
      : `Based on the web search results provided in the system context, identify the top trending content opportunities for:\n\nNiche: ${inputNiche}\nPlatform: ${inputPlatform}\nRegion: ${inputRegion}\n${memoryContext}\n\nAnalyze the search results to find genuine, current trends. For each trend, include the sourceUrls field with the URLs from the search results that support it.\n\nReturn up to ${inputMaxTrends} trends.`;

    const result = await generateText({
      prompt: userPrompt,
      system: systemPrompt,
      temperature: 0.6,
      maxTokens: 4000,
    });

    // ── Step 4: Parse and enrich the response ──────────────────────────────
    let parsed: Record<string, unknown>;
    try {
      const text = result.text.trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      parsed = {};
    }

    // Enrich each trend with source URLs if the LLM didn't include them
    const trends = (parsed.trends || []) as Array<Record<string, unknown>>;
    const enrichedTrends = trends.map((trend) => {
      // If the LLM didn't provide sourceUrls or provided an empty array,
      // attempt to match relevant search results by keyword overlap
      const existingSources = (trend.sourceUrls as string[]) || [];
      if (existingSources.length === 0 && searchResults.length > 0) {
        const topic = (trend.topic as string || "").toLowerCase();
        const keywords = ((trend.relatedKeywords as string[]) || []).map((k) => k.toLowerCase());
        const allTerms = [topic, ...keywords];

        // Find search results whose name or snippet contains any of the trend terms
        const matchedUrls: string[] = [];
        for (const sr of searchResults) {
          const text = `${sr.name} ${sr.snippet}`.toLowerCase();
          if (allTerms.some((term) => term.length > 3 && text.includes(term))) {
            matchedUrls.push(sr.url);
          }
          if (matchedUrls.length >= 3) break; // Cap at 3 sources per trend
        }

        return { ...trend, sourceUrls: matchedUrls };
      }
      return trend;
    });

    return {
      success: true,
      data: {
        trends: enrichedTrends,
        meta: parsed.meta || { niche: inputNiche, platform: inputPlatform },
        sources,
        searchMode: searchModeLabel,
        searchQueriesUsed: searchQueries,
      },
      metadata: {
        tokensUsed: result.usage?.totalTokens,
        durationMs: Date.now() - startTime,
        searchResultsCount: searchResults.length,
        searchFailed,
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

// ─── Agent Registration ───────────────────────────────────────────────────────

const trendAgent: Agent = {
  type: "trend" as AgentType,
  name: "Trend Agent",
  description: "Detects and analyzes trending topics for content creation opportunities using real-time web search",
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
