// Content Scoring — 4-dimension content scoring engine
// Dimensions: Quality, Humanic, SEO, Trust
// Composite score determines if content is ready for publishing

import { db } from "@/lib/db";

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

export class ContentScorer {
  // Score content using 4 dimensions
  async scoreContent(contentId: string): Promise<ScoringResult> {
    const content = await db.contentItem.findUnique({
      where: { id: contentId },
      include: { seoData: true },
    });

    if (!content) {
      throw new Error(`Content item ${contentId} not found`);
    }

    // Calculate scores
    const scores = this.calculateScores(content);

    // Generate feedback
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

  // Calculate individual dimension scores
  private calculateScores(content: Record<string, unknown>): ContentScores {
    const markdown = (content.masterMarkdown as string) || "";
    const summary = (content.summary as string) || "";
    const title = content.title as string;

    // Quality score: based on length, structure, readability
    const quality = this.calculateQualityScore(markdown, title);

    // Humanic score: check for robotic patterns
    const humanic = this.calculateHumanicScore(markdown);

    // SEO score: based on SEO best practices
    const seo = this.calculateSeoScore(content);

    // Trust score: based on source and claims
    const trust = this.calculateTrustScore(content);

    // Composite score
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

  // Quality: structure, length, readability
  private calculateQualityScore(markdown: string, title: string): number {
    let score = 50; // Base score

    // Title quality
    if (title.length > 10 && title.length < 100) score += 10;

    // Content length
    if (markdown.length > 500) score += 10;
    if (markdown.length > 1500) score += 10;

    // Structure: has headings
    if (markdown.includes("## ")) score += 10;

    // Structure: has lists
    if (markdown.includes("- ") || markdown.includes("1. ")) score += 5;

    // Structure: has paragraphs (not just one block)
    const paragraphs = markdown.split("\n\n").filter((p) => p.trim().length > 50);
    if (paragraphs.length >= 3) score += 5;

    return Math.min(100, Math.max(0, score));
  }

  // Humanic: anti-robotic scoring
  private calculateHumanicScore(markdown: string): number {
    let score = 70; // Start optimistic

    // Robotic patterns that decrease score
    const roboticPatterns = [
      "in conclusion",
      "it goes without saying",
      "at the end of the day",
      "leverage",
      "synergy",
      "delve",
      "furthermore",
      "moreover",
      "hence",
      "thereby",
      "utilize",
      "implement",
      "facilitate",
      "in today's",
      "in this article",
      "as we know",
      "it is important to note",
    ];

    const lowerContent = markdown.toLowerCase();
    for (const pattern of roboticPatterns) {
      if (lowerContent.includes(pattern)) {
        score -= 5;
      }
    }

    // Positive signals: varied sentence length, questions, personal pronouns
    if (markdown.includes("?")) score += 5;
    if (lowerContent.includes("i ") || lowerContent.includes("we ")) score += 5;
    if (lowerContent.includes("you ")) score += 5;

    // Check for overly uniform paragraph lengths
    const paragraphs = markdown.split("\n\n").filter((p) => p.trim().length > 0);
    if (paragraphs.length > 1) {
      const lengths = paragraphs.map((p) => p.length);
      const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
      const variance = lengths.reduce((sum, l) => sum + Math.pow(l - avgLength, 2), 0) / lengths.length;
      if (variance > 1000) score += 5; // Good: varied paragraph lengths
    }

    return Math.min(100, Math.max(0, score));
  }

  // SEO: search engine optimization
  private calculateSeoScore(content: Record<string, unknown>): number {
    let score = 40; // Base score

    const seoData = content.seoData as Record<string, unknown> | null;
    const markdown = (content.masterMarkdown as string) || "";

    // Has SEO data
    if (seoData) {
      if (seoData.metaTitle) score += 10;
      if (seoData.metaDescription) score += 10;
      if (seoData.focusKeyword) score += 10;
      if (seoData.headingStructure) score += 5;
    }

    // Content structure for SEO
    if (markdown.startsWith("# ")) score += 5; // Has H1
    if (markdown.includes("## ")) score += 5;  // Has H2s
    if (markdown.length > 1000) score += 5;    // Long-form content

    // Slug quality
    if (content.slug && (content.slug as string).length > 3) score += 5;

    return Math.min(100, Math.max(0, score));
  }

  // Trust: source credibility
  private calculateTrustScore(content: Record<string, unknown>): number {
    let score = 60; // Base score

    // Source type
    const sourceType = content.sourceType as string;
    if (sourceType === "manual") score += 15;
    else if (sourceType === "signal") score += 10;
    else if (sourceType === "trend") score += 5;

    // Has source notes
    if (content.sourceNotes) score += 10;

    // Has angle (unique perspective)
    if (content.angle) score += 10;

    // Has summary (well-processed)
    if (content.summary) score += 5;

    return Math.min(100, Math.max(0, score));
  }

  // Generate actionable feedback
  private generateFeedback(scores: ContentScores, content: Record<string, unknown>): ScoringFeedback {
    const quality: string[] = [];
    const humanic: string[] = [];
    const seo: string[] = [];
    const trust: string[] = [];

    // Quality feedback
    if (scores.quality < 60) {
      quality.push("Content needs more depth and structure");
      const markdown = (content.masterMarkdown as string) || "";
      if (markdown.length < 500) quality.push("Content is too short — aim for 1500+ words");
      if (!markdown.includes("## ")) quality.push("Add section headings for better structure");
    }

    // Humanic feedback
    if (scores.humanic < 60) {
      humanic.push("Content sounds too robotic or AI-generated");
      humanic.push("Remove generic phrases and add personal voice");
      humanic.push("Use varied sentence lengths and natural transitions");
    }

    // SEO feedback
    if (scores.seo < 60) {
      seo.push("SEO optimization is needed");
      seo.push("Add a meta title and description");
      seo.push("Define a focus keyword and use it naturally");
    }

    // Trust feedback
    if (scores.trust < 60) {
      trust.push("Add source notes and references");
      trust.push("Define a unique angle or perspective");
      trust.push("Include specific examples and data points");
    }

    // Overall feedback
    let overall: string;
    if (scores.composite >= AUTO_PUBLISH_THRESHOLD) {
      overall = "Content is ready for publishing. All dimensions meet the auto-publish threshold.";
    } else if (scores.composite >= HUMAN_REVIEW_THRESHOLD) {
      overall = "Content needs minor improvements before publishing. Human review recommended.";
    } else if (scores.composite >= FAILED_THRESHOLD) {
      overall = "Content needs significant work. Review all dimension feedback.";
    } else {
      overall = "Content does not meet quality standards. Consider rewriting from scratch.";
    }

    return { quality, humanic, seo, trust, overall };
  }
}

// Singleton
export const contentScorer = new ContentScorer();
