# Agent System Documentation

**AI Media Intelligence OS — Agent Catalog**

---

## Overview

The AI Media Intelligence OS employs a fleet of specialized AI agents, each responsible for a specific domain of the content lifecycle. Agents are not independent actors — they are orchestrated functions that operate within the content pipeline, each invoked at the right time with the right context.

The key insight behind the agent architecture is **task-based model routing**. Different tasks have different complexity levels, and using the most expensive model for every task wastes money without improving results. Tagging content does not require the same intellectual capacity as writing a master article. The agent system ensures each task is handled by the most cost-effective model that can deliver the required quality.

---

## Agent Catalog

### 1. Draft Agent

**Purpose**: Generate the canonical master article from an idea  
**Model Tier**: Premium (claude-3-opus)  
**File**: `src/lib/ai-orchestrator.ts` → `generateDraft()`

The Draft Agent is the most important agent in the system. It takes a raw idea — which could be a sentence, a paragraph, or a set of bullet points — and transforms it into a well-structured, authoritative master article. This is where the system's core philosophy of "authority compounding" is most directly expressed.

**Input**: `DraftInput`
- `idea` (required): The raw idea or topic
- `sources` (optional): Reference material to incorporate
- `angle` (optional): The unique perspective to take
- `tone` (optional): Writing tone (default: "professional")
- `targetLength` (optional): Word count target (default: 2000)

**Output**: `DraftOutput`
- `title`: The article title
- `subtitle`: A compelling subtitle
- `slug`: URL-safe identifier
- `markdown`: Full article in markdown format
- `summary`: 2-3 sentence summary
- `tags`: Suggested content tags
- `suggestedAngle`: The angle the agent decided to take

**Writing Principles (Baked into System Prompt)**:
- Lead with a compelling hook that challenges conventional thinking
- Build arguments with evidence, data, and specific examples
- Use analogies and stories to make complex ideas accessible
- Every paragraph must earn the reader's attention
- Write for humans, not search engines
- Avoid filler, fluff, and obvious statements

---

### 2. Humanic Rewrite Agent

**Purpose**: Make AI-generated text sound genuinely human  
**Model Tier**: Premium (claude-3-opus)  
**File**: `src/lib/ai-orchestrator.ts` → `humanicRewrite()`

The Humanic Rewrite Agent is the system's secret weapon. It takes AI-generated content and rewrites it to eliminate every telltale sign of machine authorship. This is not about adding random imperfections — it is about injecting genuine voice, personality, and natural language patterns that AI typically strips away.

**Input**: The master draft markdown
**Output**: `HumanicRewriteOutput`
- `markdown`: The rewritten content
- `changesApplied`: List of specific changes made
- `humanicScore`: Estimated humanic quality (0-100)

**Anti-Robotic Rewrite Rules**:
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

---

### 3. SEO Agent

**Purpose**: Generate comprehensive SEO metadata  
**Model Tier**: Mid (claude-3.5-sonnet)  
**File**: `src/lib/ai-orchestrator.ts` → `generateSeoPack()`

The SEO Agent creates a complete SEO package that serves readers first and search engines second. It follows the principle that good SEO is invisible — the reader should never feel like they're reading "SEO content."

**Input**: The humanic-rewritten content
**Output**: `SeoPack`
- `metaTitle`: 50-60 chars, compelling, includes primary keyword
- `metaDescription`: 150-160 chars, action-oriented
- `slug`: Concise, keyword-rich, URL-friendly
- `focusKeyword`: Primary keyword with search intent
- `secondaryKeywords`: 5-8 related long-tail keywords
- `headingStructure`: JSON array of headings with levels
- `schemaMarkup`: JSON-LD Article schema
- `readabilityScore`: Estimated Flesch-Kincaid score (0-100)

---

### 4. Repurpose Agent

**Purpose**: Adapt master content for different platforms  
**Model Tier**: Mid (claude-3.5-sonnet)  
**File**: `src/lib/ai-orchestrator.ts` → `generateRepurpose()`

The Repurpose Agent does not simply shorten or reformat content — it truly adapts and reimagines the master article for each platform's conventions, audience expectations, and native format. A WordPress post is fundamentally different from a Substack newsletter, and the agent understands these differences.

**Input**: Master content + target platform
**Output**: `RepurposeOutput`
- `platform`: Target platform identifier
- `title`: Platform-optimized title
- `body`: Platform-adapted content
- `variantType`: full, summary, thread, teaser, newsletter
- `metadataJson`: Platform-specific metadata

**Platform Guides**:

| Platform | Guide |
|----------|-------|
| WordPress | Long-form blog post (1500-2500 words), HTML formatting, internal linking |
| Medium | Medium-style article (800-1500 words), conversational tone, personal anecdotes |
| Blogger | Casual blog post (600-1200 words), friendly tone, simple formatting |
| Substack | Newsletter format (500-1000 words), personal voice, subscriber-focused |
| Beehiiv | Newsletter format (400-800 words), punchy, CTA-driven |
| DevTo | Technical article, code examples, developer community tone |
| Hashnode | Technical blog post, developer-focused, practical examples |
| Ghost | Clean blog post (1000-2000 words), minimal formatting, reader-first |
| Mirror | Web3/crypto focused, decentralized publishing tone |

---

### 5. Scoring Agent

**Purpose**: Evaluate content quality across 4 dimensions  
**Model Tier**: Mid (claude-3.5-sonnet)  
**File**: `src/lib/ai-orchestrator.ts` → `scoreContent()`, `src/lib/content-scoring.ts`

The Scoring Agent is the quality gatekeeper. It evaluates content across four dimensions and produces a composite score that determines whether content is auto-scheduled, flagged for human review, or sent back for rewriting. See [CONTENT_SCORING.md](./CONTENT_SCORING.md) for full details.

