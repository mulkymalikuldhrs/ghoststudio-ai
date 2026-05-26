# AI Media Intelligence OS

**Autonomous Media Operating System**

> Authority Compounding, not spam publishing.

---

## What Is This?

AI Media Intelligence OS is an autonomous content operating system that thinks, writes, scores, and publishes — while you sleep. It is not another AI writing tool. It is not a content spinner. It is a system that compounds authority over time by treating every piece of content as a strategic asset in a living ecosystem.

The core philosophy is simple: **Authority Compounding**. Each article you publish should make the next one more valuable. Each data point you collect should make your next decision smarter. Each memory your system stores should make your content more resonant. This is the opposite of the "publish 10 articles a day" spam approach — it is the system for people who want every word to count.

---

## The True Loop

```
┌─────────────────────────────────────────────────────────────────┐
│                     THE TRUE LOOP                                │
│                                                                  │
│   ┌──────────┐    ┌──────────────┐    ┌───────────────┐        │
│   │  MEMORY   │───>│  CONTENT     │───>│  SCORING      │        │
│   │  What     │    │  DNA Engine  │    │  Quality Gate  │        │
│   │  worked   │    │  Master +    │    │  4 dimensions  │        │
│   │  before   │    │  Variants    │    │  Auto/Review/  │        │
│   └──── ▲     │    └──────────────┘    │  Reject        │        │
│        │     │                         └───────┬───────┘        │
│        │     │                                 │                 │
│   ┌────┴─────┐                         ┌───────▼───────┐        │
│   │ ANALYTICS │◄────────────────────────│  PUBLISH      │        │
│   │ Feedback  │                         │  WordPress    │        │
│   │ Loop      │                         │  Hub First    │        │
│   └──────────┘                         └───────────────┘        │
│                                                                  │
│   Energy System prevents exhaustion at every gate                 │
└─────────────────────────────────────────────────────────────────┘
```

The True Loop is the heartbeat of the system. Memory informs content creation. Content is scored before it goes anywhere. Publishing feeds analytics back into memory. The Energy System acts as a governor, preventing fatigue and saturation from eroding your authority. Nothing happens in isolation — every action feeds the next.

---

## V1 Features

### Content DNA Engine
- **Canonical Schema**: One master article, multiple derived variants per platform
- **Content Pipeline**: Idea → Draft → Humanic Edit → SEO → Repurpose → Score → Publish
- **Anti-Robotic Rewrite**: Breaks AI patterns to make content sound genuinely human
- **Platform Variants**: Automatic adaptation for WordPress, Medium, Substack, Beehiiv, DevTo, Hashnode, Ghost, Mirror, and Blogger

### AI Orchestration
- **3-Tier Model Routing**: Cheap (tagging/formatting), Mid (SEO/repurpose), Premium (master writing/editorial)
- **Task-Based Routing**: Each task type automatically selects the right model tier
- **z-ai-web-dev-sdk Integration**: Unified AI interface across providers

### Memory System
- **"Memory is the moat, not the model"**: Stores what worked, what failed, preferences, patterns
- **10 Memory Categories**: hook, topic, tone, timing, cta, format, platform, monetization, audience, style
- **Reinforcement Learning**: Scores update based on real analytics outcomes
- **Pattern Detection**: Automatically discovers high-performing and low-performing clusters

### Content Scoring
- **4-Dimension Scoring**: Writing Quality, Humanic Score, SEO Score, Trust Score
- **Composite Score**: Weighted calculation with automatic action routing
- **Action Thresholds**: Auto-schedule (≥80), Human Review (≥60), Reject & Rewrite (<60)

### Energy System
- **Fatigue Tracking**: Topic fatigue, tone fatigue, publish saturation, audience exhaustion, hook repetition
- **Natural Decay**: Fatigue decreases over time — rest is built into the system
- **Pre-Publish Gates**: Content cannot be published if energy is too low
- **Recommendations**: System tells you when to pause, pivot, or push forward

### Scheduler
- **Persistent Job Queue**: Priority-based queue with locking for concurrent safety
- **9 Job Types**: draft, rewrite, seo, publish, analytics, memory_update, repurpose, scoring, retry
- **Daily Autonomous Cycle**: Process jobs, schedule ready content, clean stale locks, retry failures
- **Dead Letter Queue**: Failed jobs are tracked and can be inspected or retried

### Publishing
- **WordPress as Hub**: Full REST API v2 integration with Application Passwords
- **Create, Publish, Schedule, Update, Delete**: Complete post lifecycle
- **Category & Tag Management**: Find or create tags, attach to posts
- **Retry Logic**: Exponential backoff with jitter for resilient publishing

### Dashboard
- **6-Tab Interface**: Content Pipeline, Scheduler, Memory, Analytics, Energy, Settings
- **Real-Time Status**: Queue depth, energy levels, content scores, automation mode
- **Data Visualization**: Charts for publish trends, platform distribution, content performance
- **Automation Modes**: Manual, Semi-Auto, Full-Auto

