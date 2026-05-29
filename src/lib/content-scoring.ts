// Content Scoring — 4-dimension content scoring engine
// Dimensions: Quality, Humanic, SEO, Trust
// Composite score determines if content is ready for publishing
//
// Scoring modes:
//   - AI-based scoring (via LLM) — preferred when available
//   - Heuristic scoring (improved) — fallback or default
//   - Unified entry point: scoreContent() with { useAI } option

import { db } from "@/lib/db";
import { generateJSON } from "@/lib/ai";

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface ContentScores {
  quality: number;   // 0-100: Writing quality, structure, readability
  humanic: number;   // 0-100: How natural/human it sounds
  seo: number;       // 0-100: SEO optimization level
  trust: number;     // 0-100: Source credibility, accuracy
  composite: number; // Weighted average
}

export interface ScoringResult {
  scores: ContentScores;
  humanReviewRequired: boolean;
  feedback: ScoringFeedback;
  passed: boolean;
}

export interface ScoringFeedback {
  quality: string[];
  humanic: string[];
  seo: string[];
  trust: string[];
  overall: string;
}

export interface ScoringOptions {
  useAI?: boolean;
  workspaceId?: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────────

// Weights for composite score
const WEIGHTS = {
  quality: 0.30,
  humanic: 0.30,
  seo: 0.25,
  trust: 0.15,
};

// Thresholds
const AUTO_PUBLISH_THRESHOLD = 80;
const HUMAN_REVIEW_THRESHOLD = 60;
const FAILED_THRESHOLD = 40;

// ─── AI-Based Scoring ───────────────────────────────────────────────────────────

interface AIScoringResponse {
  quality: number;
  humanic: number;
  seo: number;
  trust: number;
  feedback: {
    quality: string[];
    humanic: string[];
    seo: string[];
    trust: string[];
  };
}

const AI_SCORING_SYSTEM_PROMPT = `You are an expert content quality evaluator. Score the provided content across 4 dimensions on a 0-100 scale using the rubric below. Be strict and precise.

SCORING RUBRIC:

1. QUALITY (0-100):
   - Writing Craft (0-100): Grammar correctness, vocabulary richness, sentence variety, smooth transitions between ideas
   - Structure (0-100): Clear heading hierarchy, logical flow from intro to conclusion, balanced paragraphs, effective use of lists/formatting
   - Readability (0-100): Appropriate sentence lengths, no unnecessarily complex jargon, accessible to target audience
   - Depth (0-100): Original insights, concrete examples, actionable takeaways, not surface-level
   Deduct heavily for: grammar errors, wall-of-text paragraphs, no structure, superficial analysis

2. HUMANIC (0-100):
   - Natural Voice (0-100): Reads like a human expert wrote it, no AI-typical phrasing ("leverage", "delve", "it's worth noting", "in today's landscape")
   - Personality (0-100): Contains opinions, anecdotes, subjective takes, personal pronouns (I/we/you)
   - Variability (0-100): Varied sentence lengths and structures, not monotonous rhythm, avoids repetitive paragraph patterns
   - Specificity (0-100): Uses specific details, named examples, precise language instead of vague generalizations
   Deduct heavily for: formulaic openings ("In today's world..."), generic transitions ("Furthermore", "Moreover"), closing with "In conclusion", repetitive sentence structures, lack of personal voice

3. SEO (0-100):
   - Keyword Optimization (0-100): Focus keyword appears naturally in title, headings, intro, body; not stuffed
   - Structure Signals (0-100): Proper H1/H2/H3 hierarchy, meta-ready title (<60 chars), scannable formatting
   - Content Depth (0-100): Comprehensive coverage, long-form value, answers user intent
   - Link Worthiness (0-100): Unique insights that other sites would reference, original data or analysis
   Deduct for: keyword stuffing, missing headings, no clear keyword focus, thin content

4. TRUST (0-100):
   - Source Credibility (0-100): Cites specific data, studies, reports with named sources
   - Accuracy Signals (0-100): Precise numbers and dates, specific claims vs vague generalizations
   - Concrete Claims (0-100): "Revenue grew 47% in Q3 2024" not "Revenue grew significantly"
   - Author Authority (0-100): Demonstrates genuine expertise, not generic AI output
   Deduct for: vague claims without evidence, no named sources, generic generalizations, hedging without substance

Return ONLY valid JSON matching this exact schema (no markdown, no code fences):
{
  "quality": <number 0-100>,
  "humanic": <number 0-100>,
  "seo": <number 0-100>,
  "trust": <number 0-100>,
  "feedback": {
    "quality": ["<specific feedback item>", ...],
    "humanic": ["<specific feedback item>", ...],
    "seo": ["<specific feedback item>", ...],
    "trust": ["<specific feedback item>", ...]
  }
}`;

/**
 * Score content using an LLM with a detailed rubric.
 * Falls back to heuristic scoring if the LLM call fails.
 */
export async function scoreWithAI(
  content: string,
  options?: { workspaceId?: string; seoData?: Record<string, unknown>; title?: string }
): Promise<ScoringResult> {
  try {
    const titleContext = options?.title ? `\n\nTITLE: ${options.title}` : "";
    const seoContext = options?.seoData
      ? `\n\nSEO DATA:\n${JSON.stringify(options.seoData)}`
      : "";

    // Truncate content to avoid token limits while preserving enough for evaluation
    const truncatedContent =
      content.length > 8000 ? content.substring(0, 8000) + "\n\n[Content truncated for scoring]" : content;

    const aiResult = await generateJSON<AIScoringResponse>({
      prompt: `Evaluate this content using the scoring rubric:\n\n${truncatedContent}${titleContext}${seoContext}`,
      system: AI_SCORING_SYSTEM_PROMPT,
      temperature: 0.15,
      maxTokens: 2000,
    });

    // Validate and clamp scores
    const clamp = (n: number) => Math.min(100, Math.max(0, Math.round(Number(n) || 0)));
    const quality = clamp(aiResult.quality);
    const humanic = clamp(aiResult.humanic);
    const seo = clamp(aiResult.seo);
    const trust = clamp(aiResult.trust);

    const scores: ContentScores = {
      quality,
      humanic,
      seo,
      trust,
      composite: Math.round(
        quality * WEIGHTS.quality +
        humanic * WEIGHTS.humanic +
        seo * WEIGHTS.seo +
        trust * WEIGHTS.trust
      ),
    };

    const feedback: ScoringFeedback = {
      quality: Array.isArray(aiResult.feedback?.quality) ? aiResult.feedback.quality : [],
      humanic: Array.isArray(aiResult.feedback?.humanic) ? aiResult.feedback.humanic : [],
      seo: Array.isArray(aiResult.feedback?.seo) ? aiResult.feedback.seo : [],
      trust: Array.isArray(aiResult.feedback?.trust) ? aiResult.feedback.trust : [],
      overall: generateOverallFeedback(scores.composite),
    };

    // If AI returned empty feedback for a dimension, fill in heuristic-style guidance
    if (feedback.quality.length === 0) feedback.quality = buildHeuristicQualityFeedback(content, scores.quality);
    if (feedback.humanic.length === 0) feedback.humanic = buildHeuristicHumanicFeedback(content, scores.humanic);
    if (feedback.seo.length === 0) feedback.seo = buildHeuristicSeoFeedback(content, options?.seoData, scores.seo);
    if (feedback.trust.length === 0) feedback.trust = buildHeuristicTrustFeedback(content, scores.trust);

    const humanReviewRequired = scores.composite < HUMAN_REVIEW_THRESHOLD;
    const passed = scores.composite >= AUTO_PUBLISH_THRESHOLD;

    return { scores, humanReviewRequired, feedback, passed };
  } catch (error) {
    console.error("[ContentScoring] AI scoring failed, falling back to heuristic:", error);
    return scoreWithHeuristics(content, {
      seoData: options?.seoData,
      title: options?.title,
    });
  }
}

// ─── Improved Heuristic Scoring ─────────────────────────────────────────────────

/**
 * Estimate readability using a Flesch-Kincaid-like heuristic.
 * Higher = easier to read. We map to 0-100.
 */
function estimateReadability(text: string): number {
  // Strip markdown syntax for cleaner analysis
  const plain = text
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*|__/g, "")
    .replace(/\*|_/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .trim();

  // Split into sentences (rough heuristic)
  const sentences = plain
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);

