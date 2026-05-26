# Content DNA System

**AI Media Intelligence OS — Content Engine Documentation**

---

## Philosophy

Content DNA is the genetic blueprint that makes every piece of content distinctively yours. It is not about templates or fill-in-the-blank frameworks — it is about encoding your unique voice, perspective, and authority into a system that can reproduce it at scale without dilution.

The core principle is simple: **One master, many variants.** Every piece of content starts as a single canonical markdown document. Platform-specific versions are derived from this master, never created independently. This prevents content fragmentation and ensures there is always a single source of truth.

The content engine follows a strict pipeline: Idea → Draft → Humanic Edit → SEO → Repurpose → Score → Publish. No step can be skipped. No shortcuts. Each step adds a specific layer of quality that the next step depends on.

---

## The Canonical Schema

### ContentItem: The Single Source of Truth

The `ContentItem` model is the canonical content entity. It contains:

- **Master Markdown**: The primary article content in markdown format
- **Title & Subtitle**: The article's headline structure
- **Slug**: URL-safe identifier
- **Angle**: The unique perspective or take on the topic
- **Topic**: The primary subject matter
- **Status**: Where in the lifecycle this content currently sits
- **Source Notes**: Raw ideas, links, voice notes that inspired the content
- **Source Type**: How the idea originated (idea, trend, manual, signal, repurpose)

### ContentVariant: Platform Adaptations

Each `ContentVariant` is derived from the master ContentItem. Variants are not copies — they are adaptations. A WordPress post and a Substack newsletter covering the same topic should feel native to their respective platforms while maintaining the core message and authority of the master.

Variant types:
- **full**: Complete platform-native adaptation
- **summary**: Condensed version for teasers and previews
- **thread**: Twitter/X thread format
- **teaser**: Short preview with CTA to full content
- **newsletter**: Email-optimized format with personal voice

### SeoData: Search Metadata

SEO metadata is stored separately from content, enabling independent updates and scoring. The SEO pack includes:
- Meta title and description
- Focus keyword and secondary keywords
- URL slug
- Heading structure (H1 → H2 → H3 hierarchy)
- Internal link suggestions
- JSON-LD schema markup
- Readability score estimate

---

## Content Pipeline

The content pipeline is a sequential process where each step transforms and enriches the content. No step operates in isolation — each step reads from the output of the previous step and writes to the shared data model.

```
┌─────────┐     ┌─────────┐     ┌──────────┐     ┌─────────┐     ┌─────────┐
│  IDEA    │────>│  DRAFT  │────>│  HUMANIC │────>│   SEO   │────>│  SCORE  │
│  Input   │     │  Agent  │     │  Rewrite │     │  Agent  │     │  Agent  │
│          │     │ Premium │     │  Agent   │     │  Mid    │     │  Mid    │
│          │     │         │     │  Premium │     │         │     │         │
└─────────┘     └─────────┘     └──────────┘     └─────────┘     └────┬────┘
                                                                      │
                                    ┌──────────────────────────────────┤
                                    │                                  │
                                    ▼                                  ▼
                             ┌──────────┐                      ┌──────────┐
                             │  READY   │                      │  REJECT  │
                             │  (≥ 80)  │                      │  (< 60)  │
                             └────┬─────┘                      └────┬─────┘
                                  │                                  │
                                  ▼                                  ▼
                           ┌────────────┐                     ┌──────────┐
                           │ REPURPOSE  │                     │  REWRITE │
                           │  Agent     │                     │  (Back   │
                           │  Mid       │                     │  to step │
                           └─────┬──────┘                     │  2)      │
                                 │                            └──────────┘
                                 ▼
                           ┌────────────┐
                           │  PUBLISH   │
                           │  WordPress │
                           └─────┬──────┘
                                 │
                                 ▼
                           ┌────────────┐
                           │ ANALYTICS  │
                           │  Feedback  │
                           └─────┬──────┘
                                 │
                                 ▼
                           ┌────────────┐
                           │  MEMORY    │
                           │  UPDATE    │
                           └────────────┘
```

