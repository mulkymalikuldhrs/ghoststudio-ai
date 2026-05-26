# Content Scoring System

**AI Media Intelligence OS — Quality Scoring Documentation**

---

## Philosophy

Not all content is equal. In a system that can autonomously publish, the difference between good content and mediocre content is not a matter of opinion — it is a matter of authority. Every article that falls below standard erodes the trust you have built with your audience. Every article that meets or exceeds it compounds that trust.

The Content Scoring System is the quality gate that prevents sub-standard content from reaching your audience. It evaluates every piece of content across four dimensions, calculates a composite score, and routes content to one of three actions: auto-schedule, human review, or reject and rewrite.

This is not about perfectionism — it is about consistency. A scoring system ensures that the minimum quality bar is maintained even when the human operator is not watching. In Full-Auto mode, the scoring system is the only thing standing between your audience and potentially bad content. That is why it must be rigorous.

---

## The Four Dimensions

### 1. Writing Quality (30% Weight)

**What it measures**: How well the content is written at the sentence and paragraph level.

| Sub-dimension | Score Range | What It Evaluates |
|--------------|-------------|-------------------|
| Clarity | 0-100 | Is the message clear and unambiguous? Are ideas expressed directly? |
| Redundancy | 0-100 | Is there unnecessary repetition? Does every sentence add value? |
| Rhythm | 0-100 | Does the prose flow naturally? Is there variety in sentence length and structure? |
| Grammar | 0-100 | Are there grammatical errors, typos, or awkward constructions? |

**Overall writing score**: Weighted average of the four sub-dimensions.

Writing quality is the foundation. If the writing is unclear, redundant, rhythmless, or ungrammatical, no amount of SEO or humanic editing can save it. The scoring agent evaluates these dimensions independently to provide specific feedback on where the writing succeeds and where it needs work.

### 2. Humanic Score (30% Weight)

**What it measures**: How well the content passes as human-written rather than AI-generated.

| Sub-dimension | Score Range | What It Evaluates |
|--------------|-------------|-------------------|
| Anti-Robotic | 0-100 | Does the text sound like it was written by a human? Watches for generic transitions, repetitive structures, hedging language, perfect grammar with no personality, lack of specific details |
| Tone Consistency | 0-100 | Is the voice consistent throughout? Does the personality feel authentic? |
| Natural Phrasing | 0-100 | Does it use natural language patterns? Are there contractions, colloquialisms, and human speech patterns? |

**Overall humanic score**: Weighted average of the three sub-dimensions.

The humanic score is the system's most distinctive quality measure. In an era where AI-generated content is increasingly common, the ability to produce content that sounds genuinely human is a competitive advantage. The anti-robotic sub-dimension specifically checks for patterns that are telltale signs of AI authorship — the same patterns that the Humanic Rewrite Agent is designed to eliminate.

### 3. SEO Score (20% Weight)

**What it measures**: How well the content is optimized for search engine discovery.

| Sub-dimension | Score Range | What It Evaluates |
|--------------|-------------|-------------------|
| Keyword Alignment | 0-100 | Are the focus and secondary keywords well-chosen? Do they match search intent? Are they naturally integrated? |
| Heading Quality | 0-100 | Is the heading structure logical and keyword-optimized? Does it follow H1→H2→H3 hierarchy? |
| Readability | 0-100 | Is the content readable for the target audience? Consider sentence length, paragraph structure, and complexity |

**Overall SEO score**: Weighted average of the three sub-dimensions.

SEO scoring is intentionally weighted lower than writing quality and humanic score. This reflects the philosophy that content should serve readers first and search engines second. Good content with decent SEO will always outperform mediocre content with perfect SEO because readers engage with it more.

### 4. Trust Score (20% Weight)

**What it measures**: How trustworthy and factually accurate the content appears to be.

| Sub-dimension | Score Range | What It Evaluates |
|--------------|-------------|-------------------|
| Source Quality | 0-100 | Are the sources authoritative, relevant, and credible? Are claims properly supported? |
| Hallucination Risk | 0-100 | Could any claims be fabricated? Are there unsupported assertions? Lower is better (0 = no risk) |
| Confidence | 0-100 | How confident is the overall assessment of factual accuracy? |

**Overall trust score**: Weighted average, with hallucination risk inverted (lower risk = higher score).

The trust score is the most important dimension for content authority. Publishing content with factual errors or unsupported claims destroys trust far more effectively than poor grammar or weak SEO. The hallucination risk sub-dimension is particularly important because AI models can generate plausible-sounding but incorrect information — the scoring system catches this before it reaches your audience.

---

## Composite Score Calculation

The composite score is a weighted average of the four dimensions:

```typescript
composite = (writing × 0.30) + (humanic × 0.30) + (seo × 0.20) + (trustAdjusted × 0.20)
```

Where `trustAdjusted` accounts for hallucination risk:

