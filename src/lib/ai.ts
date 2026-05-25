import ZAI from "z-ai-web-dev-sdk";

export const SYSTEM_PROMPT = `You are GhostStudio AI, an expert content creation engine for faceless video channels.

Your capabilities:
- Generate viral video scripts for TikTok, YouTube Shorts, Instagram Reels
- Create engaging hooks, narrations, and CTAs
- Adapt tone for different niches (horror, motivation, crypto, anime, education, etc.)
- Structure content for maximum retention and engagement
- Write scene descriptions for AI-generated visuals

Rules:
- Keep scripts concise and punchy (30-60 seconds for shorts)
- Use strong hooks in the first 3 seconds
- Include visual scene descriptions for each section
- Optimize for viewer retention
- Add relevant hashtags
- Never use copyrighted content
- Always include a clear CTA

Format your script output as JSON with this structure:
{
  "title": "Video Title",
  "hook": "First 3 seconds hook",
  "scenes": [
    {
      "id": 1,
      "narration": "Voiceover text",
      "visual": "Scene description for image generation",
      "duration": 5,
      "subtitle": "On-screen text"
    }
  ],
  "cta": "Call to action",
  "hashtags": ["#tag1", "#tag2"]
}`;

let zaiInstance: ZAI | null = null;

export async function getZAI(): Promise<ZAI> {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

export async function generateScript(
  prompt: string,
  niche: string,
  duration: number = 30
): Promise<string> {
  const zai = await getZAI();
  const completion = await zai.chat.completions.create({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Generate a ${duration}-second faceless video script about: "${prompt}" in the ${niche} niche. Return the script as valid JSON.`,
      },
    ],
    thinking: { type: "disabled" },
  });
  return completion.choices[0]?.message?.content || "";
}

export async function refineScript(
  currentScript: string,
  feedback: string
): Promise<string> {
  const zai = await getZAI();
  const completion = await zai.chat.completions.create({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Refine this video script based on the feedback. Return the updated script as valid JSON.\n\nCurrent Script:\n${currentScript}\n\nFeedback: ${feedback}`,
      },
    ],
    thinking: { type: "disabled" },
  });
  return completion.choices[0]?.message?.content || "";
}

export async function generateSceneDescription(
  narration: string,
  style: string
): Promise<string> {
  const zai = await getZAI();
  const completion = await zai.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "You generate detailed visual scene descriptions for AI video generation. Be vivid and cinematic.",
      },
      {
        role: "user",
        content: `Generate a ${style} style visual description for this narration: "${narration}"`,
      },
    ],
    thinking: { type: "disabled" },
  });
  return completion.choices[0]?.message?.content || "";
}

export async function aiChat(
  messages: { role: "system" | "user" | "assistant"; content: string }[]
) {
  const zai = await getZAI();
  const completion = await zai.chat.completions.create({
    messages,
    thinking: { type: "disabled" },
  });
  return completion.choices[0]?.message?.content || "";
}
