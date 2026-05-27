// Image Agent — Generates AI image prompts from content
// Supports multiple styles (photorealistic, illustration, etc.)

import { type Agent, type AgentResult, registerAgent, type AgentType } from "./index";
import { generateText } from "@/lib/ai";

const STYLE_GUIDES: Record<string, string> = {
  photorealistic: "Ultra-realistic photography, natural lighting, 8K detail, shallow depth of field",
  cinematic: "Cinematic film still, dramatic lighting, anamorphic lens, color graded, widescreen composition",
  illustration: "Digital illustration, clean lines, vibrant colors, modern art style",
  anime: "Anime style, cel-shaded, vibrant colors, dynamic composition",
  dark_fantasy: "Dark fantasy art, moody atmosphere, rich textures, dramatic shadows",
  minimalist: "Minimalist design, clean composition, limited color palette, negative space",
  vintage: "Vintage aesthetic, film grain, warm tones, retro color grading",
  neon_cyberpunk: "Cyberpunk neon aesthetic, glowing lights, futuristic, rain-slicked streets",
  watercolor: "Watercolor painting style, soft edges, flowing colors, artistic",
  abstract: "Abstract art, bold shapes, geometric patterns, expressive colors",
  realistic: "Realistic rendering, natural composition, balanced lighting, photographic",
  dark: "Dark moody aesthetic, low-key lighting, dramatic shadows, mysterious atmosphere",
};

async function runImageAgent(payload: Record<string, unknown>): Promise<AgentResult> {
  const { prompt, narration, style, sceneIndex, sceneContext, aspectRatio, workspaceId } = payload;
  const inputNarration = (narration || prompt) as string;
  const inputStyle = (style || "cinematic") as string;
  const startTime = Date.now();

  if (!inputNarration) {
    return { success: false, error: "No narration or prompt provided for image generation" };
  }

  try {
    const styleGuide = STYLE_GUIDES[inputStyle.toLowerCase()] || STYLE_GUIDES.cinematic;

    const systemPrompt = `You are an AI image prompt engineer at GhostStudio AI. Your job is to create detailed, high-quality image generation prompts from scene descriptions.

Style guide for "${inputStyle}": ${styleGuide}

Rules for prompt creation:
1. Be extremely specific about visual elements, composition, lighting, and mood
2. Include technical details: camera angle, lens type, lighting setup
3. Avoid text in images — focus on visual storytelling
4. Each prompt should work independently (no reference to other scenes)
5. Include negative prompt suggestions to avoid common AI art issues
6. Optimize for the AI image model (Stable Diffusion / DALL-E style prompts)

Return ONLY valid JSON:
{
  "prompts": [
    {
      "scene": "Scene description",
      "prompt": "Detailed image generation prompt with style, composition, lighting, and mood",
      "negativePrompt": "What to avoid in generation",
      "style": "${inputStyle}"
    }
  ]
}`;

    const result = await generateText({
      prompt: `Generate image prompts for this scene${sceneContext ? `\nVisual context: ${sceneContext}` : ""}${aspectRatio ? `\nAspect ratio: ${aspectRatio}` : "\nAspect ratio: 9:16 (vertical)"}\n\nScene narration: "${inputNarration}"${sceneIndex !== undefined ? `\nScene index: ${sceneIndex}` : ""}`,
      system: systemPrompt,
      temperature: 0.6,
      maxTokens: 1500,
    });

    let parsed: { prompts: Array<{ scene: string; prompt: string; negativePrompt: string; style: string }> };
    try {
      const text = result.text.trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { prompts: [] };
    } catch {
      parsed = { prompts: [] };
    }

    // If no prompts parsed, create a basic one
    if (parsed.prompts.length === 0) {
      parsed.prompts = [{
        scene: inputNarration,
        prompt: `${styleGuide}. ${inputNarration}. Highly detailed, professional quality.`,
        negativePrompt: "blurry, low quality, distorted, text, watermark, logo",
        style: inputStyle,
      }];
    }

    return {
      success: true,
      data: {
        prompts: parsed.prompts,
      },
      metadata: {
        tokensUsed: result.usage?.totalTokens,
        durationMs: Date.now() - startTime,
      },
    };
  } catch (error) {
    console.error("[ImageAgent] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Image prompt generation failed",
      metadata: { durationMs: Date.now() - startTime },
    };
  }
}

const imageAgent: Agent = {
  type: "image" as AgentType,
  name: "Image Agent",
  description: "Generates AI image prompts from content with multiple style support",
  category: "video",
  run: runImageAgent,
  execute: async (payload) => {
    const result = await runImageAgent(payload);
    if (!result.success) throw new Error(result.error || "Image agent failed");
    return result.data ?? {};
  },
};

registerAgent(imageAgent);
export { imageAgent };