  if (sentences.length === 0) return 50; // Neutral fallback

  // Split into words
  const words = plain.split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 0) return 50;

  const totalWords = words.length;
  const totalSentences = sentences.length;
  const totalSyllables = words.reduce((sum, word) => sum + estimateSyllables(word), 0);

  // Flesch Reading Ease: 206.835 - 1.015 * (words/sentences) - 84.6 * (syllables/words)
  const avgWordsPerSentence = totalWords / totalSentences;
  const avgSyllablesPerWord = totalSyllables / totalWords;
  const flesch = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

  // Map Flesch score (0-100) to our scale, with optimal range ~60-80
  return Math.min(100, Math.max(0, Math.round(flesch)));
}

/**
 * Rough syllable count estimation for English words.
 */
function estimateSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return 1;

  let count = 0;
  const vowels = "aeiouy";
  let prevWasVowel = false;

  for (let i = 0; i < w.length; i++) {
    const isVowel = vowels.includes(w[i]);
    if (isVowel && !prevWasVowel) count++;
    prevWasVowel = isVowel;
  }

  // Adjust for silent e
  if (w.endsWith("e") && count > 1) count--;
  // Adjust for -le endings (e.g., "table")
  if (w.endsWith("le") && w.length > 2 && !vowels.includes(w[w.length - 3])) count++;

  return Math.max(1, count);
}

