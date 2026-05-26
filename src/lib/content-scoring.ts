/**
 * Content Scoring System — AI-powered content quality assessment
 *
 * Scores content across four dimensions:
 *   1. Writing Quality — clarity, redundancy, rhythm, grammar
 *   2. Humanic Score — anti-robotic, tone consistency, natural phrasing
 *   3. SEO Score — keyword alignment, heading quality, readability
 *   4. Trust Score — source quality, hallucination risk, confidence
 *
 * All scoring uses z-ai-web-dev-sdk for AI-based analysis.
 */

import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';

// ─── Type Definitions ────────────────────────────────────────────────────────

export interface WritingScore {
  overall: number;
  clarity: number;
  redundancy: number;
  rhythm: number;
  grammar: number;
}

export interface HumanicScore {
  overall: number;
  antiRobotic: number;
  toneConsistency: number;
  naturalPhrasing: number;
}

export interface SeoScore {
  overall: number;
  keywordAlignment: number;
  headingQuality: number;
  readability: number;
}

export interface TrustScore {
  overall: number;
  sourceQuality: number;
  hallucinationRisk: number; // Lower is better (0 = no risk, 100 = high risk)
  confidence: number;
}

export interface CompositeScore {
  score: number;
  action: 'auto_schedule' | 'human_review' | 'reject_rewrite';
  breakdown: {
    writing: number;
    humanic: number;
    seo: number;
    trust: number;
  };
}

export type QualityAction = 'auto_schedule' | 'human_review' | 'reject_rewrite';

// ─── Weight Configuration ────────────────────────────────────────────────────

export const SCORE_WEIGHTS = {
  writing: 0.30,
  humanic: 0.30,
  seo: 0.20,
  trust: 0.20,
};

export const ACTION_THRESHOLDS = {
  auto_schedule: 80,
  human_review: 60,
  reject_rewrite: 0,
};

// ─── ZAI Singleton ───────────────────────────────────────────────────────────

let zaiInstance: ZAI | null = null;

async function getZAI(): Promise<ZAI> {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

// ─── Core AI Scoring Call ────────────────────────────────────────────────────

async function aiScore(
  systemPrompt: string,
  content: string
): Promise<string> {
  const zai = await getZAI();

  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content },
    ],
    thinking: { type: 'disabled' },
  });

  return completion.choices[0]?.message?.content || '';
}

// ─── Score Writing ───────────────────────────────────────────────────────────

export async function scoreWriting(markdown: string): Promise<WritingScore> {
  const systemPrompt = `You are an expert writing quality analyst. Analyze the given markdown text and score it on four dimensions (0-100 each):

1. **Clarity** (0-100): Is the message clear and unambiguous? Are ideas expressed directly?
2. **Redundancy** (0-100, where 100 = no redundancy): Is there unnecessary repetition? Does every sentence add value?
3. **Rhythm** (0-100): Does the prose flow naturally? Is there variety in sentence length and structure?
4. **Grammar** (0-100): Are there grammatical errors, typos, or awkward constructions?

Also provide an overall score (0-100) as a weighted average.

Return ONLY a JSON object:
{
  "overall": 82,
  "clarity": 85,
  "redundancy": 78,
  "rhythm": 80,
  "grammar": 88
}`;

  try {
    const response = await aiScore(systemPrompt, markdown.slice(0, 4000));
    return parseScoringResponse<WritingScore>(response, {
      overall: 50,
      clarity: 50,
      redundancy: 50,
      rhythm: 50,
      grammar: 50,
    });
  } catch (error) {
    await logScoringError('writing_score_failed', error);
    return { overall: 50, clarity: 50, redundancy: 50, rhythm: 50, grammar: 50 };
  }
}

// ─── Score Humanic ───────────────────────────────────────────────────────────

export async function scoreHumanic(markdown: string): Promise<HumanicScore> {
  const systemPrompt = `You are an AI-detection expert who can distinguish between human and AI writing. Analyze the given text and score it on three dimensions (0-100 each):

1. **Anti-Robotic** (0-100, where 100 = sounds fully human): Does the text sound like it was written by a human? Watch for:
   - Generic transitions ("Furthermore", "Additionally", "In conclusion")
   - Repetitive sentence structures
   - Hedging language ("might", "could potentially")
   - Perfect grammar with no personality
   - Lack of specific details or personal perspective

2. **Tone Consistency** (0-100): Is the voice consistent throughout? Does the personality feel authentic?

3. **Natural Phrasing** (0-100): Does it use natural language patterns? Are there contractions, colloquialisms, and human speech patterns?

Also provide an overall humanic score (0-100).

Return ONLY a JSON object:
{
  "overall": 75,
  "antiRobotic": 72,
  "toneConsistency": 80,
  "naturalPhrasing": 73
}`;

  try {
    const response = await aiScore(systemPrompt, markdown.slice(0, 4000));
    return parseScoringResponse<HumanicScore>(response, {
      overall: 50,
      antiRobotic: 50,
      toneConsistency: 50,
      naturalPhrasing: 50,
    });
  } catch (error) {
    await logScoringError('humanic_score_failed', error);
    return { overall: 50, antiRobotic: 50, toneConsistency: 50, naturalPhrasing: 50 };
  }
}

