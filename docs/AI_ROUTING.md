# AI Model Routing Strategy

**AI Media Intelligence OS — Model Routing Documentation**

---

## Overview

The AI Media Intelligence OS uses a three-tier model routing strategy to balance cost, speed, and quality across different content operations. Not every task requires the most capable (and expensive) model. Tagging content does not demand the same intellectual capacity as writing a master article. The routing strategy ensures each task is handled by the most cost-effective model that can deliver the required quality.

This is not about being cheap — it is about being smart. Spending $0.015 per 1K tokens on a tagging task that could be done for $0.00015 is not just wasteful; it is architecturally wrong. The savings from smart routing compound over thousands of content operations.

---

## The Three Tiers

### Cheap Tier

| Attribute | Value |
|-----------|-------|
| **Model** | `openai/gpt-4o-mini` |
| **Approximate Cost** | $0.00015 per 1K tokens |
| **Speed** | Very fast (< 2 seconds typical) |
| **Best For** | Classification, extraction, formatting, short transformations |

The cheap tier handles tasks that require pattern matching and structured output but not deep reasoning. These are tasks where a smaller model performs within 95%+ of a premium model's quality at 1/100th the cost.

**When to use**: When the task is well-defined, the output format is specified, and the content does not require creative reasoning.

### Mid Tier

| Attribute | Value |
|-----------|-------|
| **Model** | `anthropic/claude-3.5-sonnet` |
| **Approximate Cost** | $0.003 per 1K tokens |
| **Speed** | Fast (3-8 seconds typical) |
| **Best For** | Analysis, summarization, adaptation, quality assessment |

The mid tier handles tasks that require solid reasoning and good writing quality but not the deepest creative or editorial thinking. This is the workhorse tier — it handles the majority of pipeline steps.

**When to use**: When the task requires understanding context, making judgments, or producing structured analytical output.

### Premium Tier

| Attribute | Value |
|-----------|-------|
| **Model** | `anthropic/claude-3-opus` |
| **Approximate Cost** | $0.015 per 1K tokens |
| **Speed** | Slower (8-20 seconds typical) |
| **Best For** | Creative writing, editorial judgment, strategic thinking |

The premium tier handles the most demanding tasks — the ones where the difference between good and great matters. This is where the master article is born, where the humanic rewrite happens, where editorial decisions are made.

**When to use**: When the task requires original thinking, creative writing, or nuanced judgment that noticeably benefits from a more capable model.

---

## Task-to-Tier Routing Table

| Task | Tier | Model | Rationale |
|------|------|-------|-----------|
| `tagging` | Cheap | gpt-4o-mini | Extracting keywords from text is classification, not creation |
| `formatting` | Cheap | gpt-4o-mini | Converting between formats follows well-defined rules |
| `metadata` | Cheap | gpt-4o-mini | Generating metadata from content is extraction |
| `summary` | Mid | claude-3.5-sonnet | Summarization requires understanding nuance and priority |
| `seo` | Mid | claude-3.5-sonnet | SEO requires understanding search intent and content structure |
| `repurpose` | Mid | claude-3.5-sonnet | Adapting content requires understanding platform conventions |
| `scoring` | Mid | claude-3.5-sonnet | Quality assessment requires analytical judgment |
| `draft` | Premium | claude-3-opus | Master article creation demands the best creative writing |
| `master_article` | Premium | claude-3-opus | Canonical content must be the highest quality |
| `humanic_rewrite` | Premium | claude-3-opus | Breaking AI patterns requires deep language understanding |
| `editorial` | Premium | claude-3-opus | Editorial decisions require the most nuanced judgment |
| `strategic_writing` | Premium | claude-3-opus | Strategic content requires original thinking |

---

## Cost Analysis

### Per-Task Cost Estimates

| Task | Avg Input Tokens | Avg Output Tokens | Total Cost |
|------|-----------------|------------------|------------|
| Tagging (Cheap) | 500 | 100 | ~$0.0001 |
| Formatting (Cheap) | 500 | 500 | ~$0.0002 |
| Summary (Mid) | 1,000 | 200 | ~$0.004 |
| SEO Pack (Mid) | 2,000 | 500 | ~$0.008 |
| Repurpose (Mid) | 2,500 | 1,000 | ~$0.011 |
| Scoring (Mid) | 2,000 | 300 | ~$0.007 |
| Draft (Premium) | 500 | 2,000 | ~$0.030 |
| Humanic Rewrite (Premium) | 2,000 | 2,000 | ~$0.060 |

