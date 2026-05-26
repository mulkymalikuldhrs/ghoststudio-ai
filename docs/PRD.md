# Product Requirements Document

**AI Media Intelligence OS — PRD**

---

## Product Vision

AI Media Intelligence OS is an autonomous content operating system that enables solo creators and small teams to build compounding media authority without hiring a content team. The system handles the full content lifecycle — from ideation to publication to learning from outcomes — while the human operator provides strategic direction and editorial judgment.

### Core Philosophy

**Authority Compounding**: Every piece of content should make the next one more valuable. Every data point should make the next decision smarter. Every memory should make the next article more resonant. This is the opposite of the "publish 10 articles a day" spam approach.

**The system does not replace human judgment — it amplifies it.** The operator sets the direction, the system executes at scale.

---

## Target Users

### Primary: Solo Content Entrepreneurs
- Bloggers and newsletter writers who want to scale without sacrificing quality
- Subject matter experts who want to build authority in their niche
- Creators who are tired of spending 80% of their time on production and 20% on strategy

### Secondary: Small Content Teams (2-5 people)
- Marketing teams that need to produce high-quality content consistently
- Agencies managing multiple client blogs
- Startups that need thought leadership but can't afford a full content team

### Tertiary: Enterprise Media Operations
- Large publishers exploring AI-assisted content workflows
- Companies that need audit trails and quality gates for compliance

---

## Problem Statement

Current AI writing tools have a fundamental flaw: they produce content that reads like AI wrote it. This destroys authority rather than building it. The more AI-generated content floods the internet, the more valuable genuinely human-sounding content becomes.

Meanwhile, creators face a trilemma:
1. **Quality** — Well-researched, original, authoritative content
2. **Quantity** — Enough content to maintain visibility and momentum
3. **Consistency** — Regular publishing schedule that builds audience habits

Most creators can achieve two of these three. AI Media Intelligence OS achieves all three by:
- Using AI for scale (quantity)
- Applying humanic rewriting rules (quality)
- Employing memory and scoring systems (consistency)

---

## Product Requirements

### FR-01: Content Pipeline

**Requirement**: The system must provide a complete content pipeline from idea to publication.

- FR-01.1: Accept content ideas via text input
- FR-01.2: Generate master article drafts using AI (Premium tier models)
- FR-01.3: Apply humanic rewriting to break AI patterns
- FR-01.4: Generate SEO metadata packs (meta title, description, keywords, schema)
- FR-01.5: Score content across 4 dimensions before publishing
- FR-01.6: Route content to auto-schedule, human review, or reject based on scores
- FR-01.7: Support the full pipeline as a single function call or step-by-step

### FR-02: Content DNA Schema

**Requirement**: Content must follow a canonical schema with one master and multiple platform variants.

- FR-02.1: Each piece of content has a single master markdown document
- FR-02.2: Platform variants are derived from the master, not independently created
- FR-02.3: Variants track their platform, type (full/summary/thread/teaser/newsletter), and status
- FR-02.4: Content status follows a defined lifecycle: idea → draft → editing → seo_review → ready → scheduled → published → archived
- FR-02.5: Content items support version tracking (immutable versioning)
- FR-02.6: Content items can reference a parent for repurposed content

### FR-03: Memory System

**Requirement**: The system must learn from outcomes and inform future content decisions.

- FR-03.1: Store memories across 10 categories (hook, topic, tone, timing, cta, format, platform, monetization, audience, style)
- FR-03.2: Update memory scores based on real analytics data (reinforcement learning)
- FR-03.3: Detect high-performing and low-performing patterns automatically
- FR-03.4: Decay old memories to prevent stale data from dominating
- FR-03.5: Provide platform-specific behavioral insights (best hooks, topics, timing)
- FR-03.6: Support memory search and retrieval by category and content
- FR-03.7: Never delete memories — deactivate them instead

### FR-04: Content Scoring

**Requirement**: All content must be scored before publication to maintain quality standards.

- FR-04.1: Score writing quality (clarity, redundancy, rhythm, grammar)
- FR-04.2: Score humanic quality (anti-robotic, tone consistency, natural phrasing)
- FR-04.3: Score SEO quality (keyword alignment, heading quality, readability)
- FR-04.4: Score trustworthiness (source quality, hallucination risk, confidence)
- FR-04.5: Calculate composite score with configurable weights
- FR-04.6: Route to auto-schedule (≥80), human review (≥60), or reject (<60)
- FR-04.7: Save scores to the content item and set humanReviewRequired flag

### FR-05: Energy System

**Requirement**: The system must prevent content exhaustion and audience fatigue.

