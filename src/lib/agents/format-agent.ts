// Format Agent — Transforms content between formats
// Supports: article → thread, article → newsletter, long-form → short-form, etc.

import { type Agent, type AgentResult, registerAgent, type AgentType } from "./index";
import { generateText } from "@/lib/ai";
import { db } from "@/lib/db";

interface ContentDNA {
  coreVoice?: string;
  sentenceRhythm?: string;
  forbiddenPatterns?: string[];
  emotionalTexture?: string;
  structuralBias?: string;
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
    console.error("[FormatAgent] Failed to load Content DNA:", error);
  }
  return {};
}

const FORMAT_SPECS: Record<string, { description: string; rules: string }> = {
  article_to_thread: {
    description: "Convert a long article into a Twitter/X thread",
    rules: "Break into 5-10 tweets. Each tweet under 280 chars. First tweet is the hook. Last tweet is the CTA. Number each tweet. Add line breaks for readability.",
  },
  article_to_newsletter: {
    description: "Convert an article into an email newsletter format",
    rules: "Add subject line (50 chars max). Personal greeting. Teaser paragraph. Key points with bold headers. One clear CTA. Sign-off. Keep under 1000 words.",
  },
  long_to_short: {
    description: "Condense long-form content into a short-form version",
    rules: "Keep only the most impactful points. Remove examples and elaboration. Target 300-500 words. Preserve the hook and key takeaway. Make every sentence earn its place.",
  },
  article_to_script: {
    description: "Convert a written article into a video narration script",
    rules: "Rewrite for spoken word. Short sentences. Conversational tone. Add scene markers for visual breaks. Include pauses and emphasis notes. Target 150 words per minute.",
  },
  bullet_to_prose: {
    description: "Expand bullet points into flowing prose",
    rules: "Turn each bullet into a full paragraph. Add transitions between ideas. Include examples and context. Maintain the original logic and order.",
  },
  prose_to_bullets: {
    description: "Condense prose into scannable bullet points",
    rules: "Extract key ideas. One idea per bullet. Start with action verbs where possible. Bold key terms. Group related points. Include a summary bullet at the end.",
  },
};

async function runFormatAgent(payload: Record<string, unknown>): Promise<AgentResult> {
  const { content, markdown, sourceFormat, targetFormat, format, workspaceId } = payload;
  const inputContent = (content || markdown) as string;
  const inputTarget = (targetFormat || format) as string;
  const startTime = Date.now();

  if (!inputContent) {
    return { success: false, error: "No content provided for formatting" };
  }

  if (!inputTarget) {
    return { success: false, error: "No target format specified. Options: article_to_thread, article_to_newsletter, long_to_short, article_to_script, bullet_to_prose, prose_to_bullets" };
  }

  try {
    const dna = await getContentDNA(workspaceId as string | undefined);
    const dnaVoice = dna.coreVoice || dna.voice || "professional yet approachable";
    const dnaTone = dna.emotionalTexture || dna.tone || "informative and engaging";
    const forbiddenStr = dna.forbiddenPatterns && dna.forbiddenPatterns.length > 0
      ? `\nFORBIDDEN PATTERNS (never use): ${dna.forbiddenPatterns.join(', ')}`
      : '';

    const formatSpec = FORMAT_SPECS[inputTarget.toLowerCase()] || {
      description: `Convert to ${inputTarget} format`,
      rules: `Adapt the content to the ${inputTarget} format while preserving key information.`,
    };

    const systemPrompt = `You are a content format conversion AI at GhostStudio AI. Transform content from one format to another.

CONTENT DNA ALIGNMENT:
- Voice: ${dnaVoice}
- Emotional Texture: ${dnaTone}${forbiddenStr}

Target format: ${inputTarget}
Description: ${formatSpec.description}

Rules:
${formatSpec.rules}

Preserve the core message, key data points, and main arguments. Only change the format and structure, not the substance.

Return ONLY valid JSON:
{
  "formattedContent": "The reformatted content",
  "sourceFormat": "${sourceFormat || "auto-detected"}",
  "targetFormat": "${inputTarget}",
  "wordCount": 450,
  "transformationNotes": ["What was changed", "What was preserved"]
}`;

    const result = await generateText({
      prompt: `Convert this content to ${inputTarget} format:\n\n${inputContent.substring(0, 6000)}`,
      system: systemPrompt,
      temperature: 0.5,
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
        formattedContent: parsed.formattedContent || result.text,
        sourceFormat: parsed.sourceFormat || sourceFormat || "auto-detected",
        targetFormat: inputTarget,
        wordCount: parsed.wordCount || 0,
        transformationNotes: parsed.transformationNotes || [],
      },
      metadata: {
        tokensUsed: result.usage?.totalTokens,
        durationMs: Date.now() - startTime,
      },
    };
  } catch (error) {
    console.error("[FormatAgent] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Format conversion failed",
      metadata: { durationMs: Date.now() - startTime },
    };
  }
}

const formatAgent: Agent = {
  type: "format" as AgentType,
  name: "Format Agent",
  description: "Transforms content between formats (article→thread, article→newsletter, etc.)",
  category: "content",
  run: runFormatAgent,
  execute: async (payload) => {
    const result = await runFormatAgent(payload);
    if (!result.success) throw new Error(result.error || "Format agent failed");
    return result.data ?? {};
  },
};

registerAgent(formatAgent);
export { formatAgent };
