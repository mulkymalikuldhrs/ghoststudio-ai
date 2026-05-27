// SEO Agent — Generates comprehensive SEO pack for content
// Meta title, description, keywords, heading structure, schema markup, readability

import { type Agent, type AgentResult, registerAgent, type AgentType } from "./index";
import { generateText } from "@/lib/ai";
import { db } from "@/lib/db";

interface ContentDNA {
  coreVoice?: string;
  sentenceRhythm?: string;
  forbiddenPatterns?: string[];
  emotionalTexture?: string;
  structuralBias?: string;
  voice?: string;
  tone?: string;
  audience?: string;
  perspective?: string;
}

async function getContentDNA(workspaceId?: string): Promise<ContentDNA> {
  if (!workspaceId) return {};
  try {
    const workspace = await db.workspace.findUnique({
      where: { id: workspaceId as string },
      select: { settingsJson: true },
    });
    if (workspace?.settingsJson) {
      const settings = JSON.parse(workspace.settingsJson);
      return settings.contentDNA || settings.dna || {};
    }
  } catch (error) {
    console.error("[SeoAgent] Failed to load Content DNA:", error);
  }
  return {};
}

async function runSeoAgent(payload: Record<string, unknown>): Promise<AgentResult> {
  const { content, markdown, focusKeyword, workspaceId } = payload;
  const inputContent = (content || markdown) as string;
  const startTime = Date.now();

  if (!inputContent) {
    return {
      success: false,
      error: "No content provided for SEO analysis",
    };
  }

  try {
    const dna = await getContentDNA(workspaceId as string | undefined);
    const dnaVoice = dna.coreVoice || dna.voice || "professional yet approachable";
    const dnaTone = dna.emotionalTexture || dna.tone || "informative and engaging";
    const dnaAudience = dna.audience || "knowledgeable professionals";
    const dnaPerspective = dna.perspective || "industry expert with hands-on experience";
    const forbiddenStr = dna.forbiddenPatterns && dna.forbiddenPatterns.length > 0
      ? `\nFORBIDDEN PATTERNS (never use): ${dna.forbiddenPatterns.join(', ')}`
      : '';

    const systemPrompt = `You are an SEO expert at GhostStudio AI. Your job is to generate a complete SEO optimization pack for the given content.

CONTENT DNA ALIGNMENT:
- Voice: ${dnaVoice}
- Emotional Texture: ${dnaTone}
- Target Audience: ${dnaAudience}
- Perspective: ${dnaPerspective}${forbiddenStr}

You must analyze the content and produce:
1. Meta Title: 50-60 characters, compelling, includes primary keyword
2. Meta Description: 150-160 characters, action-oriented, includes keyword
3. Focus Keyword: The primary keyword the content should target
4. Secondary Keywords: 5-8 related long-tail keywords
5. Heading Structure: An optimized H1→H2→H3 hierarchy suggestion (as JSON array of objects with level and text)
6. Internal Links: Suggestions for 3-5 internal link opportunities (as JSON array of objects with anchor_text and suggested_url_topic)
7. Schema Markup: JSON-LD schema (Article or BlogPosting) as a string
8. Readability Score: Estimated Flesch-Kincaid score 0-100

Return ONLY valid JSON in this exact format:
{
  "metaTitle": "...",
  "metaDescription": "...",
  "focusKeyword": "...",
  "secondaryKeywords": ["...", "..."],
  "headingStructure": [{"level": "H1", "text": "..."}, {"level": "H2", "text": "..."}],
  "internalLinks": [{"anchorText": "...", "suggestedUrlTopic": "..."}],
  "schemaMarkup": "{ ... JSON-LD ... }",
  "readabilityScore": 75
}`;

    const userPrompt = `Generate a complete SEO pack for this content${focusKeyword ? ` (suggested focus keyword: ${focusKeyword})` : ""}:

${inputContent.substring(0, 6000)}`;

    const result = await generateText({
      prompt: userPrompt,
      system: systemPrompt,
      temperature: 0.3,
      maxTokens: 3000,
    });

    let parsed: Record<string, unknown>;
    try {
      const text = result.text.trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("[SeoAgent] Failed to parse SEO response:", parseError);
      return {
        success: false,
        error: "Failed to parse SEO analysis results",
        metadata: { durationMs: Date.now() - startTime },
      };
    }

    return {
      success: true,
      data: {
        metaTitle: parsed.metaTitle || "",
        metaDescription: parsed.metaDescription || "",
        focusKeyword: parsed.focusKeyword || focusKeyword || "",
        secondaryKeywords: parsed.secondaryKeywords || [],
        headingStructure: parsed.headingStructure || [],
        internalLinks: parsed.internalLinks || [],
        schemaMarkup: parsed.schemaMarkup || "",
        readabilityScore: parsed.readabilityScore || 0,
      },
      metadata: {
        tokensUsed: result.usage?.totalTokens,
        durationMs: Date.now() - startTime,
      },
    };
  } catch (error) {
    console.error("[SeoAgent] Error generating SEO pack:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "SEO analysis failed",
      metadata: { durationMs: Date.now() - startTime },
    };
  }
}

const seoAgent: Agent = {
  type: "seo" as AgentType,
  name: "SEO Agent",
  description: "Optimizes content for search engines with comprehensive SEO packs",
  category: "content",
  run: runSeoAgent,
  execute: async (payload) => {
    const result = await runSeoAgent(payload);
    if (!result.success) throw new Error(result.error || "SEO agent failed");
    return result.data ?? {};
  },
};

registerAgent(seoAgent);
export { seoAgent };