```typescript
trustAdjusted = trust - (hallucinationRisk × 0.3)
trustAdjusted = Math.max(0, Math.min(100, trustAdjusted))
```

This adjustment means that a high hallucination risk significantly penalizes the trust score. Content with a hallucination risk of 50 loses 15 points from its trust score. Content with a hallucination risk of 80 loses 24 points.

### Weight Rationale

| Dimension | Weight | Rationale |
|-----------|--------|-----------|
| Writing Quality | 30% | Foundation of all content — if the writing is bad, nothing else matters |
| Humanic Score | 30% | Differentiator in the AI age — human-sounding content outperforms robotic content |
| SEO Score | 20% | Important for discovery but secondary to quality — readers first, algorithms second |
| Trust Score | 20% | Critical for authority but harder to score accurately — weighted conservatively |

---

## Action Thresholds

Based on the composite score, content is routed to one of three actions:

### Auto-Schedule (Composite ≥ 80)

Content that scores 80 or above is approved for automatic scheduling without human review. This means:
- The writing is clear, well-structured, and grammatically sound
- The content sounds genuinely human
- The SEO is solid
- The factual accuracy is trustworthy

In Full-Auto mode, this content goes directly to the publishing queue.

### Human Review (Composite 60-79)

Content that scores between 60 and 79 is flagged for human review. This means:
- The content is acceptable but has room for improvement
- There may be specific sub-dimensions that need attention
- The operator should review and decide whether to publish, edit, or reject

The `humanReviewRequired` flag is set to `true` on the content item, and it appears in the review queue in the dashboard.

### Reject & Rewrite (Composite < 60)

Content that scores below 60 is rejected and sent back to the pipeline for rewriting. This means:
- The content has significant quality issues
- The cost of human editing would likely exceed the cost of regeneration
- The system should regenerate from the draft step

Rejected content returns to `editing` status and is re-queued for the content pipeline.

---

## Scoring Methods

### Full Scoring Pipeline

The `scoreContentFull` function runs all four scoring dimensions in parallel for maximum efficiency:

```typescript
const [writing, humanic, seo, trust] = await Promise.all([
  scoreWriting(markdown),
  scoreHumanic(markdown),
  scoreSeo(seoData || { content: markdown }),
  scoreTrust(sourceData || { content: markdown }),
]);
```

Each dimension makes an independent AI call with a specialized system prompt. The parallel execution reduces total scoring time from ~30 seconds (sequential) to ~10 seconds (parallel).

### Quick Score

The `quickScore` function provides a single-pass assessment for rapid quality checks:

```typescript
const response = await aiScore(systemPrompt, content.slice(0, 3000));
```

Quick scoring uses a single AI call to estimate all four dimensions. It is less accurate than full scoring but completes in ~3 seconds. Use cases:
- Real-time quality feedback during content editing
- Pre-screening before committing to a full score
- Bulk quality assessment of content backlogs

### Score Persistence

The `saveContentScores` function writes the composite score and its breakdown to the content item:

```typescript
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
```

This ensures that scores are always available for querying, filtering, and reporting without re-running the scoring pipeline.

---

## Scoring Response Parsing

AI responses are parsed using a robust JSON extraction function that handles:
- Markdown code blocks with `json` language tags
- Raw JSON objects embedded in text
- Fallback to default values if parsing fails

All numeric scores are clamped to the 0-100 range to prevent out-of-range values from corrupting the composite score.

---

## Quality Trend Analysis

Over time, scoring data enables quality trend analysis:

- **Average quality score**: Is the system improving or degrading?
- **Dimension breakdown trends**: Which dimensions need more attention?
- **Action distribution**: What percentage of content auto-schedules vs. requires review?
- **Rejection rate**: Is the pipeline consistently producing sub-standard content?

These trends should be monitored monthly. A declining average quality score indicates either:
- The AI model needs updating
- The Content DNA needs refinement
- The pipeline has a regression

---

## Customizing Scoring Weights

The scoring weights are defined as constants:

```typescript
export const SCORE_WEIGHTS = {
  writing: 0.30,
  humanic: 0.30,
  seo: 0.20,
  trust: 0.20,
};
```

Future versions will allow per-workspace weight customization through the `settingsJson` field. For example:
- A news-focused workspace might increase trust weight to 0.30 and decrease SEO to 0.10
- A personal blog might increase humanic weight to 0.40 and decrease SEO to 0.10
- A technical documentation site might increase writing quality to 0.40 and decrease humanic to 0.20

---

## Future Enhancements

- **Historical scoring**: Track how scores change after edits and rewrites
- **Scoring explanations**: AI-generated explanations for why content received specific scores
- **Comparative scoring**: Score content against the workspace's top-performing articles
- **Audience-adjusted scoring**: Factor in actual audience engagement data for score calibration
- **Multi-scorer consensus**: Run scoring with multiple models and average the results
- **Scoring fine-tuning**: Custom scoring models trained on the workspace's specific quality standards