### Step 1: Idea Capture

The pipeline begins with an idea. Ideas can come from:
- **Manual input**: The operator types an idea directly
- **Trend signals**: The system identifies trending topics (future)
- **Repurpose**: Existing content is being adapted for a new platform or angle
- **Memory suggestions**: The system suggests topics based on high-performing patterns

The idea is stored as a `ContentItem` with status `idea`, along with any source notes.

### Step 2: Draft Generation (Premium Tier)

The Draft Agent generates the master article. This is the most computationally expensive step because it requires the deepest thinking. The agent:
- Analyzes the idea and source material
- Selects a compelling angle (or uses the provided one)
- Structures the article with a strong opening hook
- Writes in the configured tone and target length
- Generates a title, subtitle, slug, summary, and tags

The output is stored in `ContentItem.masterMarkdown` and the status moves to `draft`.

### Step 3: Humanic Rewrite (Premium Tier)

The Humanic Rewrite Agent takes the AI-generated draft and rewrites it to sound human. This step is critical because AI-generated content has telltale patterns:
- Repetitive sentence structures
- Generic transitions
- Hedging language
- Perfect grammar with no personality
- Vague generalizations

The rewriter applies 10 specific anti-robotic rules (listed in [AGENTS.md](./AGENTS.md)) to break these patterns while preserving the core message and value. The output replaces the `masterMarkdown` and the status moves to `editing`.

### Step 4: SEO Pack Generation (Mid Tier)

The SEO Agent generates a complete SEO metadata pack. This includes meta title, meta description, focus keyword, secondary keywords, heading structure, internal link suggestions, JSON-LD schema markup, and a readability score. The SEO data is stored in the `SeoData` model and the status moves to `seo_review`.

### Step 5: Content Scoring (Mid Tier)

The Scoring Agent evaluates the content across four dimensions and calculates a composite score. Based on the result:
- **≥ 80**: Content is auto-approved for scheduling (status: `ready`)
- **≥ 60**: Content is flagged for human review (status: `ready`, `humanReviewRequired: true`)
- **< 60**: Content is rejected and sent back for rewriting (status: `editing`)

See [CONTENT_SCORING.md](./CONTENT_SCORING.md) for full scoring details.

### Step 6: Platform Repurposing (Mid Tier)

For each target platform, the Repurpose Agent creates a `ContentVariant` adapted for that platform's conventions, format, and audience. The adaptation is not a simple reformat — it reimagines the content for the platform while maintaining the core message.

### Step 7: Publishing

Content is published to the target platform (WordPress in V1). Before publishing, the Energy System checks whether the workspace has sufficient energy to publish without causing fatigue or saturation. If the energy check passes, the content is published and the status moves to `published`.

### Step 8: Analytics Feedback

After publishing, analytics data flows back into the system via `AnalyticsEvent` records. This data triggers the memory reinforcement learning loop, updating scores for related memory entries.

---

## Humanic Rules: The 10 Commandments

The Humanic Rewrite Agent operates by 10 inviolable rules. These are not suggestions — they are hard-coded into the system prompt and applied to every piece of content.

### Rule 1: Break Repetitive Sentence Structures
Vary sentence length, rhythm, and cadence. AI tends to produce sentences of similar length and structure. The rewrite should include a mix of short punchy sentences and longer, more complex ones.

### Rule 2: Remove Generic Transitions
"Forward", "Additionally", "In conclusion", "Moreover", "It is worth noting" — these are AI telltales. Replace them with natural transitions or eliminate them entirely. Good writing flows without signposts.

### Rule 3: Replace Robotic Phrases
"In today's rapidly evolving landscape", "It goes without saying", "At the end of the day" — these phrases signal AI authorship. Replace with specific, concrete language that a real person would use.

### Rule 4: Add Personality
Voice, opinion, conviction. AI-generated content is often neutral to a fault. The rewrite should take positions, express preferences, and show the writer's personality.

