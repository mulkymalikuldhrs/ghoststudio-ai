/**
 * AI Orchestrator — The central brain of the AI Media Intelligence OS
 *
 * Routes tasks to appropriate AI models based on complexity:
 *   - Cheap models: tagging, formatting, metadata
 *   - Mid models: summaries, SEO, repurpose
 *   - Premium models: master article, strategic writing, editorial refinement
 *
 * Content Pipeline: idea → draft → humanic edit → SEO → repurpose
 */

import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';

// ─── Model Tier Configuration ────────────────────────────────────────────────

export type ModelTier = 'cheap' | 'mid' | 'premium';

export const MODEL_MAP: Record<ModelTier, string> = {
  cheap: 'openai/gpt-4o-mini',
  mid: 'anthropic/claude-3.5-sonnet',
  premium: 'anthropic/claude-3-opus',
};

// Task-to-tier routing table
export const TASK_MODEL_MAP: Record<string, ModelTier> = {
  tagging: 'cheap',
  formatting: 'cheap',
  metadata: 'cheap',
  summary: 'mid',
  seo: 'mid',
  repurpose: 'mid',
  draft: 'premium',
  master_article: 'premium',
  humanic_rewrite: 'premium',
  editorial: 'premium',
  strategic_writing: 'premium',
  scoring: 'mid',
};

// ─── Type Definitions ────────────────────────────────────────────────────────

export interface DraftInput {
  idea: string;
  sources?: string[];
  angle?: string;
  workspaceId?: string;
  tone?: string;
  targetLength?: number;
}

export interface DraftOutput {
  title: string;
  subtitle: string;
  slug: string;
  markdown: string;
  summary: string;
  tags: string[];
  suggestedAngle: string;
}

export interface HumanicRewriteOutput {
  markdown: string;
  changesApplied: string[];
  humanicScore: number;
}

export interface SeoPack {
  metaTitle: string;
  metaDescription: string;
  slug: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  headingStructure: string;
  schemaMarkup: string;
  readabilityScore: number;
}

export interface RepurposeOutput {
  platform: string;
  title: string;
  body: string;
  variantType: string;
  metadataJson: Record<string, unknown>;
}

export interface ContentScore {
  qualityScore: number;
  humanicScore: number;
  seoScore: number;
  trustScore: number;
  compositeScore: number;
  action: 'auto_schedule' | 'human_review' | 'reject_rewrite';
  details: {
    clarity: number;
    redundancy: number;
    rhythm: number;
    grammar: number;
    antiRobotic: number;
    toneConsistency: number;
    naturalPhrasing: number;
    keywordAlignment: number;
    headingQuality: number;
    sourceQuality: number;
    hallucinationRisk: number;
    confidence: number;
  };
}

