// Scoring Agent — Scores content on 4 dimensions with weighted composite
// Quality (30%), Humanic (30%), SEO (20%), Trust (20%)
// Determines action: auto_schedule (80+), human_review (60-79), reject_rewrite (<60)

import { type Agent, type AgentResult, registerAgent, type AgentType } from "./index";
import { generateText } from "@/lib/ai";

interface ScoreDimension {
  score: number;
  subMetrics: Record<string, number>;
  feedback: string;
}

interface ScoringResult {
  qualityScore: number;
  humanicScore: number;
  seoScore: number;
  trustScore: number;
  compositeScore: number;
  action: "auto_schedule" | "human_review" | "reject_rewrite";
  details: {
    quality: ScoreDimension;
    humanic: ScoreDimension;
    seo: ScoreDimension;
    trust: ScoreDimension;
  };
}

async function runScoringAgent(payload: Record<string, unknown>): Promise<AgentResult> {
  const { content, markdown, seoData } = payload;
  const inputContent = (content || markdown) as string;
  const startTime = Date.now();

  if (!inputContent) {
    return {
      success: false,
      error: "No content provided for scoring",
    };
  }

  try {
    const systemPrompt = `You are a content quality evaluator at GhostStudio AI. Score the given content across 4 dimensions using strict criteria.

SCORING DIMENSIONS:

1. QUALITY (30% weight):
   - Writing Craft (0-100): Grammar, vocabulary, sentence variety, flow
   - Structure (0-100): Logical progression, heading hierarchy, paragraph balance
   - Depth (0-100): Originality of thought, concrete examples, actionable insights

2. HUMANIC (30% weight):
   - Natural Voice (0-100): Absence of AI patterns, reads like a human expert wrote it
   - Personality (0-100): Opinions, anecdotes, subjective takes present
   - Variability (0-100): Sentence/paragraph length variation, no repetitive structures

3. SEO (20% weight):
   - Keyword Optimization (0-100): Primary keyword usage, natural integration
   - Structure Signals (0-100): Heading hierarchy, meta-ready title, scannable format
   - Link Worthiness (0-100): Would other sites link to this? Unique value proposition

4. TRUST (20% weight):
   - Source Credibility (0-100): Specific data points, named sources, concrete claims
   - Accuracy Signals (0-100): Factual precision, no vague generalizations
   - Author Authority (0-100): Demonstrates real expertise, not surface-level knowledge

COMPOSITE = Quality*0.30 + Humanic*0.30 + SEO*0.20 + Trust*0.20
ACTION: auto_schedule (80+), human_review (60-79), reject_rewrite (<60)

Return ONLY valid JSON:
{
  "qualityScore": 75,
  "humanicScore": 80,
  "seoScore": 65,
  "trustScore": 70,
  "compositeScore": 73,
  "action": "human_review",
  "details": {
    "quality": { "score": 75, "subMetrics": { "writingCraft": 80, "structure": 70, "depth": 75 }, "feedback": "..." },
    "humanic": { "score": 80, "subMetrics": { "naturalVoice": 85, "personality": 75, "variability": 80 }, "feedback": "..." },
    "seo": { "score": 65, "subMetrics": { "keywordOptimization": 70, "structureSignals": 60, "linkWorthiness": 65 }, "feedback": "..." },
    "trust": { "score": 70, "subMetrics": { "sourceCredibility": 65, "accuracySignals": 70, "authorAuthority": 75 }, "feedback": "..." }
  }
}`;

    const seoContext = seoData ? `\n\nSEO DATA AVAILABLE:\n${JSON.stringify(seoData)}` : "";

    const userPrompt = `Score this content across all 4 dimensions with sub-metrics:

${inputContent.substring(0, 6000)}${seoContext}`;

    const result = await generateText({
      prompt: userPrompt,
      system: systemPrompt,
      temperature: 0.2,
      maxTokens: 2500,
    });

    let parsed: ScoringResult;
    try {
      const text = result.text.trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("[ScoringAgent] Failed to parse scoring response:", parseError);
      return {
        success: false,
        error: "Failed to parse scoring results",
        metadata: { durationMs: Date.now() - startTime },
      };
    }

    // Calculate composite and action deterministically
    const qualityScore = Number(parsed.qualityScore) || 0;
    const humanicScore = Number(parsed.humanicScore) || 0;
    const seoScore = Number(parsed.seoScore) || 0;
    const trustScore = Number(parsed.trustScore) || 0;
    const compositeScore = Math.round(qualityScore * 0.3 + humanicScore * 0.3 + seoScore * 0.2 + trustScore * 0.2);

    let action: "auto_schedule" | "human_review" | "reject_rewrite";
    if (compositeScore >= 80) action = "auto_schedule";
    else if (compositeScore >= 60) action = "human_review";
    else action = "reject_rewrite";

    return {
      success: true,
      data: {
        qualityScore,
        humanicScore,
        seoScore,
        trustScore,
        compositeScore,
        action,
        details: parsed.details || {},
      },
      metadata: {
        tokensUsed: result.usage?.totalTokens,
        durationMs: Date.now() - startTime,
      },
    };
  } catch (error) {
    console.error("[ScoringAgent] Error scoring content:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Scoring failed",
      metadata: { durationMs: Date.now() - startTime },
    };
  }
}

const scoringAgent: Agent = {
  type: "scoring" as AgentType,
  name: "Scoring Agent",
  description: "Evaluates content quality across 4 dimensions: Quality, Humanic, SEO, Trust",
  category: "analytics",
  run: runScoringAgent,
  execute: async (payload) => {
    const result = await runScoringAgent(payload);
    if (!result.success) throw new Error(result.error || "Scoring agent failed");
    return result.data ?? {};
  },
};

registerAgent(scoringAgent);
export { scoringAgent };
