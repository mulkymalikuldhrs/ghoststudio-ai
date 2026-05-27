// TikTok Agent — Creates TikTok-optimized short-form video content
// Generates hooks, scripts, and metadata for TikTok

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
    console.error("[TikTokAgent] Failed to load Content DNA:", error);
  }
  return {};
}

async function runTikTokAgent(payload: Record<string, unknown>): Promise<AgentResult> {
  const { content, topic, markdown, hook, duration, style, workspaceId } = payload;
  const inputContent = (content || markdown) as string;
  const inputTopic = topic as string;
  const inputDuration = Number(duration) || 60;
  const startTime = Date.now();

  if (!inputContent && !inputTopic) {
    return { success: false, error: "No content or topic provided for TikTok generation" };
  }

  try {
    const dna = await getContentDNA(workspaceId as string | undefined);
    const dnaVoice = dna.coreVoice || dna.voice || "professional yet approachable";
    const dnaTone = dna.emotionalTexture || dna.tone || "informative and engaging";
    const forbiddenStr = dna.forbiddenPatterns && dna.forbiddenPatterns.length > 0
      ? `\nFORBIDDEN PATTERNS (never use): ${dna.forbiddenPatterns.join(', ')}`
      : '';

    const systemPrompt = `You are a TikTok content strategist at GhostStudio AI. Create viral-ready TikTok content from the given input.

CONTENT DNA ALIGNMENT:
- Voice: ${dnaVoice}
- Emotional Texture: ${dnaTone}${forbiddenStr}

TikTok best practices:
1. Hook in first 1-2 seconds (pattern interrupt, bold claim, or question)
2. Keep narration punchy — 15-20 words per scene
3. Use trending audio formats when possible
4. Optimize for ${inputDuration}s or less
5. Include 3-5 relevant hashtags
6. Create scroll-stopping visual descriptions
7. Text overlays for key points (80% of TikTok watched on mute initially)
8. End with CTA or "watch for the twist" pattern

Return ONLY valid JSON:
{
  "hook": "The opening hook text",
  "script": [
    { "seconds": "0-3", "narration": "Hook line", "visual": "Visual description", "textOverlay": "Key text on screen" },
    { "seconds": "3-10", "narration": "...", "visual": "...", "textOverlay": "..." }
  ],
  "caption": "TikTok caption with hashtags",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
  "soundSuggestion": "Trending sound type or style",
  "estimatedViews": "Based on hook strength",
  "viralScore": 85
}`;

    const result = await generateText({
      prompt: `Create TikTok content${inputTopic ? ` about: ${inputTopic}` : ""}${inputContent ? `\n\nSource content:\n${inputContent.substring(0, 4000)}` : ""}\nDuration target: ${inputDuration}s\nStyle: ${style || "trending"}`,
      system: systemPrompt,
      temperature: 0.8,
      maxTokens: 2500,
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
        hook: parsed.hook || "",
        script: parsed.script || [],
        caption: parsed.caption || "",
        hashtags: parsed.hashtags || [],
        soundSuggestion: parsed.soundSuggestion || "",
        viralScore: parsed.viralScore || 0,
      },
      metadata: {
        tokensUsed: result.usage?.totalTokens,
        durationMs: Date.now() - startTime,
      },
    };
  } catch (error) {
    console.error("[TikTokAgent] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "TikTok content generation failed",
      metadata: { durationMs: Date.now() - startTime },
    };
  }
}

const tiktokAgent: Agent = {
  type: "tiktok" as AgentType,
  name: "TikTok Agent",
  description: "Creates TikTok-optimized short-form video content with hooks, scripts, and metadata",
  category: "video",
  run: runTikTokAgent,
  execute: async (payload) => {
    const result = await runTikTokAgent(payload);
    if (!result.success) throw new Error(result.error || "TikTok agent failed");
    return result.data ?? {};
  },
};

registerAgent(tiktokAgent);
export { tiktokAgent };