export interface AiCallOptions {
  tier?: ModelTier;
  taskType?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

// ─── ZAI Singleton ───────────────────────────────────────────────────────────

let zaiInstance: ZAI | null = null;

async function getZAI(): Promise<ZAI> {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

// ─── Core AI Call Router ─────────────────────────────────────────────────────

export async function aiCall(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options: AiCallOptions = {}
): Promise<string> {
  const { tier, taskType, systemPrompt, temperature = 0.7 } = options;

  // Determine model tier from task type or explicit tier
  const resolvedTier = tier || (taskType ? TASK_MODEL_MAP[taskType] : 'mid');
  const model = MODEL_MAP[resolvedTier];

  const zai = await getZAI();

  const finalMessages = systemPrompt
    ? [{ role: 'system' as const, content: systemPrompt }, ...messages]
    : messages;

  try {
    const completion = await zai.chat.completions.create({
      messages: finalMessages,
      thinking: { type: 'disabled' },
    });

    const content = completion.choices[0]?.message?.content || '';

    // Log the AI call
    await logAiAction(resolvedTier, model, taskType || 'unknown', content.length);

    return content;
  } catch (error) {
    await logAiError(resolvedTier, model, taskType || 'unknown', error);
    throw new Error(
      `AI call failed [tier=${resolvedTier}, model=${model}]: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ─── Pipeline Step 1: Generate Draft ─────────────────────────────────────────

export async function generateDraft(input: DraftInput): Promise<DraftOutput> {
  const { idea, sources = [], angle, tone = 'professional', targetLength = 2000 } = input;

  const sourcesSection = sources.length > 0
    ? `\n\nSource material to reference:\n${sources.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
    : '';

  const angleSection = angle
    ? `\n\nUnique angle/perspective: ${angle}`
    : '';

  const systemPrompt = `You are the master content strategist of an AI Media Intelligence OS. You write authoritative, well-researched, and deeply insightful long-form content that builds authority and trust.

Your writing principles:
- Lead with a compelling hook that challenges conventional thinking
- Build arguments with evidence, data, and specific examples
- Use analogies and stories to make complex ideas accessible
- Every paragraph must earn the reader's attention
- Write for humans, not search engines
- Avoid filler, fluff, and obvious statements
- Target length: ${targetLength} words
- Tone: ${tone}

Return your response as a JSON object with this structure:
{
  "title": "The article title",
  "subtitle": "A compelling subtitle",
  "slug": "url-friendly-slug",
  "markdown": "Full article in markdown format",
  "summary": "2-3 sentence summary",
  "tags": ["tag1", "tag2", "tag3"],
  "suggestedAngle": "The angle you took"
}`;

  const userPrompt = `Generate a master article draft based on this idea:

"${idea}"${sourcesSection}${angleSection}

Write with depth, authority, and originality. Make every sentence count.`;

  const response = await aiCall(
    [{ role: 'user', content: userPrompt }],
    { tier: 'premium', taskType: 'draft', systemPrompt }
  );

  try {
    const parsed = parseJsonResponse<DraftOutput>(response);
    return parsed;
  } catch {
    // Fallback: return raw markdown if JSON parsing fails
    return {
      title: idea.slice(0, 100),
      subtitle: '',
      slug: idea.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60),
      markdown: response,
      summary: response.slice(0, 200),
      tags: [],
      suggestedAngle: angle || 'general',
    };
  }
}

// ─── Pipeline Step 2: Humanic Rewrite ────────────────────────────────────────

export async function humanicRewrite(draft: string): Promise<HumanicRewriteOutput> {
  const systemPrompt = `You are an elite editorial refiner. Your mission: make AI-generated text sound like it was written by a brilliant human writer.

Anti-robotic rewrite rules:
1. Break repetitive sentence structures — vary length, rhythm, and cadence
2. Remove generic transitions ("Furthermore", "Additionally", "In conclusion")
3. Replace robotic phrases with natural, conversational alternatives
4. Add personality — voice, opinion, conviction
5. Insert specific details instead of vague generalizations
6. Use contractions, colloquialisms, and natural speech patterns where appropriate
7. Create unexpected transitions and surprising connections
8. Add rhetorical questions and direct address to the reader
9. Eliminate hedging language ("might", "could potentially", "it seems")
10. Make the text feel like it was written by someone who genuinely cares

Return your response as JSON:
{
  "markdown": "The rewritten content in markdown",
  "changesApplied": ["List of specific changes made"],
  "humanicScore": 85
}`;

  const userPrompt = `Rewrite this draft to sound completely human and natural. Remove all robotic patterns while preserving the core message and value:

${draft}`;

  const response = await aiCall(
    [{ role: 'user', content: userPrompt }],
    { tier: 'premium', taskType: 'humanic_rewrite', systemPrompt }
  );

  try {
    return parseJsonResponse<HumanicRewriteOutput>(response);
  } catch {
    return {
      markdown: response,
      changesApplied: ['Full rewrite applied'],
      humanicScore: 70,
    };
  }
}

// ─── Pipeline Step 3: Generate SEO Pack ──────────────────────────────────────

export async function generateSeoPack(content: string): Promise<SeoPack> {
  const systemPrompt = `You are an SEO specialist who understands that SEO should serve the reader, not manipulate search engines.

Generate a comprehensive SEO package:
- Meta title: 50-60 chars, compelling, includes primary keyword
- Meta description: 150-160 chars, action-oriented, includes keyword naturally
- Slug: concise, keyword-rich, URL-friendly
- Focus keyword: primary keyword with search intent
- Secondary keywords: 5-8 related long-tail keywords
- Heading structure: JSON array of headings with levels
- Schema markup: JSON-LD Article schema
- Readability score: estimated Flesch-Kincaid score (0-100)

Return as JSON:
{
  "metaTitle": "...",
  "metaDescription": "...",
  "slug": "...",
  "focusKeyword": "...",
  "secondaryKeywords": ["..."],
  "headingStructure": "...",
  "schemaMarkup": "...",
  "readabilityScore": 75
}`;

  const userPrompt = `Generate an SEO package for this content:

${content.slice(0, 4000)}`;

  const response = await aiCall(
    [{ role: 'user', content: userPrompt }],
    { tier: 'mid', taskType: 'seo', systemPrompt }
  );

  try {
    return parseJsonResponse<SeoPack>(response);
  } catch {
    return {
      metaTitle: '',
      metaDescription: '',
      slug: '',
      focusKeyword: '',
      secondaryKeywords: [],
      headingStructure: '',
      schemaMarkup: '',
      readabilityScore: 0,
    };
  }
}

// ─── Pipeline Step 4: Generate Repurpose ─────────────────────────────────────

export async function generateRepurpose(
  masterContent: string,
  platform: string
): Promise<RepurposeOutput> {
  const platformGuides: Record<string, string> = {
    wordpress: 'Long-form blog post (1500-2500 words), HTML formatting, internal linking suggestions',
    medium: 'Medium-style article (800-1500 words), conversational tone, personal anecdotes',
    blogger: 'Casual blog post (600-1200 words), friendly tone, simple formatting',
    substack: 'Newsletter format (500-1000 words), personal voice, subscriber-focused',
    beehiiv: 'Newsletter format (400-800 words), punchy, CTA-driven',
    devto: 'Technical article, code examples, developer community tone',
    hashnode: 'Technical blog post, developer-focused, practical examples',
    ghost: 'Clean blog post (1000-2000 words), minimal formatting, reader-first',
    mirror: 'Web3/crypto focused, decentralized publishing tone',
  };

  const guide = platformGuides[platform] || 'General content adapted for the platform';

  const systemPrompt = `You are a content repurposing specialist. You transform master content into platform-optimized variants while preserving core value.

Platform guide for ${platform}: ${guide}

Adapt the content for ${platform}:
- Match the platform's native format and conventions
- Optimize length for platform expectations
- Adjust tone and style for the platform's audience
- Include platform-specific elements (CTAs, formatting, etc.)
- Never just shorten — truly adapt and reimagine for the platform

Return as JSON:
{
  "platform": "${platform}",
  "title": "Platform-optimized title",
  "body": "Platform-adapted content",
  "variantType": "full|summary|thread|teaser|newsletter",
  "metadataJson": { "platform-specific": "metadata" }
}`;

  const userPrompt = `Repurpose this master content for ${platform}:

${masterContent.slice(0, 5000)}`;

  const response = await aiCall(
    [{ role: 'user', content: userPrompt }],
    { tier: 'mid', taskType: 'repurpose', systemPrompt }
  );

  try {
    return parseJsonResponse<RepurposeOutput>(response);
  } catch {
    return {
      platform,
      title: '',
      body: response,
      variantType: 'full',
      metadataJson: {},
    };
  }
}

// ─── Pipeline Step 5: Score Content ──────────────────────────────────────────

export async function scoreContent(content: string): Promise<ContentScore> {
  const systemPrompt = `You are a content quality auditor. Analyze the given content across four dimensions and provide precise numerical scores.

Scoring criteria:

1. WRITING QUALITY (0-100):
   - Clarity: Is the message clear and unambiguous?
   - Redundancy: Is there unnecessary repetition?
   - Rhythm: Does the prose flow naturally?
   - Grammar: Are there grammatical errors?

2. HUMANIC SCORE (0-100):
   - Anti-robotic: Does it sound human-written?
   - Tone consistency: Is the voice consistent?
   - Natural phrasing: Does it use natural language patterns?

3. SEO SCORE (0-100):
   - Keyword alignment: Are relevant keywords present?
   - Heading quality: Is the heading structure logical?
   - Readability: Is it readable for the target audience?

4. TRUST SCORE (0-100):
   - Source quality: Are claims backed by evidence?
   - Hallucination risk: Could any claims be fabricated?
   - Confidence: How confident is the overall assessment?

Return as JSON:
{
  "qualityScore": 85,
  "humanicScore": 78,
  "seoScore": 82,
  "trustScore": 75,
  "compositeScore": 80,
  "action": "auto_schedule|human_review|reject_rewrite",
  "details": {
    "clarity": 90,
    "redundancy": 85,
    "rhythm": 80,
    "grammar": 88,
    "antiRobotic": 78,
    "toneConsistency": 82,
    "naturalPhrasing": 76,
    "keywordAlignment": 80,
    "headingQuality": 85,
    "sourceQuality": 70,
    "hallucinationRisk": 25,
    "confidence": 80
  }
}

Action thresholds:
- compositeScore >= 80: "auto_schedule"
- compositeScore >= 60: "human_review"
- compositeScore < 60: "reject_rewrite"`;

  const userPrompt = `Score this content across all dimensions:

${content.slice(0, 4000)}`;

  const response = await aiCall(
    [{ role: 'user', content: userPrompt }],
    { tier: 'mid', taskType: 'scoring', systemPrompt }
  );

  try {
    const parsed = parseJsonResponse<ContentScore['details'] & { qualityScore?: number; humanicScore?: number; seoScore?: number; trustScore?: number; compositeScore?: number; action?: string }>(response);

    return {
      qualityScore: parsed.qualityScore ?? 0,
      humanicScore: parsed.humanicScore ?? 0,
      seoScore: parsed.seoScore ?? 0,
      trustScore: parsed.trustScore ?? 0,
      compositeScore: parsed.compositeScore ?? 0,
      action: (parsed.action as ContentScore['action']) ?? 'human_review',
      details: {
        clarity: parsed.clarity ?? 0,
        redundancy: parsed.redundancy ?? 0,
        rhythm: parsed.rhythm ?? 0,
        grammar: parsed.grammar ?? 0,
        antiRobotic: parsed.antiRobotic ?? 0,
        toneConsistency: parsed.toneConsistency ?? 0,
        naturalPhrasing: parsed.naturalPhrasing ?? 0,
        keywordAlignment: parsed.keywordAlignment ?? 0,
        headingQuality: parsed.headingQuality ?? 0,
        sourceQuality: parsed.sourceQuality ?? 0,
        hallucinationRisk: parsed.hallucinationRisk ?? 0,
        confidence: parsed.confidence ?? 0,
      },
    };
  } catch {
    return {
      qualityScore: 0,
      humanicScore: 0,
      seoScore: 0,
      trustScore: 0,
      compositeScore: 0,
      action: 'human_review',
      details: {
        clarity: 0,
        redundancy: 0,
        rhythm: 0,
        grammar: 0,
        antiRobotic: 0,
        toneConsistency: 0,
        naturalPhrasing: 0,
        keywordAlignment: 0,
        headingQuality: 0,
        sourceQuality: 0,
        hallucinationRisk: 0,
        confidence: 0,
      },
    };
  }
}

// ─── Full Pipeline Runner ────────────────────────────────────────────────────

export interface PipelineResult {
  draft: DraftOutput;
  humanic: HumanicRewriteOutput;
  seo: SeoPack;
  scores: ContentScore;
}

export async function runFullPipeline(input: DraftInput): Promise<PipelineResult> {
  // Step 1: Generate master draft
  const draft = await generateDraft(input);

  // Step 2: Humanic rewrite
  const humanic = await humanicRewrite(draft.markdown);

  // Step 3: SEO pack
  const seo = await generateSeoPack(humanic.markdown);

  // Step 4: Score the content
  const scores = await scoreContent(humanic.markdown);

  return { draft, humanic, seo, scores };
}

// ─── Utility: Generate Tags ──────────────────────────────────────────────────

export async function generateTags(content: string): Promise<string[]> {
  const systemPrompt = `Extract the most relevant content tags from the given text. Return a JSON array of tags (max 8 tags). Each tag should be a single word or short phrase. Include topic, format, and niche tags.`;

  const response = await aiCall(
    [{ role: 'user', content: `Extract tags from:\n\n${content.slice(0, 2000)}` }],
    { tier: 'cheap', taskType: 'tagging', systemPrompt }
  );

  try {
    const tags = parseJsonResponse<string[]>(response);
    return Array.isArray(tags) ? tags : [];
  } catch {
    return [];
  }
}

// ─── Utility: Generate Summary ───────────────────────────────────────────────

export async function generateSummary(content: string): Promise<string> {
  const systemPrompt = `You write concise, compelling summaries that capture the essence and value of content in 2-3 sentences. Make the reader want to read the full piece.`;

  const response = await aiCall(
    [{ role: 'user', content: `Summarize:\n\n${content.slice(0, 3000)}` }],
    { tier: 'cheap', taskType: 'summary', systemPrompt }
  );

  return response.trim();
}

// ─── Utility: Format Content ─────────────────────────────────────────────────

export async function formatContent(
  markdown: string,
  format: 'html' | 'plain' | 'markdown'
): Promise<string> {
  if (format === 'markdown') return markdown;

  const systemPrompt = `Convert the given markdown content to ${format === 'html' ? 'clean, semantic HTML' : 'plain text without any markdown syntax'}. Preserve all content and structure.`;

  const response = await aiCall(
    [{ role: 'user', content: markdown }],
    { tier: 'cheap', taskType: 'formatting', systemPrompt }
  );

  return response.trim();
}

// ─── Helper: Parse JSON from AI response ─────────────────────────────────────

function parseJsonResponse<T>(response: string): T {
  // Try to extract JSON from markdown code blocks
  const jsonMatch = response.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  const jsonStr = jsonMatch ? jsonMatch[1] : response;

  // Try to find JSON object or array in the response
  const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
  const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);

  const rawJson = objectMatch?.[0] || arrayMatch?.[0] || jsonStr;

  try {
    return JSON.parse(rawJson.trim());
  } catch {
    throw new Error(`Failed to parse AI JSON response: ${rawJson.slice(0, 100)}...`);
  }
}

// ─── Logging ─────────────────────────────────────────────────────────────────

async function logAiAction(
  tier: ModelTier,
  model: string,
  taskType: string,
  responseLength: number
): Promise<void> {
  try {
    await db.systemLog.create({
      data: {
        service: 'ai',
        level: 'info',
        action: 'ai_call_completed',
        message: `AI call completed: tier=${tier}, model=${model}, task=${taskType}`,
        metadataJson: JSON.stringify({ tier, model, taskType, responseLength }),
      },
    });
  } catch {
    // Logging failure should not break the pipeline
  }
}

async function logAiError(
  tier: ModelTier,
  model: string,
  taskType: string,
  error: unknown
): Promise<void> {
  try {
    await db.systemLog.create({
      data: {
        service: 'ai',
        level: 'error',
        action: 'ai_call_failed',
        message: `AI call failed: tier=${tier}, model=${model}, task=${taskType}`,
        metadataJson: JSON.stringify({
          tier,
          model,
          taskType,
          error: error instanceof Error ? error.message : String(error),
        }),
      },
    });
  } catch {
    // Logging failure should not break the pipeline
  }
}