// ─── Score SEO ───────────────────────────────────────────────────────────────

export interface SeoDataInput {
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  secondaryKeywords?: string[];
  slug?: string;
  headingStructure?: string;
  content?: string;
  readabilityScore?: number;
}

export async function scoreSeo(seoData: SeoDataInput): Promise<SeoScore> {
  const systemPrompt = `You are an SEO quality analyst. Analyze the given SEO data and score it on three dimensions (0-100 each):

1. **Keyword Alignment** (0-100): Are the focus and secondary keywords well-chosen? Do they match search intent? Are they naturally integrated?

2. **Heading Quality** (0-100): Is the heading structure logical and keyword-optimized? Does it follow H1→H2→H3 hierarchy?

3. **Readability** (0-100): Is the content readable for the target audience? Consider sentence length, paragraph structure, and complexity.

Also provide an overall SEO score (0-100).

Return ONLY a JSON object:
{
  "overall": 78,
  "keywordAlignment": 82,
  "headingQuality": 75,
  "readability": 76
}`;

  const seoSummary = `
Meta Title: ${seoData.metaTitle || 'N/A'}
Meta Description: ${seoData.metaDescription || 'N/A'}
Focus Keyword: ${seoData.focusKeyword || 'N/A'}
Secondary Keywords: ${seoData.secondaryKeywords?.join(', ') || 'N/A'}
Slug: ${seoData.slug || 'N/A'}
Heading Structure: ${seoData.headingStructure || 'N/A'}
Content Preview: ${seoData.content?.slice(0, 1500) || 'N/A'}
Readability Score: ${seoData.readabilityScore || 'N/A'}`;

  try {
    const response = await aiScore(systemPrompt, seoSummary);
    return parseScoringResponse<SeoScore>(response, {
      overall: 50,
      keywordAlignment: 50,
      headingQuality: 50,
      readability: 50,
    });
  } catch (error) {
    await logScoringError('seo_score_failed', error);
    return { overall: 50, keywordAlignment: 50, headingQuality: 50, readability: 50 };
  }
}

// ─── Score Trust ─────────────────────────────────────────────────────────────

export interface SourceData {
  sources?: string[];
  claims?: string[];
  content?: string;
  topic?: string;
}

export async function scoreTrust(sources: SourceData): Promise<TrustScore> {
  const systemPrompt = `You are a factual accuracy and trustworthiness analyst. Analyze the given content and sources, then score on three dimensions (0-100 each):

1. **Source Quality** (0-100): Are the sources authoritative, relevant, and credible? Are claims properly supported?

2. **Hallucination Risk** (0-100, where 0 = no risk and 100 = extreme risk): Could any claims be fabricated? Are there unsupported assertions? Are there specific, verifiable details?

3. **Confidence** (0-100): How confident are you in the overall factual accuracy of this content?

Also provide an overall trust score (0-100).

Return ONLY a JSON object:
{
  "overall": 72,
  "sourceQuality": 75,
  "hallucinationRisk": 20,
  "confidence": 70
}`;

  const sourceSummary = `
Topic: ${sources.topic || 'N/A'}
Sources: ${sources.sources?.join('\n') || 'No sources provided'}
Claims: ${sources.claims?.join('\n') || 'No claims extracted'}
Content Preview: ${sources.content?.slice(0, 2000) || 'N/A'}`;

  try {
    const response = await aiScore(systemPrompt, sourceSummary);
    return parseScoringResponse<TrustScore>(response, {
      overall: 50,
      sourceQuality: 50,
      hallucinationRisk: 50,
      confidence: 50,
    });
  } catch (error) {
    await logScoringError('trust_score_failed', error);
    return { overall: 50, sourceQuality: 50, hallucinationRisk: 50, confidence: 50 };
  }
}

// ─── Calculate Composite Score ───────────────────────────────────────────────

export function calculateCompositeScore(
  writing: WritingScore,
  humanic: HumanicScore,
  seo: SeoScore,
  trust: TrustScore
): CompositeScore {
  const writingWeighted = writing.overall * SCORE_WEIGHTS.writing;
  const humanicWeighted = humanic.overall * SCORE_WEIGHTS.humanic;
  const seoWeighted = seo.overall * SCORE_WEIGHTS.seo;
  const trustWeighted = trust.overall * SCORE_WEIGHTS.trust;

  // Adjust trust score to account for hallucination risk (lower risk = higher score)
  const trustAdjusted = trust.overall - (trust.hallucinationRisk * 0.3);
  const trustFinal = Math.max(0, Math.min(100, trustAdjusted));
  const trustFinalWeighted = trustFinal * SCORE_WEIGHTS.trust;

  const composite = Math.round(
    writingWeighted + humanicWeighted + seoWeighted + trustFinalWeighted
  );

  const action = getQualityAction(composite);

  return {
    score: composite,
    action,
    breakdown: {
      writing: writing.overall,
      humanic: humanic.overall,
      seo: seo.overall,
      trust: trustFinal,
    },
  };
}

// ─── Get Quality Action ──────────────────────────────────────────────────────

