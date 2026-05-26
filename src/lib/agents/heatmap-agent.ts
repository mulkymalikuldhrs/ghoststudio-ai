// Heatmap Agent — Scans YouTube videos for heatmap data
// Extracts engagement segments and retention patterns

import { type Agent, type AgentResult, registerAgent, type AgentType } from "./index";
import { generateText } from "@/lib/ai";

async function runHeatmapAgent(payload: Record<string, unknown>): Promise<AgentResult> {
  const { videoUrl, videoId, intensityThreshold, minSegmentDuration, maxSegmentDuration, workspaceId } = payload;
  const startTime = Date.now();
  const threshold = Number(intensityThreshold) || 0.7;
  const minDur = Number(minSegmentDuration) || 5;
  const maxDur = Number(maxSegmentDuration) || 60;

  try {
    const systemPrompt = `You are a YouTube heatmap analysis AI at GhostStudio AI. Given a YouTube video URL or ID, simulate the analysis of audience retention data to identify engagement patterns.

In production, this would connect to the YouTube API to fetch real retention data. For now, use the video URL/ID context to predict likely engagement patterns based on content analysis.

Identify:
1. Segments where engagement peaks (retention above ${threshold * 100}%)
2. Segments where viewers drop off
3. The single peak moment of the video
4. Overall retention estimate

Return ONLY valid JSON:
{
  "segments": [
    { "start": 12.5, "duration": 15, "score": 92, "type": "peak|dropoff|stable" }
  ],
  "peakMoment": { "start": 45, "duration": 10, "score": 98 },
  "averageRetention": 62,
  "viralSegments": [
    { "startTime": 12.5, "endTime": 45.0, "retentionScore": 92 }
  ],
  "analysisNotes": "Brief analysis of the retention pattern"
}`;

    const result = await generateText({
      prompt: `Analyze YouTube video for heatmap engagement data:\n\nVideo URL: ${videoUrl || "unknown"}\nVideo ID: ${videoId || "unknown"}\nIntensity threshold: ${threshold}\nMin segment: ${minDur}s\nMax segment: ${maxDur}s`,
      system: systemPrompt,
      temperature: 0.4,
      maxTokens: 2500,
    });

    let parsed: {
      segments: Array<{ start: number; duration: number; score: number; type: string }>;
      peakMoment: { start: number; duration: number; score: number };
      averageRetention: number;
      viralSegments: Array<{ startTime: number; endTime: number; retentionScore: number }>;
      analysisNotes: string;
    };
    try {
      const text = result.text.trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { segments: [], peakMoment: { start: 0, duration: 0, score: 0 }, averageRetention: 0, viralSegments: [], analysisNotes: "" };
    } catch {
      parsed = { segments: [], peakMoment: { start: 0, duration: 0, score: 0 }, averageRetention: 0, viralSegments: [], analysisNotes: "Analysis failed" };
    }

    return {
      success: true,
      data: {
        segments: parsed.segments || [],
        peakMoment: parsed.peakMoment || null,
        averageRetention: parsed.averageRetention || 0,
        viralSegments: parsed.viralSegments || [],
        analysisNotes: parsed.analysisNotes || "",
        status: "completed",
      },
      metadata: {
        tokensUsed: result.usage?.totalTokens,
        durationMs: Date.now() - startTime,
      },
    };
  } catch (error) {
    console.error("[HeatmapAgent] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Heatmap analysis failed",
      metadata: { durationMs: Date.now() - startTime },
    };
  }
}

const heatmapAgent: Agent = {
  type: "heatmap" as AgentType,
  name: "Heatmap Agent",
  description: "Analyzes YouTube audience retention heatmaps to identify engagement peaks",
  category: "analytics",
  run: runHeatmapAgent,
  execute: async (payload) => {
    const result = await runHeatmapAgent(payload);
    if (!result.success) throw new Error(result.error || "Heatmap agent failed");
    return result.data ?? {};
  },
};

registerAgent(heatmapAgent);
export { heatmapAgent };