---

## Quick Start

### Prerequisites
- Node.js 18+
- Bun (package manager)
- A running SQLite database (configured via `DATABASE_URL`)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd my-project

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npx prisma migrate dev

# Start the development server
bun dev
```

### Environment Variables

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

### First Steps

1. **Create a workspace** — This is your content hub
2. **Connect WordPress** — Add your WordPress site credentials under Settings
3. **Set automation mode** — Start with Manual, graduate to Semi-Auto, then Full-Auto
4. **Create your first content idea** — Enter a topic, angle, and let the pipeline run
5. **Watch the scores** — Content scoring will tell you whether to auto-schedule or review

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 16 (App Router) | Full-stack React framework |
| **Language** | TypeScript | Type-safe development |
| **Database** | SQLite via Prisma | Persistent storage, migrations, type-safe queries |
| **AI SDK** | z-ai-web-dev-sdk | Unified AI model access |
| **Auth** | NextAuth.js | Authentication and session management |
| **Payments** | Stripe | Subscription billing |
| **State** | Zustand | Client-side state management |
| **UI** | shadcn/ui + Tailwind CSS 4 | Component library and styling |
| **Charts** | Recharts | Data visualization |
| **Animation** | Framer Motion | Smooth transitions |
| **Publishing** | WordPress REST API v2 | Content distribution |
| **Container** | Docker + Docker Compose | Deployment |

---

## Project Structure

```
my-project/
├── docs/                    # Blueprint documentation (this folder)
├── prisma/
│   ├── schema.prisma        # Canonical database schema
│   └── seed.ts              # Database seeder
├── src/
│   ├── app/                 # Next.js App Router pages and API routes
│   │   ├── api/             # Backend API routes
│   │   │   ├── content/     # Content CRUD + scoring + generation
│   │   │   ├── energy/      # Energy system endpoints
│   │   │   ├── memory/      # Memory system endpoints
│   │   │   ├── projects/    # Project management
│   │   │   ├── publish/     # Publishing endpoints
│   │   │   ├── scheduler/   # Scheduler endpoints
│   │   │   ├── stripe/      # Payment webhooks
│   │   │   ├── templates/   # Content templates
│   │   │   └── auth/        # Authentication
│   │   ├── dashboard/       # Dashboard pages
│   │   └── page.tsx         # Main dashboard UI
│   ├── components/          # React components
│   │   ├── dashboard/       # Dashboard-specific components
│   │   ├── landing/         # Public landing page
│   │   ├── providers/       # Context providers
│   │   └── ui/              # shadcn/ui primitives
│   ├── lib/                 # Core business logic
│   │   ├── ai-orchestrator.ts  # AI routing and content pipeline
│   │   ├── content-scoring.ts  # 4-dimension quality scoring
│   │   ├── energy-system.ts    # Fatigue tracking and gates
│   │   ├── memory-system.ts    # Memory storage and retrieval
│   │   ├── scheduler.ts        # Job queue and daily cycle
│   │   ├── publishers/         # Platform publishing adapters
│   │   │   ├── wordpress.ts    # WordPress REST API
│   │   │   └── index.ts       # Publisher factory
│   │   ├── auth.ts             # Authentication config
│   │   ├── db.ts               # Prisma client
│   │   └── stripe.ts           # Stripe integration
│   ├── store/               # Zustand state stores
│   └── types/               # TypeScript type definitions
├── docker-compose.yml       # Container orchestration
├── Dockerfile               # Production container
└── package.json             # Dependencies and scripts
```

---

## Documentation Index

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Full system architecture with the 7 layers |
| [PRD.md](./PRD.md) | Product Requirements Document |
| [DATABASE.md](./DATABASE.md) | Database schema documentation |
| [AGENTS.md](./AGENTS.md) | Agent system documentation |
| [CONTENT_ENGINE.md](./CONTENT_ENGINE.md) | Content DNA system and humanic rules |
| [MEMORY.md](./MEMORY.md) | Memory system philosophy and implementation |
| [SCHEDULER.md](./SCHEDULER.md) | Scheduler system and queue rules |
| [PLATFORM_STRATEGY.md](./PLATFORM_STRATEGY.md) | WordPress as hub, distribution strategy |
| [AI_ROUTING.md](./AI_ROUTING.md) | Model routing strategy |
| [BUILD_ORDER.md](./BUILD_ORDER.md) | V1 through V5 build phases |
| [ENERGY_SYSTEM.md](./ENERGY_SYSTEM.md) | Fatigue tracking and saturation prevention |
| [CONTENT_SCORING.md](./CONTENT_SCORING.md) | Quality scoring system |
| [SECURITY.md](./SECURITY.md) | Security principles |
| [ROADMAP.md](./ROADMAP.md) | Development roadmap |

---

## License

See [LICENSE](../LICENSE) for details.
