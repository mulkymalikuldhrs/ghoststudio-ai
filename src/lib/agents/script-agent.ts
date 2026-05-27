// Script Agent — Generates video scripts from topics with scene breakdowns
// Creates timing, narration, and visual descriptions for each scene

import { type Agent, type AgentResult, registerAgent, type AgentType } from "./index";
import { generateText } from "@/lib/ai";

async function runScriptAgent(payload: Record<string, unknown>): Promise<AgentResult> {
  const { topic, prompt, niche, duration, style, workspaceId } = payload;
  const inputTopic = (topic || prompt) as string;
  const inputDuration = Number(duration) || 60;
  const inputStyle = (style || niche || "educational") as string;
  const startTime = Date.now();

  if (!inputTopic) {
    return { success: false, error: "No topic or prompt provided for script generation" };
  }

  try {
    const systemPrompt = `You are a video script writer at GhostStudio AI. Create engaging video scripts with detailed scene breakdowns.

The script should:
1. Hook viewers in the first 3 seconds with a bold statement or question
2. Build tension/curiosity throughout
3. Use short, punchy narration lines (15-25 words each)
4. Include vivid visual descriptions for AI image generation
5. End with a strong CTA or memorable closer
6. Total duration should be close to ${inputDuration} seconds
7. Style: ${inputStyle}

Return ONLY valid JSON:
{
  "title": "Video title",
  "scenes": [
    {
      "order": 1,
      "duration": 5,
      "narration": "What the voiceover says for this scene",
      "visualDescription": "Detailed visual description for AI image generation"
    }
  ]
}

Scene durations should add up to approximately ${inputDuration} seconds.`;

    const result = await generateText({
      prompt: `Write a ${inputDuration}-second video script about: "${inputTopic}"\nStyle: ${inputStyle}`,
      system: systemPrompt,
      temperature: 0.7,
      maxTokens: 3000,
    });

    let parsed: { title: string; scenes: Array<{ order: number; duration: number; narration: string; visualDescription: string }> };
    try {
      const text = result.text.trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("[ScriptAgent] Failed to parse script response:", parseError);
      return {
        success: false,
        error: "Failed to parse script results",
        metadata: { durationMs: Date.now() - startTime },
      };
    }

    return {
      success: true,
      data: {
        title: parsed.title || inputTopic,
        scenes: parsed.scenes || [],
        totalDuration: (parsed.scenes || []).reduce((sum, s) => sum + (s.duration || 0), 0),
      },
      metadata: {
        tokensUsed: result.usage?.totalTokens,
        durationMs: Date.now() - startTime,
      },
    };
  } catch (error) {
    console.error("[ScriptAgent] Error generating script:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Script generation failed",
      metadata: { durationMs: Date.now() - startTime },
    };
  }
}

const scriptAgent: Agent = {
  type: "script" as AgentType,
  name: "Script Agent",
  description: "Writes video narration scripts with scene breakdowns, timing, and visual descriptions",
  category: "video",
  run: runScriptAgent,
  execute: async (payload) => {
    const result = await runScriptAgent(payload);
    if (!result.success) throw new Error(result.error || "Script agent failed");
    return result.data ?? {};
  },
};

registerAgent(scriptAgent);
export { scriptAgent };