export function getQualityAction(score: number): QualityAction {
  if (score >= ACTION_THRESHOLDS.auto_schedule) {
    return 'auto_schedule';
  }
  if (score >= ACTION_THRESHOLDS.human_review) {
    return 'human_review';
  }
  return 'reject_rewrite';
}

// ─── Full Scoring Pipeline ───────────────────────────────────────────────────

export async function scoreContentFull(
  markdown: string,
  seoData?: SeoDataInput,
  sourceData?: SourceData
): Promise<{
  writing: WritingScore;
  humanic: HumanicScore;
  seo: SeoScore;
  trust: TrustScore;
  composite: CompositeScore;
}> {
  // Run all scoring in parallel for efficiency
  const [writing, humanic, seo, trust] = await Promise.all([
    scoreWriting(markdown),
    scoreHumanic(markdown),
    scoreSeo(seoData || { content: markdown }),
    scoreTrust(sourceData || { content: markdown }),
  ]);

  const composite = calculateCompositeScore(writing, humanic, seo, trust);

  // Log the scoring result
  await logScoringAction('content_scored', markdown.slice(0, 100), composite.score, composite.action);

  return { writing, humanic, seo, trust, composite };
}

// ─── Quick Score (Single Pass) ───────────────────────────────────────────────

export async function quickScore(content: string): Promise<CompositeScore> {
  const systemPrompt = `You are a content quality auditor. Provide a quick quality assessment of this content.

Score on a 0-100 scale considering:
- Writing quality (clarity, grammar, flow)
- Human-like quality (sounds natural, not robotic)
- SEO potential (keywords, structure, readability)
- Trustworthiness (factual, sourced, confident)

Return ONLY a JSON object with scores 0-100:
{
  "writing": 82,
  "humanic": 75,
  "seo": 78,
  "trust": 70
}`;

  try {
    const response = await aiScore(systemPrompt, content.slice(0, 3000));
    const parsed = parseScoringResponse<{ writing: number; humanic: number; seo: number; trust: number }>(
      response,
      { writing: 50, humanic: 50, seo: 50, trust: 50 }
    );

    const composite = calculateCompositeScore(
      { overall: parsed.writing, clarity: parsed.writing, redundancy: parsed.writing, rhythm: parsed.writing, grammar: parsed.writing },
      { overall: parsed.humanic, antiRobotic: parsed.humanic, toneConsistency: parsed.humanic, naturalPhrasing: parsed.humanic },
      { overall: parsed.seo, keywordAlignment: parsed.seo, headingQuality: parsed.seo, readability: parsed.seo },
      { overall: parsed.trust, sourceQuality: parsed.trust, hallucinationRisk: 20, confidence: parsed.trust }
    );

    return composite;
  } catch (error) {
    await logScoringError('quick_score_failed', error);
    return {
      score: 0,
      action: 'human_review',
      breakdown: { writing: 0, humanic: 0, seo: 0, trust: 0 },
    };
  }
}

// ─── Save Scores to Content Item ─────────────────────────────────────────────

export async function saveContentScores(
  contentId: string,
  composite: CompositeScore
): Promise<void> {
  try {
    await db.contentItem.update({
      where: { id: contentId },
      data: {
        qualityScore: composite.score,
        humanicScore: composite.breakdown.humanic,
        seoScore: composite.breakdown.seo,
        trustScore: composite.breakdown.trust,
        humanReviewRequired: composite.action === 'human_review' || composite.action === 'reject_rewrite',
      },
    });
  } catch (error) {
    await logScoringError('save_scores_failed', error);
  }
}

// ─── Helper: Parse Scoring Response ──────────────────────────────────────────

function parseScoringResponse<T>(
  response: string,
  fallback: T
): T {
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = response.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : response;

    // Find JSON object
    const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!objectMatch) return fallback;

    const parsed = JSON.parse(objectMatch[0]);

    // Validate and clamp all numeric values to 0-100
    const result = { ...fallback } as Record<string, unknown>;
    for (const key of Object.keys(fallback as Record<string, unknown>)) {
      const value = parsed[key];
      if (typeof value === 'number' && !isNaN(value)) {
        result[key] = Math.max(0, Math.min(100, Math.round(value)));
      }
    }

    return result as T;
  } catch {
    return fallback;
  }
}

// ─── Logging ─────────────────────────────────────────────────────────────────

async function logScoringAction(
  action: string,
  contentPreview: string,
  score: number,
  qualityAction: string
): Promise<void> {
  try {
    await db.systemLog.create({
      data: {
        service: 'scoring',
        level: 'info',
        action,
        message: `Content scored: ${score}/100 — action: ${qualityAction}`,
        metadataJson: JSON.stringify({ contentPreview, score, qualityAction }),
      },
    });
  } catch {
    // Logging failure should not break scoring
  }
}

async function logScoringError(action: string, error: unknown): Promise<void> {
  try {
    await db.systemLog.create({
      data: {
        service: 'scoring',
        level: 'error',
        action,
        message: `Scoring error: ${action}`,
        metadataJson: JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
        }),
      },
    });
  } catch {
    // Logging failure should not break scoring
  }
}
