# System Architecture

**AI Media Intelligence OS — 7-Layer Architecture**

---

## Overview

The AI Media Intelligence OS is built on a 7-layer architecture where each layer has a single responsibility and communicates through well-defined interfaces. This separation ensures that changes in one layer do not cascade unpredictably through the system, and that each component can be tested, scaled, and replaced independently.

The architecture follows a strict dependency rule: **outer layers depend on inner layers, never the reverse**. The database layer knows nothing about the AI layer. The AI layer knows nothing about the publishing layer. This makes the system resilient to change.

---

## The 7 Layers

```
┌─────────────────────────────────────────────────┐
│  Layer 7: PRESENTATION (Next.js App Router)      │
│  Dashboard, Pages, API Routes                    │
├─────────────────────────────────────────────────┤
│  Layer 6: ORCHESTRATION (AI Orchestrator)         │
│  Pipeline Runner, Model Router, Task Coordinator  │
├─────────────────────────────────────────────────┤
│  Layer 5: AGENTS (Content, SEO, Memory, Energy)   │
│  Specialized AI Agents with Memory Context        │
├─────────────────────────────────────────────────┤
│  Layer 4: ENGINE (Content DNA, Scoring, Energy)    │
│  Business Logic, Rules, Quality Gates              │
├─────────────────────────────────────────────────┤
│  Layer 3: MEMORY (Memory System)                   │
│  Storage, Retrieval, Pattern Detection, Decay      │
├─────────────────────────────────────────────────┤
│  Layer 2: SCHEDULER (Job Queue)                    │
│  Priority Queue, Locking, Retry, Dead Letter       │
├─────────────────────────────────────────────────┤
│  Layer 1: PERSISTENCE (Prisma + SQLite)            │
│  Database, Migrations, Type-Safe Queries           │
└─────────────────────────────────────────────────┘
```

---

## Layer 1: Persistence

**Technology**: Prisma ORM + SQLite  
**File**: `prisma/schema.prisma`, `src/lib/db.ts`

The persistence layer is the foundation. It defines the canonical data model and provides type-safe access to the database. No other layer writes raw SQL or directly accesses the database — everything goes through the Prisma client.

### Responsibilities
- Define all database models and relationships
- Provide the singleton Prisma client (`db`)
- Handle migrations and schema evolution
- Ensure data integrity through constraints and indexes

### Key Models
- **User** — Authentication and authorization
- **Workspace** — Multi-tenant isolation boundary
- **ContentItem** — The canonical content entity
- **ContentVariant** — Platform-specific content adaptations
- **SeoData** — SEO metadata per content item
- **ContentTag** — Flexible tagging system
- **PublishJob** — Publishing attempt tracking
- **SchedulerJob** — Persistent job queue
- **AnalyticsEvent** — Immutable analytics data
- **MemoryEntry** — The moat: what worked, what failed
- **ApiCredential** — Encrypted platform credentials
- **SystemLog** — Audit trail
- **EnergyEntry** — Fatigue and saturation tracking

### Design Principles
- **SQLite for V1**: Simple deployment, zero external dependencies, sufficient for individual workspaces
- **Migration path to PostgreSQL**: Prisma makes switching a configuration change
- **Index-heavy**: Every query pattern has a dedicated index
- **Cascade deletes**: Workspace deletion cleans up all related data
- **Soft deactivation**: Memory entries use `isActive` rather than deletion

---

## Layer 2: Scheduler

**Technology**: Custom persistent job queue  
**File**: `src/lib/scheduler.ts`

The scheduler is the heartbeat of the system. It manages all asynchronous operations through a persistent, priority-based job queue with locking semantics for safe concurrent processing.

### Responsibilities
- Enqueue jobs with priority (1 = highest, 10 = lowest)
- Dequeue the next ready job (ordered by priority, then creation time)
- Lock jobs during processing to prevent concurrent execution
- Retry failed jobs with exponential backoff
- Move permanently failed jobs to a dead letter queue
- Run the daily autonomous cycle

### Job Types and Priorities

| Job Type | Default Priority | Description |
|----------|-----------------|-------------|
| `publish_job` | 3 (High) | Publish content to platform |
| `draft_job` | 5 (Normal) | Generate master draft |
| `rewrite_job` | 5 (Normal) | Humanic rewrite |
| `seo_job` | 5 (Normal) | Generate SEO pack |
| `scoring_job` | 5 (Normal) | Score content quality |
| `repurpose_job` | 7 (Low) | Generate platform variants |
| `analytics_job` | 7 (Low) | Collect analytics data |
| `memory_update_job` | 8 (Low) | Update memory from outcomes |
| `retry_job` | 9 (Lowest) | Retry previously failed jobs |

### Job Lifecycle

```
pending → locked → running → completed
                    ↓
                  failed → pending (retry with backoff)
                    ↓
                  dead_letter (max retries exceeded)
```

### Daily Autonomous Cycle