### Rule 5: Insert Specific Details
Replace "many people" with "3 out of 5 product managers I spoke with". Replace "recently" with "last Tuesday". Specificity is the hallmark of human writing.

### Rule 6: Use Natural Speech Patterns
Contractions ("don't" not "do not"), colloquialisms, and conversational phrasing make content feel human. This does not mean being unprofessional — it means being natural.

### Rule 7: Create Unexpected Connections
AI follows logical sequences. Humans make surprising connections between ideas. A paragraph about machine learning might reference a cooking technique if the analogy works. These unexpected bridges are distinctly human.

### Rule 8: Address the Reader Directly
Rhetorical questions, direct address ("you"), and conversational asides break the fourth wall and create engagement. AI rarely does this naturally.

### Rule 9: Eliminate Hedging Language
"might", "could potentially", "it seems", "arguably" — AI hedges because it is trained to be cautious. Confident writing takes a position and defends it.

### Rule 10: Make It Feel Cared About
The most important rule. The text should feel like it was written by someone who genuinely cares about the topic and the reader's understanding. This comes through in the depth of explanation, the quality of examples, and the overall investment of thought.

---

## Content DNA Configuration

Each workspace has a `settingsJson` field that stores the Content DNA configuration. This is the genetic blueprint that shapes all content produced in that workspace.

### DNA Fields

```json
{
  "contentDNA": {
    "voice": "authoritative but approachable",
    "tone": "professional with personality",
    "audience": "mid-career professionals in tech",
    "niche": "AI automation and productivity",
    "perspective": "practical skeptic — excited but grounded",
    "values": ["honesty", "depth", "actionability"],
    "avoid": ["hype", "vague advice", "listicles for SEO"],
    "signature_moves": [
      "opening with a contrarian hook",
      "using specific data points",
      "ending with a challenge, not a summary"
    ]
  }
}
```

### How DNA Influences Content

1. **Draft Agent**: Uses voice, tone, audience, and perspective to shape the master article
2. **Humanic Rewrite**: Uses values and signature_moves to guide the rewrite
3. **Repurpose Agent**: Adapts tone and perspective for each platform's audience
4. **Scoring Agent**: Checks whether content aligns with stated values and avoids

The DNA is not rigid — it is a direction, not a constraint. The system uses it as context for AI prompts, not as hardcoded rules. This allows the AI to be creative within the DNA's boundaries while staying true to the workspace's identity.

---

## Content Versioning

Content items support immutable versioning via the `version` field. Each time a content item goes through a significant transformation (draft generation, humanic rewrite, editorial edit), the version is incremented.

The versioning system ensures:
- **Auditability**: You can track how content evolved over time
- **Rollback**: If a rewrite degrades quality, you can identify the previous version
- **A/B comparison**: Future versions may support comparing versions side by side

Current implementation uses a simple integer counter. Future versions may implement full version snapshots with diff tracking.

---

## Repurpose Strategy

The repurpose strategy follows a "hub and spoke" model:

```
                ┌───────────┐
                │  MASTER   │
                │  ARTICLE  │
                └─────┬─────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
   ┌────▼────┐  ┌────▼────┐  ┌────▼────┐
   │WordPress│  │Substack │  │ Medium  │
   │  (Hub)  │  │(Spoke)  │  │(Spoke)  │
   └─────────┘  └─────────┘  └─────────┘
        │             │             │
   ┌────▼────┐  ┌────▼────┐  ┌────▼────┐
   │  Full   │  │Newsletter│  │ Article │
   │  Post   │  │  Digest │  │ Version │
   └─────────┘  └─────────┘  └─────────┘
```

WordPress serves as the canonical hub where the full master article lives. All other platforms are spokes that receive adapted versions. This ensures:
- The full, authoritative version always has a permanent home
- Spokes can drive traffic back to the hub
- Platform-specific adaptations add value rather than just shrinking content
- SEO authority accumulates on the hub domain

See [PLATFORM_STRATEGY.md](./PLATFORM_STRATEGY.md) for the full distribution strategy.