- FR-05.1: Track topic fatigue per workspace
- FR-05.2: Track tone fatigue per workspace
- FR-05.3: Track publish saturation per workspace
- FR-05.4: Track audience exhaustion per workspace
- FR-05.5: Track hook repetition per workspace
- FR-05.6: Apply natural decay to fatigue scores over time
- FR-05.7: Block publishing when fatigue is exhausted
- FR-05.8: Generate recommendations for managing fatigue
- FR-05.9: Provide pre-publish energy checks

### FR-06: Scheduler

**Requirement**: The system must manage async operations through a persistent job queue.

- FR-06.1: Enqueue jobs with priority levels (1-10)
- FR-06.2: Dequeue jobs ordered by priority, then creation time
- FR-06.3: Lock jobs during processing to prevent concurrent execution
- FR-06.4: Retry failed jobs with exponential backoff
- FR-06.5: Move permanently failed jobs to dead letter queue
- FR-06.6: Support 9 job types (draft, rewrite, seo, publish, analytics, memory_update, repurpose, scoring, retry)
- FR-06.7: Run daily autonomous cycle for unattended operation

### FR-07: Publishing

**Requirement**: The system must publish content to external platforms.

- FR-07.1: V1: Full WordPress REST API v2 support
- FR-07.2: Support creating drafts, publishing, scheduling, and updating posts
- FR-07.3: Support category and tag management
- FR-07.4: Include retry logic with exponential backoff and jitter
- FR-07.5: Test connectivity before publishing
- FR-07.6: Log all publishing actions and errors
- FR-07.7: Store encrypted API credentials per workspace

### FR-08: Dashboard

**Requirement**: The system must provide a comprehensive web dashboard.

- FR-08.1: Content Pipeline view with creation, filtering, and detail dialogs
- FR-08.2: Scheduler view with queue status and job management
- FR-08.3: Memory view with category filters and search
- FR-08.4: Analytics view with KPI cards and charts
- FR-08.5: Energy view with fatigue indicators and recommendations
- FR-08.6: Settings view for automation mode and API credentials
- FR-08.7: Support Manual, Semi-Auto, and Full-Auto automation modes
- FR-08.8: Responsive design for desktop and mobile

### FR-09: Authentication & Multi-Tenancy

**Requirement**: The system must support user authentication and workspace isolation.

- FR-09.1: Email/password authentication via NextAuth
- FR-09.2: Workspace-based multi-tenancy
- FR-09.3: User roles: operator, admin, viewer
- FR-09.4: All data scoped to workspace ID
- FR-09.5: Cascade delete on workspace removal

### FR-10: Automation Modes

**Requirement**: The system must support progressive automation levels.

- FR-10.1: **Manual** mode: All actions require explicit user initiation
- FR-10.2: **Semi-Auto** mode: AI generates and scores, human approves before publish
- FR-10.3: **Full-Auto** mode: AI generates, scores, and publishes autonomously (with quality gates)

---

## Non-Functional Requirements

### NFR-01: Performance
- Content generation pipeline must complete in under 60 seconds
- Dashboard API responses must return in under 500ms
- Scheduler must process at least 50 jobs per daily cycle

### NFR-02: Reliability
- Publishing must retry up to 3 times with exponential backoff
- Job processing must be idempotent where possible
- Failed jobs must be tracked and recoverable

### NFR-03: Security
- API credentials must be encrypted at rest
- Authentication tokens must use secure HTTP-only cookies
- All API routes must validate workspace ownership
- No PII in logs

### NFR-04: Observability
- All actions logged via SystemLog model
- Structured metadata for every log entry
- Error logging never breaks primary operations
- Audit trail for all publishing actions

### NFR-05: Scalability
- SQLite for V1 (single-user workloads)
- Architecture supports migration to PostgreSQL
- Workspace isolation enables horizontal scaling

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Content quality score | Average ≥ 75 | Composite score across all published content |
| Time to publish | < 5 minutes from idea to scheduled | Pipeline execution time |
| Human review rate | < 30% of content requires review | Scoring action distribution |
| Memory accuracy | Top memories correlate with top performers | Score-to-outcome correlation |
| Energy violations | 0 content published when exhausted | Pre-publish gate compliance |
| Publishing reliability | > 99% successful publishes | Retry-adjusted success rate |

---

## Out of Scope (V1)

- Multi-platform publishing (beyond WordPress)
- Real-time analytics from external platforms
- A/B testing of content variants
- Image generation or visual content
- Video content pipeline
- Team collaboration features
- White-label / custom branding
- Mobile native app
- Public API for third-party integrations
- Content calendar UI
- Email newsletter distribution