### Per-Article Cost Estimate

For a single article going through the full pipeline:

| Step | Cost |
|------|------|
| Draft generation | $0.030 |
| Humanic rewrite | $0.060 |
| SEO pack | $0.008 |
| Scoring | $0.007 |
| Tags + Summary | $0.0003 |
| **Total per article** | **~$0.105** |

### Monthly Cost Projections

| Articles/Month | Monthly AI Cost | Cost per Article |
|---------------|----------------|-----------------|
| 10 | ~$1.05 | $0.105 |
| 30 | ~$3.15 | $0.105 |
| 60 | ~$6.30 | $0.105 |
| 100 | ~$10.50 | $0.105 |

Compare this to:
- Hiring a content writer: $100-500 per article
- Using a human-only editorial process: $50-200 per article
- Other AI writing platforms: $20-50/month but with lower quality gates

The AI Media Intelligence OS delivers full-pipeline content with scoring, memory, and energy management for approximately $0.10 per article.

---

## Routing Implementation

### The Core Router

```typescript
export const MODEL_MAP: Record<ModelTier, string> = {
  cheap: 'openai/gpt-4o-mini',
  mid: 'anthropic/claude-3.5-sonnet',
  premium: 'anthropic/claude-3-opus',
};

export const TASK_MODEL_MAP: Record<string, ModelTier> = {
  tagging: 'cheap',
  formatting: 'cheap',
  metadata: 'cheap',
  summary: 'mid',
  seo: 'mid',
  repurpose: 'mid',
  scoring: 'mid',
  draft: 'premium',
  master_article: 'premium',
  humanic_rewrite: 'premium',
  editorial: 'premium',
  strategic_writing: 'premium',
};
```

### Resolution Logic

```typescript
const resolvedTier = tier || (taskType ? TASK_MODEL_MAP[taskType] : 'mid');
```

The routing system resolves the model tier through:
1. **Explicit tier override**: If the caller specifies a tier, use it
2. **Task type lookup**: If a task type is provided, look it up in the routing table
3. **Default to mid**: If neither is specified, use the mid tier (safest default)

This three-level resolution ensures flexibility without sacrificing the routing strategy.

### Override Capability

The `aiCall` function accepts an optional `tier` parameter that overrides the task-based routing. This is useful for:
- Testing a task with a different model to compare quality
- Upgrading a specific task when quality is more important than cost
- Downgrading a task when cost is more important than quality

---

## Future Model Strategy

### Model Swappability

The routing table is a configuration, not a hard-coded dependency. When new models become available:
- Update `MODEL_MAP` to point to the new model
- No changes to any calling code
- A/B test the new model by temporarily routing specific tasks to it

### Potential Model Upgrades

| Current | Potential Upgrade | Impact |
|---------|------------------|--------|
| gpt-4o-mini | gpt-4o-nano (if released) | Even cheaper classification |
| claude-3.5-sonnet | claude-3.5-sonnet-v2 | Better mid-tier quality |
| claude-3-opus | claude-4-opus | Best available creative writing |

### Custom Model Support

Future versions may support:
- **Fine-tuned models**: Custom models trained on your specific content DNA
- **Local models**: Self-hosted models for privacy-sensitive operations
- **Model cascades**: Try cheap first, escalate to premium if quality is insufficient
- **Quality-aware routing**: Route based on content complexity, not just task type

---

## Monitoring Model Performance

### Metrics to Track

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| Response time | How long each model takes | > 30 seconds |
| Error rate | Percentage of failed API calls | > 5% |
| Token usage | Input and output tokens per call | Unexpected spikes |
| Cost per article | Total AI cost per content item | > $0.20 |
| Quality regression | Score changes after model swaps | Average score drops > 5 points |

### Logging

Every AI call is logged to `SystemLog` with:
- Tier and model used
- Task type
- Response length
- Success/failure status

This enables post-hoc analysis of model performance and cost optimization opportunities.