/**
 * Detect repetitive sentence structures (AI-typical pattern).
 * Returns a penalty 0-30.
 */
function detectRepetitiveStructures(text: string): number {
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 15);

  if (sentences.length < 4) return 0;

  let penalty = 0;

  // Check for sentences starting with the same word
  const starters = sentences.map((s) => s.split(/\s+/)[0]);
  const starterCounts: Record<string, number> = {};
  for (const s of starters) {
    starterCounts[s] = (starterCounts[s] || 0) + 1;
  }
  const repetitiveStarters = Object.values(starterCounts).filter((c) => c > 2).length;
  if (repetitiveStarters > 0) penalty += Math.min(10, repetitiveStarters * 5);

  // Check for similar sentence lengths (AI tends to produce uniform lengths)
  const lengths = sentences.map((s) => s.split(/\s+/).length);
  if (lengths.length >= 4) {
    const avgLen = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, l) => sum + Math.pow(l - avgLen, 2), 0) / lengths.length;
    // Very low variance = monotonous sentence lengths
    if (variance < 5) penalty += 10;
    else if (variance < 15) penalty += 5;
  }

  // Check for repeated transitional phrases in sequence
  const transitionPhrases = [
    "however", "moreover", "furthermore", "additionally", "consequently",
    "therefore", "thus", "hence", "nevertheless", "meanwhile",
    "similarly", "likewise", "accordingly", "subsequently",
  ];
  let consecutiveTransitions = 0;
  let maxConsecutiveTransitions = 0;
  for (const sentence of sentences) {
    const startsWithTransition = transitionPhrases.some((t) => sentence.startsWith(t));
    if (startsWithTransition) {
      consecutiveTransitions++;
      maxConsecutiveTransitions = Math.max(maxConsecutiveTransitions, consecutiveTransitions);
    } else {
      consecutiveTransitions = 0;
    }
  }
  if (maxConsecutiveTransitions >= 2) penalty += 5;
  if (maxConsecutiveTransitions >= 3) penalty += 5;

  return Math.min(30, penalty);
}

/**
 * Detect formulaic AI openings and closings.
 * Returns a penalty 0-20.
 */
function detectFormulaicStructure(text: string): number {
  let penalty = 0;
  const lower = text.toLowerCase().trim();

  // Formulaic openings (first 200 chars)
  const opening = lower.substring(0, 200);
  const formulaicOpenings = [
    "in today's",
    "in today's world",
    "in today's digital",
    "in today's rapidly",
    "in the ever-evolving",
    "as the digital landscape",
    "in the modern",
    "in recent years",
    "it goes without saying",
    "it is worth noting",
    "in this article",
    "this article explores",
    "this article delves",
    "welcome to our",
  ];
  for (const pattern of formulaicOpenings) {
    if (opening.includes(pattern)) {
      penalty += 5;
      break;
    }
  }

  // Formulaic closings (last 300 chars)
  const closing = lower.substring(Math.max(0, lower.length - 300));
  const formulaicClosings = [
    "in conclusion",
    "to sum up",
    "in summary",
    "to wrap up",
    "as we conclude",
    "ultimately, the choice is yours",
    "the choice is yours",
    "ready to get started",
    "remember, the key is",
  ];
  for (const pattern of formulaicClosings) {
    if (closing.includes(pattern)) {
      penalty += 5;
      break;
    }
  }

  // Detect "numbered list + conclusion" pattern that AI frequently uses
  if (text.match(/^\d+\.\s/gm)?.length && closing.includes("in conclusion")) {
    penalty += 5;
  }

  return Math.min(20, penalty);
}

/**
 * Detect lack of specific examples or concrete details.
 * Returns a penalty 0-20.
 */
function detectLackOfSpecificity(text: string): number {
  let penalty = 0;

  // Check for specific data points (numbers, percentages, dates)
  const numberPatterns = text.match(/\d+\.?\d*%|\$\d+|\d{4}\b|\d+x\b/g) || [];
  if (numberPatterns.length === 0) penalty += 8;
  else if (numberPatterns.length < 2 && text.length > 500) penalty += 4;

  // Check for named entities (capitalized words that aren't sentence starts)
  const capitalizedWords = text.match(/(?<=[a-z]\s)[A-Z][a-z]+/g) || [];
  if (capitalizedWords.length === 0 && text.length > 300) penalty += 5;

  // Check for quotes or citations
  const hasQuotes = text.includes('"') || text.includes('"') || text.includes('"') || text.includes('—');
  if (!hasQuotes && text.length > 500) penalty += 4;

  // Check for vague generalizations
  const vaguePatterns = [
    "many people", "some say", "it is widely known", "everyone knows",
    "studies show", "research indicates", "experts agree", "it has been proven",
    "countless", "numerous studies", "a lot of", "various reasons",
  ];
  const lower = text.toLowerCase();
  let vagueCount = 0;
  for (const pattern of vaguePatterns) {
    if (lower.includes(pattern)) vagueCount++;
  }
  penalty += Math.min(8, vagueCount * 2);

  return Math.min(20, penalty);
}

