// Repurpose Agent — Adapts content for each platform (Twitter/X, LinkedIn, Instagram, etc.)
// Adjusts tone, length, format per platform

import { type Agent, type AgentResult, registerAgent, type AgentType } from "./index";
import { generateText } from "@/lib/ai";

const PLATFORM_SPECS: Record<string, { maxLength: number; tone: string; format: string; tips: string }> = {
  twitter: {
    maxLength: 280,
    tone: "casual, punchy, opinionated",
    format: "Thread with numbered tweets, hooks, and a closer",
    tips: "Start with a controversial or surprising hook. Use line breaks for emphasis. End with a CTA. Thread should be 5-10 tweets.",
  },
  linkedin: {
    maxLength: 3000,
    tone: "professional but personal, story-driven",
    format: "Story-format post with line breaks, no bullets, personal anecdote → lesson",
    tips: "Open with a relatable story or bold statement. Use short paragraphs (1-2 lines). Add a 'If you agree, repost' closer.",
  },
  instagram: {
    maxLength: 2200,
    tone: "visual, inspiring, casual",
    format: "Caption with hook → key takeaways → CTA, plus suggested hashtags",
    tips: "Start with an attention-grabbing first line. Use emojis sparingly. Add 15-20 relevant hashtags at the end.",
  },
  newsletter: {
    maxLength: 5000,
    tone: "intimate, direct, value-packed",
    format: "Email format with subject line, greeting, body, and sign-off",
    tips: "Write like writing to a friend. Include one clear insight they can use today. Subject line should create curiosity.",
  },
  medium: {
    maxLength: 8000,
    tone: "thoughtful, well-structured, in-depth",
    format: "Full article with title, subtitle, sections, and key takeaways",
    tips: "Medium rewards depth and originality. Use H2 headers. Include a key takeaway section. Minimum 5 min read.",
  },
  reddit: {
    maxLength: 40000,
    tone: "casual, authentic, community-oriented, no marketing speak",
    format: "Discussion post with genuine question or value share",
    tips: "Redditors hate self-promotion. Share knowledge genuinely. Ask for input. Use specific, technical language.",
  },
  youtube_description: {
    maxLength: 5000,
    tone: "informative, SEO-friendly",
    format: "Video description with hook, summary, timestamps, links, and tags",
    tips: "First 2 lines are critical for CTR. Include timestamps. Add links to resources. End with subscribe CTA.",
  },
  tiktok: {
    maxLength: 2200,
    tone: "casual, trendy, hook-first",
    format: "Short caption with hook and hashtags",
    tips: "The caption supports the video, not the other way around. Use 3-5 trending hashtags. Keep it under 150 chars for best results.",
  },
};

async function runRepurposeAgent(payload: Record<string, unknown>): Promise<AgentResult> {
  const { content, markdown, platforms, workspaceId } = payload;
  const inputContent = (content || markdown) as string;
  const startTime = Date.now();

  if (!inputContent) {
    return { success: false, error: "No content provided for repurposing" };
  }

  const targetPlatforms = (platforms as string[]) || ["twitter", "linkedin", "instagram", "newsletter"];

  try {
    const platformSpecs = targetPlatforms
      .filter((p) => PLATFORM_SPECS[p.toLowerCase()])
      .map((p) => {
        const spec = PLATFORM_SPECS[p.toLowerCase()];
        return `## ${p.toUpperCase()}\n- Max length: ${spec.maxLength} chars\n- Tone: ${spec.tone}\n- Format: ${spec.format}\n- Tips: ${spec.tips}`;
      })
      .join("\n\n");

    const systemPrompt = `You are a content repurposing expert at GhostStudio AI. Your job is to adapt a master piece of content for different platforms while preserving the core message.

Each platform has specific requirements:

${platformSpecs}

Rules:
1. Preserve the core message and key insights across ALL variants
2. Adapt tone, format, and length to each platform's conventions
3. Add platform-specific elements (hashtags, CTAs, formatting)
4. Make each variant feel native to its platform — not like a copy-paste
5. Include metadata for each variant (character count, estimated engagement potential)

Return ONLY valid JSON:
{
  "variants": [
    {
      "platform": "twitter",
      "content": "The adapted content for this platform",
      "metadata": {
        "characterCount": 1250,
        "engagementPotential": "high",
        "formatNotes": "5-tweet thread with hook and CTA"
      }
    }
  ]
}`;

    const result = await generateText({
      prompt: `Repurpose this content for the following platforms: ${targetPlatforms.join(", ")}\n\nSource content:\n${inputContent.substring(0, 6000)}`,
      system: systemPrompt,
      temperature: 0.6,
      maxTokens: 4000,
    });

    let parsed: { variants: Array<{ platform: string; content: string; metadata: Record<string, unknown> }> };
    try {
      const text = result.text.trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { variants: [] };
    } catch {
      parsed = { variants: [] };
    }

    return {
      success: true,
      data: {
        variants: parsed.variants || [],
      },
      metadata: {
        tokensUsed: result.usage?.totalTokens,
        durationMs: Date.now() - startTime,
      },
    };
  } catch (error) {
    console.error("[RepurposeAgent] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Repurposing failed",
      metadata: { durationMs: Date.now() - startTime },
    };
  }
}

const repurposeAgent: Agent = {
  type: "repurpose" as AgentType,
  name: "Repurpose Agent",
  description: "Creates platform-specific variants from master content",
  category: "content",
  run: runRepurposeAgent,
  execute: async (payload) => {
    const result = await runRepurposeAgent(payload);
    if (!result.success) throw new Error(result.error || "Repurpose agent failed");
    return result.data ?? {};
  },
};

registerAgent(repurposeAgent);
export { repurposeAgent };
