// Video Compose Agent — Composes video from scenes, media, and TTS
// Defines template selection and composition plan

import { type Agent, type AgentResult, registerAgent, type AgentType } from "./index";
import { generateText } from "@/lib/ai";

async function runVideoComposeAgent(payload: Record<string, unknown>): Promise<AgentResult> {
  const { scenes, projectId, aspectRatio, style, voiceId, workspaceId } = payload;
  const inputScenes = scenes as Array<Record<string, unknown>> | undefined;
  const startTime = Date.now();

  try {
    const systemPrompt = `You are a video composition AI at GhostStudio AI. Given a list of scenes with narration, visuals, and timing, create a detailed composition plan that maps each scene to a template, media assets, audio segments, and transitions.

Available templates:
- text_overlay: Text displayed over image/video background
- split_screen: Side-by-side or top-bottom layout
- full_image: Full-screen image with optional text
- transition: Animated transition between scenes
- quote: Quote card with styled text
- stats: Number/statistic display with animation
- timeline: Sequential timeline view
- cinematic: Cinematic wide shot with slow pan

Return ONLY valid JSON:
{
  "scenes": [
    {
      "order": 1,
      "template": "template_name",
      "media": { "type": "image|video|text", "source": "description of what media is needed" },
      "audio": { "type": "narration|music|sfx", "text": "narration text", "duration": 5.0 },
      "duration": 5.0,
      "transition": "fade|slide|zoom|cut",
      "styleOverrides": {}
    }
  ],
  "totalDuration": 60,
  "aspectRatio": "9:16",
  "renderConfig": {
    "resolution": "1080x1920",
    "fps": 30,
    "format": "mp4",
    "codec": "h264"
  }
}`;

    const result = await generateText({
      prompt: `Create a video composition plan:\n\n${inputScenes ? `Scenes:\n${JSON.stringify(inputScenes, null, 2).substring(0, 6000)}` : `Project ID: ${projectId}`}\n\nAspect ratio: ${aspectRatio || "9:16"}\nStyle: ${style || "cinematic"}\nVoice: ${voiceId || "alloy"}`,
      system: systemPrompt,
      temperature: 0.4,
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
        scenes: (parsed.scenes as Array<Record<string, unknown>>) || [],
        totalDuration: (parsed.totalDuration as number) || 0,
        aspectRatio: (parsed.aspectRatio as string) || (aspectRatio as string) || "9:16",
        renderConfig: (parsed.renderConfig as Record<string, unknown>) || {
          resolution: "1080x1920",
          fps: 30,
          format: "mp4",
          codec: "h264",
        },
        compositionPlan: "ready",
        status: "ready_for_render",
      },
      metadata: {
        tokensUsed: result.usage?.totalTokens,
        durationMs: Date.now() - startTime,
      },
    };
  } catch (error) {
    console.error("[VideoComposeAgent] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Video composition failed",
      metadata: { durationMs: Date.now() - startTime },
    };
  }
}

const videoComposeAgent: Agent = {
  type: "video_compose" as AgentType,
  name: "Video Compose Agent",
  description: "Assembles scenes, audio, and transitions into a final video composition plan",
  category: "video",
  run: runVideoComposeAgent,
  execute: async (payload) => {
    const result = await runVideoComposeAgent(payload);
    if (!result.success) throw new Error(result.error || "Video compose agent failed");
    return result.data ?? {};
  },
};

registerAgent(videoComposeAgent);
export { videoComposeAgent };
