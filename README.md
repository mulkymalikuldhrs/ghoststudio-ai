# AI Media Intelligence OS

> **Autonomous Media Operating System**

Authority Compounding Engine. Memory-Driven Publishing Infrastructure. Not a tool, not a CMS, not an autoblog — an orchestration layer.

![AI Media Intelligence OS](https://img.shields.io/badge/AI_Media-Intelligence_OS-DC2626?style=for-the-badge&labelColor=0A0A0A)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss)

---

## Core Philosophy

**Wrong approach:** Spam publishing, AI article farming, quantity-first, copy-paste repurpose.

**Correct approach:** Authority compounding, memory-driven writing, platform-native distribution, analytics adaptation, trust-first monetization.

### The True Content Loop

```
Signal → Interpretation → Content → Distribution → Audience → Analytics → Memory → Strategy Update → New Signal
```

The system handles: drafting, rewriting, repurposing, scheduling, publishing, analytics, memory, optimization, trend tracking, audience learning.

The operator only: gives direction, gives ideas, oversees quality, makes strategic decisions.

---

## Key Insight

> **Memory is the moat. Not the model.**

Your competitive advantage isn't which LLM you use — it's the accumulated knowledge of what works for your audience. Every publish cycle makes the next one smarter.

---

## V1 Features

- **Content Pipeline** — Idea → Draft → Humanic Rewrite → SEO → Score → Publish
- **WordPress Adapter** — Full REST API integration (create draft, publish, schedule, update)
- **AI Orchestrator** — Model routing (cheap/mid/premium) via OpenRouter
- **Memory System** — Store and retrieve what works (hooks, topics, tone, timing, CTAs)
- **Content Scoring** — Writing, Humanic, SEO, Trust dimensions with action thresholds
- **Energy System** — Fatigue tracking to prevent content decay and audience burnout
- **Scheduler** — Persistent job queue with priority, retry, and dead-letter support
- **Dashboard** — Full control panel with Content Pipeline, Scheduler, Memory, Analytics, Energy tabs

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 + shadcn/ui |
| **Database** | Prisma ORM (SQLite → PostgreSQL) |
| **State** | Zustand + TanStack Query |
| **AI** | z-ai-web-dev-sdk + OpenRouter |
| **Charts** | Recharts |
| **Animation** | Framer Motion |
| **Theme** | Red & White accent, Dark/Light mode |

---

## Getting Started

```bash
# Clone the repository
git clone https://github.com/mulkymalikuldhrs/ai-media-intelligence-os.git
cd ai-media-intelligence-os

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env

# Push database schema
bun run db:push

# Seed with sample data
bun run db:seed

# Start development server
bun run dev
```

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Full dashboard (content pipeline, scheduler, memory, analytics, energy)
│   ├── layout.tsx                  # Root layout with theme provider
│   ├── globals.css                 # Red & white accent theme
│   └── api/
│       ├── content/                # Content CRUD + generation + scoring
│       ├── publish/                # Platform publishing
│       ├── scheduler/              # Job queue management
│       ├── memory/                 # Memory system
│       ├── energy/                 # Energy/fatigue tracking
│       └── analytics/              # Analytics ingestion & reporting
├── lib/
│   ├── ai-orchestrator.ts          # AI routing (cheap/mid/premium) + content pipeline
│   ├── memory-system.ts            # Memory store + retrieval + pattern detection
│   ├── content-scoring.ts          # 4-dimension scoring system
│   ├── energy-system.ts            # Fatigue tracking + saturation prevention
│   ├── scheduler.ts                # Persistent job queue with priorities
│   ├── publishers/
│   │   ├── wordpress.ts            # WordPress REST API adapter
│   │   └── index.ts                # Publisher factory (9 platforms)
│   └── db.ts                       # Prisma client
├── store/
│   └── media-store.ts              # Zustand store for dashboard state
└── docs/                           # 15 comprehensive spec documents
```

---

## Content Scoring

| Score | Action |
|-------|--------|
| **80+** | Auto-schedule for publishing |
| **60-79** | Route to human review |
| **Below 60** | Reject or rewrite |

---

## Automation Modes

| Mode | Behavior |
|------|----------|
| **Manual** | Human approves everything |
| **Semi-Auto** | AI drafts, human approves, auto publish |
| **Full Auto** | AI handles publishing under rules |
| **Daily Autonomous** | System generates, schedules, distributes, tracks, learns every day |

---

## Build Phases

| Phase | Focus |
|-------|-------|
| **V1** | WordPress only, markdown-first, one queue, one memory system, semi-auto |
| **V2** | Repurpose engine, analytics ingestion, auto scheduling |
| **V3** | Multi-platform dashboard, AI routing, full dashboard |
| **V4** | Trend intelligence, monetization intelligence, audience learning |
| **V5** | Autonomous strategic publishing |

---

## Documentation

Full specs in `/docs/`:
- [Architecture](docs/ARCHITECTURE.md) — 7-layer system design
- [Database](docs/DATABASE.md) — 13 tables with full schema docs
- [Agents](docs/AGENTS.md) — 10 AI agents
- [Memory](docs/MEMORY.md) — Memory system philosophy
- [Content Engine](docs/CONTENT_ENGINE.md) — DNA system, humanic rules
- [Platform Strategy](docs/PLATFORM_STRATEGY.md) — WordPress hub, distribution channels
- [AI Routing](docs/AI_ROUTING.md) — Cheap/mid/premium model routing
- [Energy System](docs/ENERGY_SYSTEM.md) — Fatigue tracking
- [Build Order](docs/BUILD_ORDER.md) — V1 through V5
- [Roadmap](docs/ROADMAP.md) — Development roadmap

---

## License

MIT License — see [LICENSE](./LICENSE) for details.

---

## Author

**Mulky Malikul Dhaher**
- Email: mulkymalikuldhaher@email.com
- GitHub: [@mulkymalikuldhrs](https://github.com/mulkymalikuldhrs)

---

> **"Build autonomous media infrastructure, not another autoblog."**