/**
 * Calculate keyword density for a focus keyword.
 * Returns percentage (0-100 scale, where 1-3% density is ideal).
 */
function calculateKeywordDensity(text: string, keyword: string): { density: number; count: number; ideal: boolean } {
  if (!keyword || keyword.trim().length === 0) return { density: 0, count: 0, ideal: false };

  const lower = text.toLowerCase();
  const keywordLower = keyword.toLowerCase().trim();
  const words = lower.split(/\s+/).filter((w) => w.length > 0);
  const totalWords = words.length;
  if (totalWords === 0) return { density: 0, count: 0, ideal: false };

  // Count occurrences (both exact and as part of content)
  let count = 0;
  let idx = 0;
  while ((idx = lower.indexOf(keywordLower, idx)) !== -1) {
    count++;
    idx += keywordLower.length;
  }

  // Density as percentage
  const density = totalWords > 0 ? (count * keywordLower.split(/\s+/).length / totalWords) * 100 : 0;

  // Ideal density is roughly 1-3%
  const ideal = density >= 0.5 && density <= 3;

  return { density, count, ideal };
}

/**
 * Check for internal linking suggestions in the content.
 */
function checkInternalLinking(text: string): { hasLinks: boolean; linkCount: number; suggestion: string } {
  // Check for markdown links
  const markdownLinks = text.match(/\[([^\]]+)\]\([^)]+\)/g) || [];
  const linkCount = markdownLinks.length;
  const hasLinks = linkCount > 0;

  let suggestion = "";
  if (linkCount === 0) {
    suggestion = "No internal or external links found. Add relevant links to improve SEO and credibility.";
  } else if (linkCount < 3 && text.length > 1000) {
    suggestion = "Consider adding more links. Long-form content typically benefits from 3-5+ relevant links.";
  }

  return { hasLinks, linkCount, suggestion };
}

// ─── Heuristic Scoring (Improved) ───────────────────────────────────────────────

/**
 * Improved heuristic quality scoring with readability estimation.
 */
