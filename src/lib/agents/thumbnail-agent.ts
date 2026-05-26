// Thumbnail Agent — Generates thumbnail concepts and AI image prompts
// Creates click-worthy thumbnail designs for YouTube, TikTok, etc.

import { type Agent, type AgentResult, registerAgent, type AgentType } from "./index";
import { generateText } from "@/lib/ai";

async function runThumbnailAgent(payload: Record<string, unknown>): Promise<AgentResult> {
  const { title, topic, content, platform, style, workspaceId } = payload;
  const inputTitle = title as string;
  const inputTopic = topic as string;
  const inputContent = content as string;
  const inputPlatform = (platform || "youtube") as string;
  const startTime = Date.now();

  if (!inputTitle && !inputTopic) {
    return { success: false, error: "No title or topic provided for thumbnail generation" };
  }

  try {
    const systemPrompt = `You are a thumbnail design AI at GhostStudio AI. Create click-worthy thumbnail concepts that drive high CTR.

${inputPlatform === "youtube" ? `YouTube thumbnail rules:
- 1280x720 resolution, max 2MB
- 3-5 words max text overlay (large, bold, readable at small sizes)
- High contrast colors, emotional faces
- Use red, yellow, or bright green accents
- Leave space for title in YouTube UI
- Avoid too much detail — simple wins` : `TikTok/social thumbnail rules:
- Vertical format (9:16)
- Bold, simple visuals
- Text overlay must be instantly readable
- Vibrant, attention-grabbing colors
- Create pattern interrupt`}

Return ONLY valid JSON:
{
  "concepts": [
    {
      "name": "Concept name",
      "description": "Visual description of the thumbnail",
      "imagePrompt": "Detailed AI image generation prompt for this thumbnail",
      "negativePrompt": "What to avoid in generation",
      "textOverlay": "Short text for the thumbnail (3-5 words)",
      "textPosition": "top-left|top-center|center|bottom-center",
      "colorScheme": ["#primary", "#secondary", "#accent"],
      "emotionalHook": "What emotion this thumbnail targets",
      "estimatedCTR": "High|Medium|Low"
    }
  ]
}`;

    const result = await generateText({
      prompt: `Design thumbnail concepts for:\nTitle: ${inputTitle || inputTopic}\n${inputTopic ? `Topic: ${inputTopic}` : ""}\n${inputContent ? `Content summary: ${inputContent.substring(0, 1000)}` : ""}\nPlatform: ${inputPlatform}\nStyle: ${style || "bold_attention_grabbing"}`,
      system: systemPrompt,
      temperature: 0.7,
      maxTokens: 2500,
    });

    let parsed: { concepts: Array<Record<string, unknown>> };
    try {
      const text = result.text.trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { concepts: [] };
    } catch {
      parsed = { concepts: [] };
    }

    return {
      success: true,
      data: {
        concepts: parsed.concepts || [],
        platform: inputPlatform,
      },
      metadata: {
        tokensUsed: result.usage?.totalTokens,
        durationMs: Date.now() - startTime,
      },
    };
  } catch (error) {
    console.error("[ThumbnailAgent] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Thumbnail generation failed",
      metadata: { durationMs: Date.now() - startTime },
    };
  }
}

const thumbnailAgent: Agent = {
  type: "thumbnail" as AgentType,
  name: "Thumbnail Agent",
  description: "Generates thumbnail concepts and AI image prompts for video platforms",
  category: "video",
  run: runThumbnailAgent,
  execute: async (payload) => {
    const result = await runThumbnailAgent(payload);
    if (!result.success) throw new Error(result.error || "Thumbnail agent failed");
    return result.data ?? {};
  },
};

registerAgent(thumbnailAgent);
export { thumbnailAgent };
