// Draft Agent — Generates full article drafts from ideas using real LLM calls
// Injects Content DNA (voice, tone, audience, perspective) and memory context

import { type Agent, type AgentResult, registerAgent, type AgentType } from "./index";
import { generateText } from "@/lib/ai";
import { db } from "@/lib/db";

interface ContentDNA {
  voice?: string;
  tone?: string;
  audience?: string;
  perspective?: string;
}

async function getContentDNA(workspaceId?: string): Promise<ContentDNA> {
  if (!workspaceId) return {};
  try {
    const workspace = await db.workspace.findUnique({
      where: { id: workspaceId as string },
      select: { settingsJson: true },
    });
    if (workspace?.settingsJson) {
      const settings = JSON.parse(workspace.settingsJson);
      return settings.contentDNA || settings.dna || {};
    }
  } catch (error) {
    console.error("[DraftAgent] Failed to load Content DNA:", error);
  }
  return {};
}

async function getMemoryContext(workspaceId?: string): Promise<string> {
  if (!workspaceId) return "";
  try {
    const topHooks = await db.memoryEntry.findMany({
      where: { workspaceId: workspaceId as string, category: "hook", isActive: true },
      orderBy: { score: "desc" },
      take: 5,
    });
    const topTopics = await db.memoryEntry.findMany({
      where: { workspaceId: workspaceId as string, category: "topic", isActive: true },
      orderBy: { score: "desc" },
      take: 5,
    });
    const parts: string[] = [];
    if (topHooks.length > 0) {
      parts.push(`Top-performing hooks: ${topHooks.map((h) => h.value).join(", ")}`);
    }
    if (topTopics.length > 0) {
      parts.push(`Top-performing topics: ${topTopics.map((t) => t.value).join(", ")}`);
    }
    return parts.join("\n");
  } catch (error) {
    console.error("[DraftAgent] Failed to load memory context:", error);
    return "";
  }
}

async function runDraftAgent(payload: Record<string, unknown>): Promise<AgentResult> {
  const { topic, angle, tone, format, sourceNotes, workspaceId, targetLength } = payload;
  const startTime = Date.now();

  try {
    const dna = await getContentDNA(workspaceId as string | undefined);
    const memoryContext = await getMemoryContext(workspaceId as string | undefined);

    const systemPrompt = `You are an expert content writer and part of GhostStudio AI's content engine.

CONTENT DNA (your writing identity):
- Voice: ${dna.voice || "professional yet approachable"}
- Tone: ${dna.tone || tone || "informative and engaging"}
- Target Audience: ${dna.audience || "knowledgeable professionals"}
- Perspective: ${dna.perspective || "industry expert with hands-on experience"}

${memoryContext ? `MEMORY CONTEXT (learn what works):\n${memoryContext}` : ""}

Your job is to generate a COMPLETE, publication-ready article draft in markdown format.
Rules:
1. Write with the voice and tone defined above — be authentic, not generic
2. Open with a hook that grabs attention in the first sentence
3. Use concrete examples, data points, and specific details — avoid vague statements
4. Structure with clear H2 and H3 headings for scannability
5. Include a compelling conclusion with a clear takeaway or call-to-action
6. Target approximately ${targetLength || 1500} words
7. Do NOT use AI-typical phrases like "in conclusion", "it goes without saying", "delve into", "moreover", "furthermore"
8. Write as if YOU are the expert sharing hard-won insights, not a summarizer
9. Format: return markdown with the title as H1, then body content`;

    const userPrompt = `Write a full article draft on the following:

Topic: ${topic}
${angle ? `Angle: ${angle}` : ""}
${format ? `Format: ${format}` : ""}
${sourceNotes ? `Source Notes / Ideas: ${sourceNotes}` : ""}

Return your response in this exact JSON format:
{
  "title": "The article title",
  "markdown": "Full article in markdown format",
  "summary": "A 2-3 sentence summary of the article"
}`;

    const result = await generateText({
      prompt: userPrompt,
      system: systemPrompt,
      temperature: 0.8,
      maxTokens: 4000,
    });

    let parsed: { title: string; markdown: string; summary: string };
    try {
      const text = result.text.trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = {
          title: String(topic),
          markdown: text,
          summary: text.substring(0, 200),
        };
      }
    } catch {
      parsed = {
        title: String(topic),
        markdown: result.text,
        summary: result.text.substring(0, 200),
      };
    }

    return {
      success: true,
      data: {
        title: parsed.title,
        markdown: parsed.markdown,
        summary: parsed.summary,
      },
      metadata: {
        tokensUsed: result.usage?.totalTokens,
        durationMs: Date.now() - startTime,
      },
    };
  } catch (error) {
    console.error("[DraftAgent] Error generating draft:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Draft generation failed",
      metadata: { durationMs: Date.now() - startTime },
    };
  }
}

const draftAgent: Agent = {
  type: "draft" as AgentType,
  name: "Draft Agent",
  description: "Generates initial content from ideas, prompts, or source notes",
  category: "content",
  run: runDraftAgent,
  execute: async (payload) => {
    const result = await runDraftAgent(payload);
    if (!result.success) throw new Error(result.error || "Draft agent failed");
    return result.data ?? {};
  },
};

registerAgent(draftAgent);
export { draftAgent };