**Scoring Dimensions**:
1. **Writing Quality** (30% weight): clarity, redundancy, rhythm, grammar
2. **Humanic Score** (30% weight): anti-robotic, tone consistency, natural phrasing
3. **SEO Score** (20% weight): keyword alignment, heading quality, readability
4. **Trust Score** (20% weight): source quality, hallucination risk, confidence

**Action Thresholds**:
- Composite ≥ 80: `auto_schedule`
- Composite ≥ 60: `human_review`
- Composite < 60: `reject_rewrite`

---

### 6. Tagging Agent

**Purpose**: Extract relevant content tags  
**Model Tier**: Cheap (gpt-4o-mini)  
**File**: `src/lib/ai-orchestrator.ts` → `generateTags()`

The Tagging Agent extracts the most relevant tags from content, covering topic, format, and niche dimensions. Tags serve dual purposes: content organization and memory association.

**Input**: Content text
**Output**: Array of up to 8 tags (single words or short phrases)

Tags are used to:
- Organize and filter content in the dashboard
- Associate analytics outcomes with memory entries for reinforcement learning
- Identify content clusters and patterns

---

### 7. Summary Agent

**Purpose**: Generate concise content summaries  
**Model Tier**: Cheap (gpt-4o-mini)  
**File**: `src/lib/ai-orchestrator.ts` → `generateSummary()`

The Summary Agent creates compelling 2-3 sentence summaries that capture the essence and value of content. The summary should make the reader want to read the full piece.

**Input**: Content text
**Output**: Concise summary string

---

### 8. Formatting Agent

**Purpose**: Convert content between formats  
**Model Tier**: Cheap (gpt-4o-mini)  
**File**: `src/lib/ai-orchestrator.ts` → `formatContent()`

The Formatting Agent converts content between markdown, HTML, and plain text formats. It preserves content and structure while adapting the format.

**Input**: Markdown content + target format (html, plain, markdown)
**Output**: Formatted content string

Note: If the target format is markdown, the agent is a no-op — the content is returned as-is without an AI call.

---

### 9. Memory Agent

**Purpose**: Detect patterns and update memory from outcomes  
**Model Tier**: Mid (via scheduler)  
**File**: `src/lib/memory-system.ts` → `detectPatterns()`, `recordOutcome()`

The Memory Agent operates in two modes:
1. **Outcome Recording**: When analytics data arrives, it updates memory scores using reinforcement learning and stores platform-specific performance insights
2. **Pattern Detection**: It analyzes all active memories to identify high-performing and low-performing clusters, optimal timing windows, and actionable recommendations

**Pattern Detection Output**: `PatternDetection[]`
- `category`: The memory category
- `pattern`: Description of the detected pattern
- `confidence`: Confidence level (0-1)
- `evidence`: Supporting evidence from memory entries
- `recommendation`: Actionable recommendation

---

### 10. Editorial Agent

**Purpose**: Strategic editorial refinement and decision-making  
**Model Tier**: Premium (claude-3-opus)  
**File**: Future implementation (V2+)

The Editorial Agent will serve as the highest-level content strategist, capable of:
- Evaluating content strategy alignment
- Making editorial decisions based on memory and energy data
- Prioritizing content ideas based on predicted performance
- Managing content calendar optimization

This agent is not yet implemented and is planned for V2+.

---

## Agent Communication Pattern

Agents do not communicate with each other directly. They communicate through the shared data model:

```
Draft Agent writes → ContentItem.masterMarkdown
                     ↓
Humanic Agent reads → ContentItem.masterMarkdown
Humanic Agent writes → ContentItem.masterMarkdown (overwritten)
                     ↓
SEO Agent reads → ContentItem.masterMarkdown
SEO Agent writes → SeoData (new record)
                     ↓
Scoring Agent reads → ContentItem.masterMarkdown + SeoData
Scoring Agent writes → ContentItem.qualityScore, .humanicScore, .seoScore, .trustScore
                     ↓
Repurpose Agent reads → ContentItem.masterMarkdown
Repurpose Agent writes → ContentVariant (new records)
                     ↓
Publisher reads → ContentVariant + SeoData
Publisher writes → PublishJob (new record)
                     ↓
Analytics reads → PublishJob + platform data
Analytics writes → AnalyticsEvent (new records)
                     ↓
Memory Agent reads → AnalyticsEvent + ContentTag
Memory Agent writes → MemoryEntry (score updates)
```

This data-driven communication pattern ensures:
- **Loose coupling**: Agents can be modified independently
- **Auditability**: Every change is recorded in the data model
- **Resumability**: If an agent fails, the pipeline can resume from the last successful step
- **Observability**: System logs capture every agent action

---

## Cost Optimization

The tiered model routing strategy is designed to minimize AI costs while maintaining quality:

| Tier | Model | Approximate Cost/1K Tokens | Task Frequency |
|------|-------|---------------------------|----------------|
| Cheap | gpt-4o-mini | ~$0.00015 | High (every content item) |
| Mid | claude-3.5-sonnet | ~$0.003 | Medium (pipeline steps) |
| Premium | claude-3-opus | ~$0.015 | Low (critical content creation) |

For a typical content item, the cost breakdown is approximately:
- Draft generation (Premium, ~2000 tokens): ~$0.03
- Humanic rewrite (Premium, ~2000 tokens): ~$0.03
- SEO pack (Mid, ~1000 tokens): ~$0.003
- Scoring (Mid, ~1000 tokens): ~$0.003
- Tags + Summary (Cheap, ~500 tokens): ~$0.0001
- **Total per article: ~$0.07**

At 1 article per day, monthly AI costs are approximately $2-3 — dramatically cheaper than human content production.
