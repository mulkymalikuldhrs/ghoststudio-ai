// Tagging Agent — Auto-classifies content with tags
// Categories: topic, format, niche, tone, series

import { type Agent, type AgentResult, registerAgent, type AgentType } from "./index";
import { generateText } from "@/lib/ai";

async function runTaggingAgent(payload: Record<string, unknown>): Promise<AgentResult> {
  const { content, markdown, title, url, workspaceId } = payload;
  const inputContent = (content || markdown) as string;
  const inputTitle = title as string;
  const startTime = Date.now();

  if (!inputContent && !inputTitle) {
    return { success: false, error: "No content or title provided for tagging" };
  }

  try {
    const systemPrompt = `You are a content classification AI at GhostStudio AI. Analyze the given content and assign tags across 5 categories:

1. TOPIC: What is this content about? (e.g., "artificial-intelligence", "marketing", "productivity")
2. FORMAT: What type of content is this? (e.g., "tutorial", "opinion", "case-study", "how-to", "listicle", "deep-dive")
3. NICHE: What industry/niche does this serve? (e.g., "saas", "creator-economy", "developer-tools", "fintech")
4. TONE: What is the writing tone? (e.g., "technical", "casual", "authoritative", "conversational", "provocative")
5. SERIES: Does this fit into a content series? (e.g., "getting-started", "advanced-guide", "weekly-digest")

For each tag, provide a confidence score (0-1) and the category.

Return ONLY valid JSON:
{
  "tags": [
    { "tag": "artificial-intelligence", "category": "topic", "confidence": 0.95 },
    { "tag": "tutorial", "category": "format", "confidence": 0.9 },
    { "tag": "saas", "category": "niche", "confidence": 0.8 },
    { "tag": "authoritative", "category": "tone", "confidence": 0.85 },
    { "tag": "getting-started", "category": "series", "confidence": 0.6 }
  ]
}

Aim for 2-4 tags per category. Only include tags with confidence > 0.5.`;

    const result = await generateText({
      prompt: `Classify this content with tags:\n\n${inputTitle ? `Title: ${inputTitle}\n\n` : ""}${inputContent ? `Content:\n${inputContent.substring(0, 4000)}` : ""}`,
      system: systemPrompt,
      temperature: 0.3,
      maxTokens: 1500,
    });

    let parsed: { tags: Array<{ tag: string; category: string; confidence: number }> };
    try {
      const text = result.text.trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { tags: [] };
    } catch {
      parsed = { tags: [] };
    }

    return {
      success: true,
      data: {
        tags: parsed.tags || [],
      },
      metadata: {
        tokensUsed: result.usage?.totalTokens,
        durationMs: Date.now() - startTime,
      },
    };
  } catch (error) {
    console.error("[TaggingAgent] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Tagging failed",
      metadata: { durationMs: Date.now() - startTime },
    };
  }
}

const taggingAgent: Agent = {
  type: "tagging" as AgentType,
  name: "Tagging Agent",
  description: "Automatically categorizes and tags content with topics, formats, niches, and tones",
  category: "content",
  run: runTaggingAgent,
  execute: async (payload) => {
    const result = await runTaggingAgent(payload);
    if (!result.success) throw new Error(result.error || "Tagging agent failed");
    return result.data ?? {};
  },
};

registerAgent(taggingAgent);
export { taggingAgent };