The `runDailyCycle` function executes once per day and performs:
1. Process up to 50 pending jobs
2. Find content with quality score ≥ 80 and status "ready", schedule for publishing
3. Clean up stale locks (jobs locked beyond their `lockUntil` timestamp)
4. Retry failed jobs or move them to dead letter

---

## Layer 3: Memory

**Technology**: Prisma + reinforcement learning  
**File**: `src/lib/memory-system.ts`

"Memory is the moat, not the model." This layer stores what worked, what failed, user preferences, and detected patterns. Every content decision is informed by accumulated memory, and the system gets smarter over time through reinforcement learning.

### Responsibilities
- Store and retrieve memories by category and key
- Search memories by content
- Update memory scores based on real outcomes (reinforcement learning)
- Detect high-performing and low-performing patterns
- Decay old memories to prevent stale data from dominating
- Provide platform-specific behavioral insights

### Memory Categories

| Category | Stores | Example |
|----------|--------|---------|
| `hook` | Opening hooks and their performance | "controversial_question: 87" |
| `topic` | Topics and their resonance | "ai_automation: 92" |
| `tone` | Voice/style effectiveness | "conversational: 78" |
| `timing` | Optimal publishing windows | "tuesday_9am: 85" |
| `cta` | Call-to-action effectiveness | "challenge_hook: 71" |
| `format` | Content format performance | "listicle: 66" |
| `platform` | Platform-specific behavior | "wordpress_long_form: 88" |
| `monetization` | Revenue patterns | "affiliate_natural: 74" |
| `audience` | Audience segment insights | "developers: 91" |
| `style` | Writing style preferences | "story_driven: 82" |

### Reinforcement Learning

When analytics data arrives (`recordOutcome`), the memory system:
1. Records the analytics event
2. Finds all memory entries related to the content's tags
3. Updates scores using the formula: `newScore = oldScore + learningRate * (outcome - oldScore)`
4. The learning rate is 0.1 — slow and steady, avoiding overreaction to single data points
5. Stores a platform-specific performance memory for future reference

### Decay

Memory scores naturally decay over time via the `decayMemories` function (default rate: 0.95). This prevents stale patterns from dominating decisions. Memories that decay below a score of 1 are deactivated.

---

## Layer 4: Engine

**Technology**: TypeScript business logic + AI scoring  
**Files**: `src/lib/content-scoring.ts`, `src/lib/energy-system.ts`

The engine layer contains the core business logic: content scoring and energy management. These are the quality gates that ensure content never degrades and the system never burns out.

### Content Scoring Engine

See [CONTENT_SCORING.md](./CONTENT_SCORING.md) for full details. The scoring engine evaluates content across four dimensions:
- **Writing Quality** (30% weight): clarity, redundancy, rhythm, grammar
- **Humanic Score** (30% weight): anti-robotic, tone consistency, natural phrasing
- **SEO Score** (20% weight): keyword alignment, heading quality, readability
- **Trust Score** (20% weight): source quality, hallucination risk, confidence

Based on the composite score, content is routed to one of three actions:
- **Auto-schedule** (≥80): Published without human intervention
- **Human Review** (≥60): Flagged for editorial review
- **Reject & Rewrite** (<60): Sent back to the pipeline

### Energy System Engine

See [ENERGY_SYSTEM.md](./ENERGY_SYSTEM.md) for full details. The energy system tracks five categories of fatigue:
- **Topic Fatigue**: Publishing too much on the same topic
- **Tone Fatigue**: Repetitive voice/style
- **Publish Saturation**: Too many posts in a time window
- **Audience Exhaustion**: Overwhelming the audience
- **Hook Repetition**: Reusing the same hooks

Each category has four states: fresh → moderate → tired → exhausted. When fatigue reaches "exhausted," the system blocks publishing in that category and recommends alternatives.

---

## Layer 5: Agents

**Technology**: AI agents with memory context  
**File**: `src/lib/ai-orchestrator.ts`

The agent layer contains specialized AI agents that perform content creation, editing, SEO optimization, and repurposing. Each agent operates with full memory context, ensuring decisions are informed by historical performance data.

See [AGENTS.md](./AGENTS.md) for the complete agent catalog.

### Agent Types

| Agent | Tier | Purpose |
|-------|------|---------|
| Draft Agent | Premium | Generates master article from ideas |
| Humanic Rewrite Agent | Premium | Breaks AI patterns, makes text sound human |
| SEO Agent | Mid | Generates SEO packs (meta, keywords, schema) |
| Repurpose Agent | Mid | Adapts content for different platforms |
| Scoring Agent | Mid | Evaluates content quality across 4 dimensions |
| Tagging Agent | Cheap | Extracts relevant tags from content |
| Summary Agent | Cheap | Generates concise content summaries |
| Formatting Agent | Cheap | Converts between markdown, HTML, plain text |
| Memory Agent | Mid | Detects patterns and updates memory scores |
| Editorial Agent | Premium | Strategic editorial refinement |

---

## Layer 6: Orchestration

**Technology**: Pipeline runner + model router  
**File**: `src/lib/ai-orchestrator.ts`

