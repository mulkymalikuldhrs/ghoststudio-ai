// Caption Agent — Generates captions and subtitles for video content
// Supports multiple formats: SRT, VTT, burned-in styles

import { type Agent, type AgentResult, registerAgent, type AgentType } from "./index";
import { generateText } from "@/lib/ai";

async function runCaptionAgent(payload: Record<string, unknown>): Promise<AgentResult> {
  const { narration, script, scenes, format, style, language, workspaceId } = payload;
  const inputNarration = (narration || script) as string;
  const inputScenes = scenes as Array<{ narration?: string; duration?: number }> | undefined;
  const inputFormat = (format || "srt") as string;
  const inputStyle = (style || "default") as string;
  const startTime = Date.now();

  if (!inputNarration && !inputScenes) {
    return { success: false, error: "No narration or scenes provided for caption generation" };
  }

  try {
    const systemPrompt = `You are a caption/subtitle generation AI at GhostStudio AI. Create properly timed captions for video content.

Caption styles available:
- default: Standard white text with black outline
- karaoke: Word-by-word highlighting (like karaoke)
- bold_center: Large bold text centered at bottom
- animated: Text appears with animation timing
- minimal: Small, clean, subtle captions

Output format: ${inputFormat.toUpperCase()}

Rules:
1. Each caption should be 1-2 lines max
2. Break at natural pauses (commas, periods, clauses)
3. Display duration should match reading speed (~15 chars/second)
4. No caption should display for less than 1 second
5. Include timing for each segment

Return ONLY valid JSON:
{
  "captions": [
    { "index": 1, "startTime": 0.0, "endTime": 3.5, "text": "Caption text line 1" },
    { "index": 2, "startTime": 3.5, "endTime": 7.0, "text": "Caption text line 2" }
  ],
  "format": "${inputFormat}",
  "style": "${inputStyle}",
  "totalDuration": 60.0,
  "wordCount": 150,
  "formattedOutput": "The complete formatted caption string in ${inputFormat.toUpperCase()} format"
}`;

    const narrationText = inputNarration || (inputScenes || []).map((s) => s.narration || "").filter(Boolean).join(" ");
    const scenesContext = inputScenes ? `\n\nScene timing data:\n${JSON.stringify(inputScenes.map((s) => ({ narration: s.narration, duration: s.duration })), null, 2)}` : "";

    const result = await generateText({
      prompt: `Generate captions for this narration:\n\n${narrationText.substring(0, 4000)}${scenesContext}\n\nFormat: ${inputFormat}\nStyle: ${inputStyle}\nLanguage: ${language || "en-US"}`,
      system: systemPrompt,
      temperature: 0.3,
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
        captions: parsed.captions || [],
        format: inputFormat,
        style: inputStyle,
        totalDuration: parsed.totalDuration || 0,
        wordCount: parsed.wordCount || 0,
        formattedOutput: parsed.formattedOutput || "",
      },
      metadata: {
        tokensUsed: result.usage?.totalTokens,
        durationMs: Date.now() - startTime,
      },
    };
  } catch (error) {
    console.error("[CaptionAgent] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Caption generation failed",
      metadata: { durationMs: Date.now() - startTime },
    };
  }
}

const captionAgent: Agent = {
  type: "caption" as AgentType,
  name: "Caption Agent",
  description: "Generates captions and subtitles for video content in multiple formats",
  category: "video",
  run: runCaptionAgent,
  execute: async (payload) => {
    const result = await runCaptionAgent(payload);
    if (!result.success) throw new Error(result.error || "Caption agent failed");
    return result.data ?? {};
  },
};

registerAgent(captionAgent);
export { captionAgent };