function calculateQualityScore(markdown: string, title: string): number {
  let score = 50; // Base score

  // Title quality
  if (title.length > 10 && title.length < 100) score += 8;
  else if (title.length >= 5) score += 4;

  // Content length
  const wordCount = markdown.split(/\s+/).filter((w) => w.length > 0).length;
  if (wordCount > 300) score += 5;
  if (wordCount > 800) score += 5;
  if (wordCount > 1500) score += 5;
  if (wordCount < 100) score -= 10;

  // Structure: has headings
  const h2Count = (markdown.match(/^## /gm) || []).length;
  if (h2Count >= 1) score += 5;
  if (h2Count >= 3) score += 5;

  // Structure: has lists
  if (markdown.includes("- ") || markdown.includes("1. ")) score += 3;

  // Structure: has paragraphs (not just one block)
  const paragraphs = markdown.split("\n\n").filter((p) => p.trim().length > 50);
  if (paragraphs.length >= 3) score += 4;
  if (paragraphs.length >= 5) score += 3;

  // Readability score (Flesch-Kincaid-like heuristic)
  const readability = estimateReadability(markdown);
  // Optimal readability: 60-80 (accessible but not dumbed down)
  if (readability >= 60 && readability <= 80) score += 10;
  else if (readability >= 50 && readability <= 85) score += 5;
  else if (readability < 30) score -= 5; // Too complex
  else if (readability > 95) score -= 3; // Too simple/simplistic

  // Sentence variety: check for mix of short and long sentences
  const sentences = markdown.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 5);
  if (sentences.length >= 5) {
    const sentLengths = sentences.map((s) => s.split(/\s+/).length);
    const avgLen = sentLengths.reduce((a, b) => a + b, 0) / sentLengths.length;
    const variance = sentLengths.reduce((sum, l) => sum + Math.pow(l - avgLen, 2), 0) / sentLengths.length;
    if (variance > 20) score += 5; // Good sentence variety
    else if (variance < 5) score -= 3; // Monotonous
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Improved heuristic humanic scoring with expanded AI pattern detection.
 */
function calculateHumanicScore(markdown: string): number {
  let score = 75; // Start optimistic

  // ─── Robotic keyword patterns (expanded) ───
  const roboticPatterns = [
    // Classic corporate/AI jargon
    "leverage", "synergy", "delve", "utilize", "facilitate", "implement",
    "optimize", "streamline", "harness", "empower", "foster",
    // AI-typical transitions
    "furthermore", "moreover", "hence", "thereby", "additionally",
    "consequently", "subsequently", "nevertheless", "notably",
    // Formulaic phrases
    "in conclusion", "it goes without saying", "at the end of the day",
    "in today's", "in this article", "as we know", "it is important to note",
    "it's worth noting", "worth noting that", "important to note that",
    "it is crucial to", "it is essential to", "it is vital to",
    "plays a crucial role", "plays a vital role", "plays an important role",
    "in the realm of", "in the landscape of", "in the world of",
    "game-changer", "paradigm shift", "holy grail",
    // AI hedging language
    "it can be argued", "one could argue", "some might say",
    "it stands to reason", "the fact that",
  ];

  const lowerContent = markdown.toLowerCase();
  let roboticHits = 0;
  for (const pattern of roboticPatterns) {
    if (lowerContent.includes(pattern)) {
      roboticHits++;
    }
  }
  // Progressive penalty: first few hits are mild, many hits are severe
  score -= Math.min(25, roboticHits * 3);

  // ─── Structural AI patterns ───
  const repetitivePenalty = detectRepetitiveStructures(markdown);
  score -= repetitivePenalty;

  const formulaicPenalty = detectFormulaicStructure(markdown);
  score -= formulaicPenalty;

  const specificityPenalty = detectLackOfSpecificity(markdown);
  score -= specificityPenalty;

  // ─── Positive signals: human-like writing ───
  // Questions engage the reader
  const questionCount = (markdown.match(/\?/g) || []).length;
  if (questionCount >= 1) score += 3;
  if (questionCount >= 3) score += 3;

  // Personal pronouns indicate human voice
  if (lowerContent.includes("i ")) score += 5;
  else if (lowerContent.includes("i'")) score += 4; // I'm, I've, etc.
  if (lowerContent.includes("we ") || lowerContent.includes("we'")) score += 4;
  if (lowerContent.includes("you ") || lowerContent.includes("you'")) score += 3;

  // Contractions are a strong human signal
  const contractions = (lowerContent.match(/\b\w+'\w+\b/g) || []).length;
  if (contractions >= 3) score += 5;
  else if (contractions >= 1) score += 3;

  // Exclamations (moderate use = human emotion)
  const exclamationCount = (markdown.match(/!/g) || []).length;
  if (exclamationCount >= 1 && exclamationCount <= 5) score += 2;

  // Varied paragraph lengths (natural writing)
  const paragraphs = markdown.split("\n\n").filter((p) => p.trim().length > 0);
  if (paragraphs.length > 1) {
    const lengths = paragraphs.map((p) => p.length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, l) => sum + Math.pow(l - avgLength, 2), 0) / lengths.length;
    if (variance > 1000) score += 5; // Good: varied paragraph lengths
  }

  // Dialogue or quotes indicate human sources
  if (markdown.includes('"') || markdown.includes('"')) score += 3;

  return Math.min(100, Math.max(0, score));
}

/**
 * Improved heuristic SEO scoring with keyword density and linking checks.
 */
function calculateSeoScore(content: Record<string, unknown>): number {
  let score = 40; // Base score

  const seoData = content.seoData as Record<string, unknown> | null;
  const markdown = (content.masterMarkdown as string) || "";
  const title = (content.title as string) || "";

  // Has SEO metadata
  if (seoData) {
    if (seoData.metaTitle) score += 8;
    if (seoData.metaDescription) score += 8;
    if (seoData.focusKeyword) score += 10;
    if (seoData.headingStructure) score += 4;
  }

  // Content structure for SEO
  if (markdown.startsWith("# ")) score += 4; // Has H1
  if (markdown.includes("## ")) score += 4;  // Has H2s
  if (markdown.includes("### ")) score += 2; // Has H3s (deeper structure)

  // Long-form content (SEO-friendly)
  const wordCount = markdown.split(/\s+/).filter((w) => w.length > 0).length;
  if (wordCount > 1000) score += 4;
  if (wordCount > 2000) score += 3;

  // Slug quality
  if (content.slug && (content.slug as string).length > 3) score += 3;

  // ─── Keyword density check ───
  const focusKeyword = seoData?.focusKeyword
    ? String(seoData.focusKeyword)
    : title.split(/\s+/).slice(0, 3).join(" "); // Use first 3 words of title as proxy

  if (focusKeyword && focusKeyword.length > 2) {
    const { density, ideal } = calculateKeywordDensity(markdown, focusKeyword);
    if (ideal) score += 6;
    else if (density > 0 && density < 5) score += 3;
    else if (density === 0) score -= 3; // Keyword not mentioned at all
    else if (density > 5) score -= 5; // Keyword stuffing
  }

  // ─── Internal linking check ───
  const { hasLinks, linkCount } = checkInternalLinking(markdown);
  if (hasLinks) score += 4;
  if (linkCount >= 3) score += 3;

  // ─── Title SEO checks ───
  if (title.length >= 30 && title.length <= 60) score += 3; // Good title length for SEO
  else if (title.length < 20 || title.length > 80) score -= 2;

  // Check if keyword appears in title
  if (focusKeyword && title.toLowerCase().includes(focusKeyword.toLowerCase())) score += 3;

  return Math.min(100, Math.max(0, score));
}

/**
 * Improved heuristic trust scoring with checks for specific data, named entities, concrete claims.
 */
function calculateTrustScore(content: Record<string, unknown>): number {
  let score = 50; // Base score (neutral start)

  const markdown = (content.masterMarkdown as string) || "";

  // ─── Source type credibility ───
  const sourceType = content.sourceType as string;
  if (sourceType === "manual") score += 15;
  else if (sourceType === "signal") score += 10;
  else if (sourceType === "trend") score += 5;

  // Has source notes
  if (content.sourceNotes) score += 8;

  // Has angle (unique perspective)
  if (content.angle) score += 8;

  // Has summary (well-processed)
  if (content.summary) score += 4;

  // ─── Specific data points ───
  // Numbers, percentages, dollar amounts, dates
  const specificDataPatterns = markdown.match(
    /\d+\.?\d*%|\$\d+\.?\d*[KMB]?|\d{4}\b|\d+x\b|\d+\.?\d*\s*(million|billion|trillion|thousand)/gi
  ) || [];
  if (specificDataPatterns.length >= 3) score += 8;
  else if (specificDataPatterns.length >= 1) score += 4;
  else if (markdown.length > 500) score -= 5; // Long content with no data = suspicious

  // ─── Named entities (capitalized proper nouns) ───
  const namedEntities = markdown.match(/(?<=[a-z]\s)[A-Z][a-zA-Z]{2,}/g) || [];
  if (namedEntities.length >= 3) score += 6;
  else if (namedEntities.length >= 1) score += 3;

  // ─── Concrete claims vs vague generalizations ───
  const lower = markdown.toLowerCase();
  const vagueGeneralizations = [
    "studies show", "research indicates", "experts agree", "it has been proven",
    "many people believe", "everyone knows", "it is widely accepted",
    "science says", "scientists say", "researchers found",
  ];
  let vagueCount = 0;
  let vagueWithoutSource = 0;
  for (const pattern of vagueGeneralizations) {
    if (lower.includes(pattern)) {
      vagueCount++;
      // Check if there's a specific source nearby (within 50 chars)
      const idx = lower.indexOf(pattern);
      const context = lower.substring(Math.max(0, idx - 30), idx + pattern.length + 50);
      const hasSourceReference = context.match(/\d{4}|according to|et al|university|institute|journal|report/i);
      if (!hasSourceReference) vagueWithoutSource++;
    }
  }
  score -= Math.min(10, vagueWithoutSource * 3);

  // ─── Citations and references ───
  // Check for reference-like patterns
  const hasCitations = markdown.match(/\[\d+\]|\(\d{4}\)|et al\.|according to|source:/i);
  if (hasCitations) score += 6;

  // ─── Direct quotes ───
  const quoteCount = (markdown.match(/["""].*?["""]/g) || []).length;
  if (quoteCount >= 1) score += 3;
  if (quoteCount >= 3) score += 3;

  return Math.min(100, Math.max(0, score));
}

// ─── Heuristic Feedback Builders ────────────────────────────────────────────────

function buildHeuristicQualityFeedback(content: string, score: number): string[] {
  const feedback: string[] = [];
  if (score >= 80) {
    feedback.push("Content quality is strong — well-structured and readable");
    return feedback;
  }

  if (content.length < 500) feedback.push("Content is too short — aim for 800+ words for in-depth coverage");
  if (!content.includes("## ")) feedback.push("Add section headings (##) for better structure and scannability");

  const readability = estimateReadability(content);
  if (readability < 40) feedback.push("Content may be too complex — consider shorter sentences and simpler vocabulary");
  else if (readability > 90) feedback.push("Content reads very simply — consider adding more sophisticated analysis");

  const paragraphs = content.split("\n\n").filter((p) => p.trim().length > 50);
  if (paragraphs.length < 3) feedback.push("Add more substantial paragraphs — content appears thin");

  const wordCount = content.split(/\s+/).filter((w) => w.length > 0).length;
  if (wordCount < 300) feedback.push("Word count is low — most quality content exceeds 800 words");

  return feedback;
}

function buildHeuristicHumanicFeedback(content: string, score: number): string[] {
  const feedback: string[] = [];
  if (score >= 80) {
    feedback.push("Content sounds natural and human-written");
    return feedback;
  }

  const lower = content.toLowerCase();
  const detectedPatterns: string[] = [];
  const commonAI = ["leverage", "synergy", "delve", "furthermore", "moreover", "in conclusion", "it is important to note"];
  for (const p of commonAI) {
    if (lower.includes(p)) detectedPatterns.push(`"${p}"`);
  }
  if (detectedPatterns.length > 0) {
    feedback.push(`Detected AI-typical phrases: ${detectedPatterns.join(", ")} — replace with natural alternatives`);
  }

  const repetitivePenalty = detectRepetitiveStructures(content);
  if (repetitivePenalty >= 10) feedback.push("Sentence structures are repetitive — vary opening words and sentence lengths");

  const formulaicPenalty = detectFormulaicStructure(content);
  if (formulaicPenalty >= 5) feedback.push("Opening or closing sounds formulaic — use a more personal, engaging approach");

  if (!lower.includes("i ") && !lower.includes("we ") && !lower.includes("you ")) {
    feedback.push("Add personal pronouns (I/we/you) to create a more conversational tone");
  }

  const contractions = (lower.match(/\b\w+'\w+\b/g) || []).length;
  if (contractions < 2) feedback.push("Use more contractions (it's, don't, can't) for a natural, conversational feel");

  return feedback;
}

function buildHeuristicSeoFeedback(
  content: string,
  seoData: Record<string, unknown> | null | undefined,
  score: number
): string[] {
  const feedback: string[] = [];
  if (score >= 80) {
    feedback.push("SEO optimization is solid");
    return feedback;
  }

  if (!seoData?.metaTitle) feedback.push("Add a meta title (50-60 characters) for search engine display");
  if (!seoData?.metaDescription) feedback.push("Add a meta description (150-160 characters) for search snippets");
  if (!seoData?.focusKeyword) feedback.push("Define a focus keyword to optimize content around");

  if (!content.startsWith("# ")) feedback.push("Start content with an H1 heading for proper SEO structure");
  if (!content.includes("## ")) feedback.push("Add H2 subheadings to improve content structure and SEO");

  const { suggestion } = checkInternalLinking(content);
  if (suggestion) feedback.push(suggestion);

  const wordCount = content.split(/\s+/).filter((w) => w.length > 0).length;
  if (wordCount < 800) feedback.push("Increase word count — long-form content (1500+ words) tends to rank better");

  return feedback;
}

function buildHeuristicTrustFeedback(content: string, score: number): string[] {
  const feedback: string[] = [];
  if (score >= 80) {
    feedback.push("Content credibility is strong — includes specific claims and sources");
    return feedback;
  }

  const specificData = content.match(/\d+\.?\d*%|\$\d+|\d{4}\b/g) || [];
  if (specificData.length === 0) feedback.push("Add specific data points (percentages, dollar amounts, dates) to back up claims");

  const lower = content.toLowerCase();
  const vaguePhrases = ["studies show", "research indicates", "experts agree", "it has been proven"];
  const detectedVague = vaguePhrases.filter((p) => lower.includes(p));
  if (detectedVague.length > 0) {
    feedback.push(`Replace vague citations with specific sources: "${detectedVague.join('", "')}" need named references`);
  }

  const hasQuotes = content.includes('"') || content.includes('"') || content.includes('"');
  if (!hasQuotes) feedback.push("Add direct quotes from experts or sources to strengthen credibility");

  const hasCitations = content.match(/\[\d+\]|\(\d{4}\)|et al\.|according to|source:/i);
  if (!hasCitations) feedback.push("Include citations or references to original sources");

  return feedback;
}

// ─── Full Heuristic Scoring Function ────────────────────────────────────────────

/**
 * Score content using improved heuristic analysis (no AI required).
 * Returns the same ScoringResult format as scoreWithAI().
 */
export function scoreWithHeuristics(
  content: string,
  options?: { seoData?: Record<string, unknown>; title?: string; sourceType?: string; sourceNotes?: string; angle?: string; summary?: string; slug?: string }
): ScoringResult {
  const title = options?.title || "";
  const seoData = options?.seoData || null;

  // Build a content-like object for the existing scoring methods
  const contentObj: Record<string, unknown> = {
    masterMarkdown: content,
    title,
    seoData,
    sourceType: options?.sourceType,
    sourceNotes: options?.sourceNotes,
    angle: options?.angle,
    summary: options?.summary,
    slug: options?.slug,
  };

  const quality = calculateQualityScore(content, title);
  const humanic = calculateHumanicScore(content);
  const seo = calculateSeoScore(contentObj);
  const trust = calculateTrustScore(contentObj);

  const scores: ContentScores = {
    quality: Math.round(quality),
    humanic: Math.round(humanic),
    seo: Math.round(seo),
    trust: Math.round(trust),
    composite: Math.round(
      quality * WEIGHTS.quality +
      humanic * WEIGHTS.humanic +
      seo * WEIGHTS.seo +
      trust * WEIGHTS.trust
    ),
  };

  const feedback: ScoringFeedback = {
    quality: buildHeuristicQualityFeedback(content, scores.quality),
    humanic: buildHeuristicHumanicFeedback(content, scores.humanic),
    seo: buildHeuristicSeoFeedback(content, seoData as Record<string, unknown> | null, scores.seo),
    trust: buildHeuristicTrustFeedback(content, scores.trust),
    overall: generateOverallFeedback(scores.composite),
  };

  const humanReviewRequired = scores.composite < HUMAN_REVIEW_THRESHOLD;
  const passed = scores.composite >= AUTO_PUBLISH_THRESHOLD;

  return { scores, humanReviewRequired, feedback, passed };
}

// ─── Unified Entry Point ────────────────────────────────────────────────────────

/**
 * Unified content scoring function — the recommended entry point.
 *
 * - If useAI is true, tries AI-based scoring first, falls back to heuristic on failure
 * - If useAI is false or not set, uses heuristic scoring directly
 * - Returns the same ScoringResult format regardless of method used
 */
export async function scoreContent(
  content: string,
  options?: ScoringOptions & {
    seoData?: Record<string, unknown>;
    title?: string;
    sourceType?: string;
    sourceNotes?: string;
    angle?: string;
    summary?: string;
    slug?: string;
  }
): Promise<ScoringResult> {
  if (options?.useAI) {
    return scoreWithAI(content, {
      workspaceId: options.workspaceId,
      seoData: options.seoData,
      title: options.title,
    });
  }

  return scoreWithHeuristics(content, {
    seoData: options?.seoData,
    title: options?.title,
    sourceType: options?.sourceType,
    sourceNotes: options?.sourceNotes,
    angle: options?.angle,
    summary: options?.summary,
    slug: options?.slug,
  });
}

// ─── Overall Feedback Helper ────────────────────────────────────────────────────

function generateOverallFeedback(composite: number): string {
  if (composite >= AUTO_PUBLISH_THRESHOLD) {
    return "Content is ready for publishing. All dimensions meet the auto-publish threshold.";
  } else if (composite >= HUMAN_REVIEW_THRESHOLD) {
    return "Content needs minor improvements before publishing. Human review recommended.";
  } else if (composite >= FAILED_THRESHOLD) {
    return "Content needs significant work. Review all dimension feedback.";
  } else {
    return "Content does not meet quality standards. Consider rewriting from scratch.";
  }
}

// ─── ContentScorer Class (Backward Compatible) ──────────────────────────────────

export class ContentScorer {
  // Score content using 4 dimensions (DB-backed, uses heuristic by default)
  async scoreContent(contentId: string): Promise<ScoringResult> {
    const content = await db.contentItem.findUnique({
      where: { id: contentId },
      include: { seoData: true },
    });

    if (!content) {
      throw new Error(`Content item ${contentId} not found`);
    }

    // Calculate scores using the improved heuristics
    const scores = this.calculateScores(content);

    // Generate feedback using the improved heuristic feedback builders
    const feedback = this.generateFeedback(scores, content);

    // Determine if human review is required
    const humanReviewRequired = scores.composite < HUMAN_REVIEW_THRESHOLD;

    // Determine if content passes
    const passed = scores.composite >= AUTO_PUBLISH_THRESHOLD;

    // Update content item
    await db.contentItem.update({
      where: { id: contentId },
      data: {
        qualityScore: scores.quality,
        humanicScore: scores.humanic,
        seoScore: scores.seo,
        trustScore: scores.trust,
        humanReviewRequired,
        status: passed ? "ready" : humanReviewRequired ? "editing" : "draft",
      },
    });

    return {
      scores,
      humanReviewRequired,
      feedback,
      passed,
    };
  }

  // Calculate individual dimension scores (backward compatible signature)
  // Now uses the improved heuristic functions internally
  private calculateScores(content: Record<string, unknown>): ContentScores {
    const markdown = (content.masterMarkdown as string) || "";
    const title = (content.title as string) || "";

    const quality = calculateQualityScore(markdown, title);
    const humanic = calculateHumanicScore(markdown);
    const seo = calculateSeoScore(content);
    const trust = calculateTrustScore(content);

    const composite =
      quality * WEIGHTS.quality +
      humanic * WEIGHTS.humanic +
      seo * WEIGHTS.seo +
      trust * WEIGHTS.trust;

    return {
      quality: Math.round(quality),
      humanic: Math.round(humanic),
      seo: Math.round(seo),
      trust: Math.round(trust),
      composite: Math.round(composite),
    };
  }

  // Generate actionable feedback (backward compatible, now uses improved feedback builders)
  private generateFeedback(scores: ContentScores, content: Record<string, unknown>): ScoringFeedback {
    const markdown = (content.masterMarkdown as string) || "";

    return {
      quality: buildHeuristicQualityFeedback(markdown, scores.quality),
      humanic: buildHeuristicHumanicFeedback(markdown, scores.humanic),
      seo: buildHeuristicSeoFeedback(markdown, content.seoData as Record<string, unknown> | null, scores.seo),
      trust: buildHeuristicTrustFeedback(markdown, scores.trust),
      overall: generateOverallFeedback(scores.composite),
    };
  }
}

// Singleton
export const contentScorer = new ContentScorer();
