// Clip Agent — Extracts viral clips from heatmap data with scoring

import { type Agent, type AgentResult, registerAgent, type AgentType } from "./index";
import { generateText } from "@/lib/ai";

async function runClipAgent(payload: Record<string, unknown>): Promise<AgentResult> {
  const { videoUrl, videoPath, heatmapData, viralSegments, startTime: reqStart, endTime: reqEnd, cropMode, outputRatio, generateSubtitles, workspaceId } = payload;
  const startMs = Date.now();

  try {
    const systemPrompt = `You are a viral clip extraction AI at GhostStudio AI. Given video heatmap data or viral segments, analyze and identify the best clips for maximum virality.

Score each clip on:
1. Hook potential (0-100): How strong is the opening?
2. Retention potential (0-100): Will viewers watch to the end?
3. Shareability (0-100): Would someone share this?
4. Emotional impact (0-100): Does it trigger emotion?

Also consider:
- Optimal clip length: 15-60 seconds for social media
- Strong opening within first 3 seconds
- Self-contained narrative (makes sense without context)
- Crops should keep the subject in frame

Return ONLY valid JSON:
{
  "clips": [
    {
      "start": 12.5,
      "end": 45.0,
      "score": 87,
      "reason": "Strong emotional hook at 12.5s, builds to punchline at 40s, perfect 32s length",
      "hookType": "controversial_statement|surprising_fact|story_opening|question|bold_claim",
      "emotionalArc": "curiosity → surprise → satisfaction",
      "suggestedTitle": "Viral clip title",
      "platforms": ["tiktok", "reels", "shorts"]
    }
  ]
}`;

    const segments = (viralSegments || heatmapData) as Array<Record<string, unknown>> | undefined;
    const inputContext = [
      `Video URL: ${videoUrl || videoPath || "unknown"}`,
      reqStart !== undefined ? `Requested start: ${reqStart}s` : "",
      reqEnd !== undefined ? `Requested end: ${reqEnd}s` : "",
      cropMode ? `Crop mode: ${cropMode}` : "",
      outputRatio ? `Output ratio: ${outputRatio}` : "",
      generateSubtitles ? `Subtitles: ${generateSubtitles ? "yes" : "no"}` : "",
      segments ? `\nSegments data:\n${JSON.stringify(segments, null, 2).substring(0, 4000)}` : "",
    ].filter(Boolean).join("\n");

    const result = await generateText({
      prompt: `Identify viral clips from this video data:\n\n${inputContext}`,
      system: systemPrompt,
      temperature: 0.5,
      maxTokens: 2500,
    });

    let parsed: { clips: Array<{ start: number; end: number; score: number; reason: string; hookType: string; emotionalArc: string; suggestedTitle: string; platforms: string[] }> };
    try {
      const text = result.text.trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { clips: [] };
    } catch {
      parsed = { clips: [] };
    }

    return {
      success: true,
      data: {
        clips: parsed.clips || [],
        cropMode: cropMode || "center",
        outputRatio: outputRatio || "9:16",
        generateSubtitles: generateSubtitles !== false,
      },
      metadata: {
        tokensUsed: result.usage?.totalTokens,
        durationMs: Date.now() - startMs,
      },
    };
  } catch (error) {
    console.error("[ClipAgent] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Clip extraction failed",
      metadata: { durationMs: Date.now() - startMs },
    };
  }
}

const clipAgent: Agent = {
  type: "clip" as AgentType,
  name: "Clip Agent",
  description: "Extracts viral clips from videos based on heatmap analysis and engagement scoring",
  category: "video",
  run: runClipAgent,
  execute: async (payload) => {
    const result = await runClipAgent(payload);
    if (!result.success) throw new Error(result.error || "Clip agent failed");
    return result.data ?? {};
  },
};

registerAgent(clipAgent);
export { clipAgent };
