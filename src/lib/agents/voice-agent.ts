// Voice Agent — Selects appropriate TTS voice and generates narration timing

import { type Agent, type AgentResult, registerAgent, type AgentType } from "./index";
import { generateText } from "@/lib/ai";

const AVAILABLE_VOICES: Record<string, { id: string; gender: string; description: string }> = {
  alloy: { id: "alloy", gender: "neutral", description: "Balanced, versatile, clear" },
  echo: { id: "echo", gender: "male", description: "Warm, authoritative, deep" },
  fable: { id: "fable", gender: "neutral", description: "Expressive, storytelling" },
  onyx: { id: "onyx", gender: "male", description: "Deep, serious, dramatic" },
  nova: { id: "nova", gender: "female", description: "Energetic, friendly, engaging" },
  shimmer: { id: "shimmer", gender: "female", description: "Soft, calm, professional" },
};

async function runVoiceAgent(payload: Record<string, unknown>): Promise<AgentResult> {
  const { text, voiceId, voice, speed, language, style, workspaceId } = payload;
  const inputText = text as string;
  const startTime = Date.now();

  if (!inputText) {
    return { success: false, error: "No text provided for voice generation" };
  }

  try {
    const systemPrompt = `You are a voice direction AI at GhostStudio AI. Given narration text and context, you must:
1. Select the best TTS voice from available options
2. Break the text into narration segments with timing estimates
3. Add pronunciation hints for difficult words

Available voices:
${Object.entries(AVAILABLE_VOICES).map(([, v]) => `- ${v.id}: ${v.gender}, ${v.description}`).join("\n")}

Consider the content style when selecting voice:
- Educational → echo or shimmer
- Motivational → nova or onyx
- Horror → onyx
- Storytelling → fable
- Professional → alloy or shimmer
- Casual → nova or alloy

Return ONLY valid JSON:
{
  "voiceId": "selected_voice_id",
  "voiceReason": "Why this voice was selected",
  "narrationSegments": [
    { "text": "segment text", "durationEstimate": 5.2, "emphasis": ["key", "words"] }
  ],
  "totalDurationEstimate": 32.5,
  "pacingNotes": "Any notes on pacing, pauses, emphasis"
}`;

    const result = await generateText({
      prompt: `Select voice and break into narration segments:\n\nText: "${inputText}"\n${voiceId || voice ? `Preferred voice: ${voiceId || voice}` : ""}\n${style ? `Style: ${style}` : ""}\n${language ? `Language: ${language}` : "Language: en-US"}`,
      system: systemPrompt,
      temperature: 0.3,
      maxTokens: 2000,
    });

    let parsed: {
      voiceId: string;
      voiceReason: string;
      narrationSegments: Array<{ text: string; durationEstimate: number; emphasis: string[] }>;
      totalDurationEstimate: number;
      pacingNotes: string;
    };
    try {
      const text = result.text.trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { voiceId: "alloy", voiceReason: "Default", narrationSegments: [], totalDurationEstimate: 0, pacingNotes: "" };
    } catch {
      // Fallback: estimate timing from word count
      const words = inputText.split(/\s+/).length;
      const estimatedDuration = words / 2.5;
      parsed = {
        voiceId: (voiceId || voice || "alloy") as string,
        voiceReason: "Default selection",
        narrationSegments: [{ text: inputText, durationEstimate: estimatedDuration, emphasis: [] }],
        totalDurationEstimate: estimatedDuration,
        pacingNotes: "Automatic estimation based on word count",
      };
    }

    return {
      success: true,
      data: {
        voiceId: parsed.voiceId,
        voiceReason: parsed.voiceReason,
        narrationSegments: parsed.narrationSegments,
        totalDurationEstimate: parsed.totalDurationEstimate,
        pacingNotes: parsed.pacingNotes,
        speed: speed || 1.0,
        status: "ready",
      },
      metadata: {
        tokensUsed: result.usage?.totalTokens,
        durationMs: Date.now() - startTime,
      },
    };
  } catch (error) {
    console.error("[VoiceAgent] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Voice generation failed",
      metadata: { durationMs: Date.now() - startTime },
    };
  }
}

const voiceAgent: Agent = {
  type: "voice" as AgentType,
  name: "Voice Agent",
  description: "Selects TTS voice and generates narration timing segments",
  category: "video",
  run: runVoiceAgent,
  execute: async (payload) => {
    const result = await runVoiceAgent(payload);
    if (!result.success) throw new Error(result.error || "Voice agent failed");
    return result.data ?? {};
  },
};

registerAgent(voiceAgent);
export { voiceAgent };
