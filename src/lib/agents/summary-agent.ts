// Summary Agent — Generates concise summaries from long-form content
// Supports multiple summary types: brief, detailed, executive, key-takeaways

import { type Agent, type AgentResult, registerAgent, type AgentType } from "./index";
import { generateText } from "@/lib/ai";

async function runSummaryAgent(payload: Record<string, unknown>): Promise<AgentResult> {
  const { content, markdown, title, summaryType, maxLength, workspaceId } = payload;
  const inputContent = (content || markdown) as string;
  const inputTitle = title as string;
  const inputType = (summaryType || "detailed") as string;
  const inputMaxLen = Number(maxLength) || 500;
  const startTime = Date.now();

  if (!inputContent) {
    return { success: false, error: "No content provided for summarization" };
  }

  try {
    const summarySpecs: Record<string, string> = {
      brief: `Create a brief summary in 1-2 sentences (max 100 words). Capture only the core message.`,
      detailed: `Create a detailed summary (max ${inputMaxLen} words). Include main arguments, key data points, and conclusions.`,
      executive: `Create an executive summary (max 300 words). Focus on business implications, actionable insights, and bottom-line takeaways. Use bullet points for key findings.`,
      key_takeaways: `Extract 5-7 key takeaways as numbered bullet points. Each takeaway should be a single, actionable insight. Include any important data points or statistics.`,
      tl_dr: `Create a TL;DR in 2-3 punchy sentences. What would you tell someone who only has 10 seconds?`,
    };

    const spec = summarySpecs[inputType.toLowerCase()] || summarySpecs.detailed;

    const systemPrompt = `You are a content summarization AI at GhostStudio AI. Create precise, useful summaries.

${spec}

Rules:
1. Never add information not present in the source
2. Preserve specific numbers, names, and data points
3. Maintain the original tone and perspective
4. Be concise — every word must earn its place
5. Lead with the most important information

Return ONLY valid JSON:
{
  "summary": "The summary text",
  "summaryType": "${inputType}",
  "wordCount": 250,
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "readingTimeSaved": "5 min read → 1 min summary"
}`;

    const result = await generateText({
      prompt: `Summarize this content (${inputType} summary):\n\n${inputTitle ? `Title: ${inputTitle}\n\n` : ""}${inputContent.substring(0, 6000)}`,
      system: systemPrompt,
      temperature: 0.3,
      maxTokens: 1500,
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
        summary: parsed.summary || result.text,
        summaryType: inputType,
        wordCount: parsed.wordCount || 0,
        keyPoints: parsed.keyPoints || [],
        readingTimeSaved: parsed.readingTimeSaved || "",
      },
      metadata: {
        tokensUsed: result.usage?.totalTokens,
        durationMs: Date.now() - startTime,
      },
    };
  } catch (error) {
    console.error("[SummaryAgent] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Summarization failed",
      metadata: { durationMs: Date.now() - startTime },
    };
  }
}

const summaryAgent: Agent = {
  type: "summary" as AgentType,
  name: "Summary Agent",
  description: "Generates concise summaries from long-form content in multiple formats",
  category: "content",
  run: runSummaryAgent,
  execute: async (payload) => {
    const result = await runSummaryAgent(payload);
    if (!result.success) throw new Error(result.error || "Summary agent failed");
    return result.data ?? {};
  },
};

registerAgent(summaryAgent);
export { summaryAgent };
