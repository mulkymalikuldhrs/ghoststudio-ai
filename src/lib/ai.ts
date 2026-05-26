// AI helper — uses z-ai-web-dev-sdk for LLM calls
// This is used by the backend only

interface AIGenerateOptions {
  prompt: string;
  system?: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

interface AIGenerateResult {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export async function generateText(options: AIGenerateOptions): Promise<AIGenerateResult> {
  const { prompt, system, temperature = 0.7, maxTokens = 2000 } = options;

  // Use z-ai-web-dev-sdk for AI generation
  try {
    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    const zai = await ZAI.create();
    const response = await zai.chat.completions.create({
      messages: [
        ...(system ? [{ role: "system" as const, content: system }] : []),
        { role: "user" as const, content: prompt },
      ],
      temperature,
      max_tokens: maxTokens,
    });

    const content = response.choices?.[0]?.message?.content || "";
    return {
      text: content,
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens || 0,
            completionTokens: response.usage.completion_tokens || 0,
            totalTokens: (response.usage.prompt_tokens || 0) + (response.usage.completion_tokens || 0),
          }
        : undefined,
    };
  } catch (error) {
    console.error("AI generation error:", error);
    throw new Error("AI generation failed");
  }
}

export async function generateJSON<T>(options: AIGenerateOptions): Promise<T> {
  const result = await generateText({
    ...options,
    system: `${options.system || ""}\n\nYou must respond with valid JSON only. No markdown, no explanation, just JSON.`.trim(),
    temperature: options.temperature ?? 0.3,
  });

  try {
    return JSON.parse(result.text) as T;
  } catch {
    throw new Error("AI returned invalid JSON");
  }
}

// Prompt templates for common tasks
export const PROMPTS = {
  draftArticle: (topic: string, angle: string, tone: string) =>
    `Write a comprehensive article about "${topic}" with the angle: "${angle}". Use a ${tone} tone. Write in markdown format with proper headings, lists, and formatting.`,

  humanizeContent: (content: string) =>
    `Rewrite the following content to sound more human and natural. Remove robotic patterns, generic phrases, and AI-typical language. Keep the meaning intact but make it feel like an expert wrote it personally.\n\n${content}`,

  seoOptimize: (content: string, keyword: string) =>
    `Optimize the following content for SEO with the focus keyword: "${keyword}". Add meta title, meta description, improve headings structure, suggest internal links, and ensure proper keyword density.\n\n${content}`,

  generateScript: (prompt: string, niche: string, duration: number) =>
    `Create a ${duration}-second video script for a ${niche} niche video. Prompt: "${prompt}". Format as JSON array of scenes with: { order, narration, visualDescription, duration }.`,

  scoreContent: (content: string) =>
    `Score this content on 4 dimensions (0-100): quality (writing quality, structure), humanic (how human/natural it sounds), seo (SEO optimization), trust (source credibility, accuracy). Return JSON: { quality, humanic, seo, trust, feedback }.\n\n${content}`,

  generateVariant: (content: string, platform: string) =>
    `Adapt the following content for ${platform}. Change the format, tone, length, and style to match ${platform}'s best practices while keeping the core message.\n\n${content}`,
};