The orchestration layer ties everything together. It defines the content pipeline, routes tasks to appropriate AI models, and manages the flow of content through the system.

### Content Pipeline

```
Idea → Draft → Humanic Rewrite → SEO Pack → Scoring → Action
                                                          ↓
                                              Auto-Schedule / Review / Reject
                                                          ↓
                                              Repurpose → Publish → Analytics
                                                          ↓
                                              Memory Update → Pattern Detection
```

### Model Routing

See [AI_ROUTING.md](./AI_ROUTING.md) for full details.

| Tier | Model | Use Cases |
|------|-------|-----------|
| **Cheap** | gpt-4o-mini | Tagging, formatting, metadata extraction |
| **Mid** | claude-3.5-sonnet | SEO, repurpose, scoring, summaries |
| **Premium** | claude-3-opus | Master drafts, humanic rewrites, editorial |

### Pipeline Functions

- `generateDraft(input)` — Creates a master article from an idea (Premium tier)
- `humanicRewrite(draft)` — Rewrites to sound human (Premium tier)
- `generateSeoPack(content)` — Generates complete SEO metadata (Mid tier)
- `generateRepurpose(master, platform)` — Creates platform variants (Mid tier)
- `scoreContent(content)` — Scores across 4 dimensions (Mid tier)
- `runFullPipeline(input)` — Executes the complete pipeline sequentially

---

## Layer 7: Presentation

**Technology**: Next.js App Router + shadcn/ui + Tailwind CSS  
**Files**: `src/app/`, `src/components/`

The presentation layer is what users see and interact with. It includes both the server-side rendered dashboard and the API routes that serve as the backend.

### Dashboard Tabs

| Tab | Purpose |
|-----|---------|
| Content Pipeline | View, create, filter, and manage content items |
| Scheduler | Monitor job queue, process jobs, view queue stats |
| Memory | Browse, search, and manage memory entries |
| Analytics | View KPIs, trends, platform distribution, top performers |
| Energy | Monitor fatigue levels, get recommendations, reset fatigue |
| Settings | Configure automation mode, API credentials, system info |

### API Routes

| Route | Purpose |
|-------|---------|
| `/api/content` | Content CRUD operations |
| `/api/content/[id]/generate` | Trigger content generation pipeline |
| `/api/content/[id]/score` | Score a content item |
| `/api/publish` | Publish content to platforms |
| `/api/scheduler` | Manage scheduler jobs |
| `/api/scheduler/process` | Process next job in queue |
| `/api/memory` | Memory system operations |
| `/api/energy` | Energy system status and management |
| `/api/analytics` | Analytics data aggregation |
| `/api/projects` | Project/workspace management |
| `/api/stripe/*` | Payment and subscription management |
| `/api/auth/*` | NextAuth authentication |

### State Management

Zustand stores manage client-side state:
- `project-store.ts` — Project/workspace state
- `media-store.ts` — Content, queue, memory, energy, analytics, and UI state
- `app-store.ts` — Global application state

---

## Data Flow

### Content Creation Flow

```
1. User submits idea via dashboard
2. API route creates ContentItem (status: "idea")
3. Scheduler enqueues draft_job
4. Draft Agent generates master article (Premium tier)
5. ContentItem updated with masterMarkdown (status: "draft")
6. Humanic Rewrite Agent processes draft (Premium tier)
7. SEO Agent generates SEO pack (Mid tier)
8. Scoring Agent evaluates content (Mid tier)
9. Composite score determines action:
   - ≥80: Auto-schedule (status: "ready")
   - ≥60: Human review (status: "seo_review", humanReviewRequired: true)
   - <60: Reject (status: "editing", sent back)
10. Energy System checks before publish
11. If energy is sufficient, content is scheduled
12. Publisher sends to WordPress
13. Analytics data flows back into Memory
14. Memory updates scores via reinforcement learning
15. Pattern detection identifies new insights
```

### Daily Autonomous Cycle

```
1. runDailyCycle() is triggered
2. Process up to 50 pending jobs from the queue
3. Find all content with status "ready" and score ≥ 80
4. Schedule each for publishing (2 hours from now)
5. Clean up stale locks on stuck jobs
6. Retry failed jobs or move to dead letter
7. Apply natural decay to energy entries
8. Decay old memory scores
9. Log all cycle results
```

---

## Cross-Cutting Concerns

### Logging

Every layer logs actions through the `SystemLog` model. Logs include:
- Service identifier (scheduler, publisher, ai, analytics, memory, energy, scoring)
- Log level (debug, info, warn, error, critical)
- Action name
- Human-readable message
- Structured metadata (JSON)

### Error Handling

All layers follow the same error handling pattern:
1. Try the operation
2. Log the error to SystemLog
3. Return a safe fallback or throw a descriptive error
4. Never let a logging failure break the primary operation

### Workspace Isolation

All data is scoped to a workspace. Every query includes `workspaceId` as a filter, ensuring complete multi-tenant isolation. Workspace deletion cascades to all related data.
