# Architecture

> Famlyzer AI — System Architecture Documentation

## Overview

Famlyzer AI is a full-stack SaaS application built on **Next.js 16** with App Router, featuring an AI-driven autonomous decision and planning system. The architecture follows a **server-first** approach where all AI operations, data mutations, and business logic run on the backend through API routes.

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     Client (Browser)                     │
│  ┌───────────┐ ┌───────────┐ ┌──────────┐ ┌──────────┐ │
│  │ Dashboard  │ │  Planner  │ │ Finance  │ │  Vault   │ │
│  └─────┬─────┘ └─────┬─────┘ └────┬─────┘ └────┬─────┘ │
│  ┌─────┴─────┐ ┌─────┴─────┐                             │
│  │AI Assist  │ │ Settings  │                             │
│  └─────┬─────┘ └─────┬─────┘                             │
│        │             │                                    │
│  ┌─────┴─────────────┴──────┐                            │
│  │   Zustand Store          │                            │
│  │   + React Query Cache    │                            │
│  └───────────┬──────────────┘                            │
└──────────────┼───────────────────────────────────────────┘
               │ HTTP (REST API)
┌──────────────┼───────────────────────────────────────────┐
│              ▼          Next.js 16 Server                 │
│  ┌───────────────────────────────────────────────────┐   │
│  │                 API Routes (/api/)                 │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │   │
│  │  │   Auth   │ │Workspace │ │   AI Endpoints   │  │   │
│  │  │  /setup  │ │  CRUD    │ │ chat|analyze|    │  │   │
│  │  │  /user   │ │          │ │ suggest|audit    │  │   │
│  │  └──────────┘ └──────────┘ │ agent-run|optim  │  │   │
│  │  ┌──────────┐ ┌──────────┐ └──────────────────┘  │   │
│  │  │  Tasks   │ │ Finance  │                         │   │
│  │  │  CRUD    │ │  CRUD    │ ┌──────────────────┐   │   │
│  │  └──────────┘ └──────────┘ │ z-ai-web-dev-sdk │   │   │
│  │  ┌──────────┐ ┌──────────┐ │   (AI Provider)  │   │   │
│  │  │  Vault   │ │ Memory   │ └──────────────────┘   │   │
│  │  │  CRUD    │ │  CRUD    │                         │   │
│  │  └──────────┘ └──────────┘                         │   │
│  └────────────────────────┬───────────────────────────┘   │
│                           │                                │
│  ┌────────────────────────┴───────────────────────────┐   │
│  │              Prisma ORM (SQLite)                    │   │
│  │  User │ Workspace │ Member │ Task │ Transaction    │   │
│  │  Account │ BudgetRule │ Goal │ Vault │ Memory      │   │
│  │  Suggestion │ AgentLog │ Subscription              │   │
│  └────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 16 (App Router) | Full-stack React framework with SSR/SSG |
| **Language** | TypeScript 5 | Type safety across client and server |
| **Styling** | Tailwind CSS 4 + shadcn/ui | Utility-first CSS with pre-built components |
| **Database** | Prisma ORM + SQLite | Type-safe database access, schema migrations |
| **State (Client)** | Zustand | Lightweight global state with localStorage persistence |
| **State (Server)** | React Query (TanStack) | Server state caching, background refetch, mutations |
| **AI** | z-ai-web-dev-sdk | Server-side AI completions for all agent operations |
| **Charts** | Recharts | AreaChart, BarChart, PieChart for dashboards |
| **Animations** | Framer Motion | Page transitions, card animations, micro-interactions |
| **Validation** | Zod | Runtime type validation |
| **Notifications** | Sonner | Toast notifications for user feedback |

---

## Database Schema

```
User ──┬──< WorkspaceMember >── Workspace ──┬──< Task
       │                                    ├──< FinanceAccount ──< Transaction
       │                                    ├──< BudgetRule
       │                                    ├──< FinancialGoal
       │                                    ├──< VaultDocument
       │                                    ├──< Memory
       │                                    ├──< Suggestion
       │                                    └──< AgentLog
       └──< Subscription
```

### Key Relationships
- **User** has many **Workspaces** through **WorkspaceMember**
- **Workspace** is the central entity — all data belongs to a workspace
- **WorkspaceMember** stores per-user settings (energy, stress, alias, authority)
- **Task** includes resource costs (time, energy, money) and AI rejection tracking
- **FinanceAccount** tracks balances with emergency fund designation
- **Transaction** auto-updates account balance on creation
- **VaultDocument** stores AI-consumable knowledge with metadata
- **Memory** implements 4-layer architecture with optional expiration
- **Suggestion** tracks AI recommendations with acceptance status
- **AgentLog** records all autonomous actions for audit trail

---

## API Architecture

### REST Endpoints

All API routes follow RESTful conventions under `/api/`:

| Category | Endpoints | Description |
|----------|-----------|-------------|
| **Auth** | `POST /setup`, `GET /user` | Demo auth with email |
| **Workspaces** | `POST / GET / PATCH` | Workspace CRUD |
| **Members** | `POST / GET / PATCH` | Member management |
| **Tasks** | `POST / GET / PATCH / DELETE` | Task lifecycle |
| **Finance** | Accounts, Transactions, Budget Rules, Goals | Financial tracking |
| **Vault** | `POST / GET / PATCH / DELETE` | Document management |
| **Memory** | `POST / GET / DELETE` | 4-layer memory system |
| **AI** | `chat / analyze / suggest / optimize / audit / agent-run` | AI agent operations |
| **Suggestions** | `GET / PATCH` | Suggestion tracking |
| **Subscriptions** | `GET / POST` | Subscription management |

### AI Endpoints Detail

| Endpoint | Method | Agent | Purpose |
|----------|--------|-------|---------|
| `/api/ai/chat` | POST | General | Conversational AI with workspace context |
| `/api/ai/analyze` | POST | All | Full autonomous analysis cycle |
| `/api/ai/suggest` | POST | All | Generate typed suggestions |
| `/api/ai/optimize-schedule` | POST | Planner | Task schedule optimization |
| `/api/ai/audit-finances` | POST | Finance | Financial health audit |
| `/api/ai/agent-run` | POST | Any | Run specific agent with input |

---

## AI Agent System

### Agent Architecture

```
                    ┌─────────────┐
                    │  Executive  │  ← Final decision authority
                    │   Agent     │
                    └──────┬──────┘
                           │ orchestrates
          ┌────────────────┼────────────────┐
          │                │                │
   ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐
   │   Planner   │  │   Finance   │  │  Mediator   │
   │   Agent     │  │   Agent     │  │   Agent     │
   └─────────────┘  └─────────────┘  └─────────────┘
          │                │                │
   ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐
   │   Health    │  │  Education  │  │   Memory    │
   │   Agent     │  │   Agent     │  │   Agent     │
   └─────────────┘  └─────────────┘  └─────────────┘
```

### Agent Roles

| Agent | Responsibility | Autonomous Action |
|-------|---------------|-------------------|
| **Planner** | Schedule optimization, task assignment | Reschedule tasks, reject infeasible tasks |
| **Finance** | Budget monitoring, cashflow analysis | Veto overspending, flag risky transactions |
| **Mediator** | Conflict detection, resource disputes | Suggest resolutions, reallocate resources |
| **Health** | Energy/stress monitoring, burnout prediction | Warn about overload, suggest rest periods |
| **Education** | Skill gap analysis, learning recommendations | Recommend development paths |
| **Memory** | Consistency checking, pattern recognition | Flag inconsistencies, compress old memories |
| **Executive** | Final decision, agent orchestration | Execute autonomous decisions within permission |

### Autonomous Levels

| Level | Name | Behavior |
|-------|------|----------|
| 0 | Observe | AI only monitors and records |
| 1 | Suggest | AI provides recommendations, waits for approval |
| 2 | Act (Confirm) | AI takes action but requires confirmation |
| 3 | Full Auto | AI acts autonomously within safety boundaries |

---

## Memory System

```
┌────────────────────────────────────────────────┐
│                Memory Hierarchy                 │
│                                                │
│  ┌──────────────┐  Capacity: 100 entries       │
│  │  Short-term  │  TTL: 24 hours               │
│  │  Context     │  Purpose: Recent interactions │
│  └──────┬───────┘                              │
│         │ promotes to                          │
│  ┌──────┴───────┐  Capacity: 1000 entries      │
│  │  Long-term   │  TTL: 90 days                │
│  │  Habits      │  Purpose: Behavioral patterns │
│  └──────┬───────┘                              │
│         │                                      │
│  ┌──────┴───────┐  Capacity: 500 entries       │
│  │  Decision    │  No TTL                       │
│  │  History     │  Purpose: Past choices        │
│  └──────┬───────┘                              │
│         │                                      │
│  ┌──────┴───────┐  Capacity: 200 entries       │
│  │  Emotional   │  No TTL (optional)           │
│  │  Patterns    │  Purpose: Stress/energy trends│
│  └──────────────┘                              │
└────────────────────────────────────────────────┘
```

---

## Data Flow

### Autonomous Analysis Flow

```
1. User triggers "Run Autonomous Analysis"
          │
2. Server loads workspace data (tasks, finance, members, vault, memories)
          │
3. AI receives system prompt + workspace context
          │
4. AI analyzes across all dimensions:
   ├── Planner: Resource optimization, schedule conflicts
   ├── Finance: Budget compliance, runway calculation
   ├── Mediator: Human conflicts, resource disputes
   ├── Health: Burnout risk, energy balance
   ├── Education: Skill gaps, development needs
   ├── Memory: Consistency check, pattern anomalies
   └── Executive: Final decision synthesis
          │
5. Results stored to database:
   ├── AgentLog entries for audit trail
   ├── Memory entries for future context
   └── Suggestion entries for user review
          │
6. Client receives results and updates UI
```

### Task Creation with AI Review

```
1. User creates task with resource costs (time, energy, money)
          │
2. Server validates against workspace constraints:
   ├── Is there enough time in the schedule?
   ├── Does the assigned member have sufficient energy?
   └── Is there budget available for the money cost?
          │
3. If autonomous level ≥ 2:
   └── AI reviews and may reject with reasoning
          │
4. Task stored with status (Pending/Approved/Rejected)
          │
5. If AI optimization is triggered:
   └── Tasks reassigned based on member energy/priority
```

---

## Security Model

- **Server-side AI**: All AI calls run server-side; API keys never exposed to client
- **Data ownership**: All data belongs to users; never sold or used for training
- **Workspace isolation**: Data is scoped to workspaces with member visibility controls
- **Hierarchical authority**: Members have authority levels (1-5); AI respects hierarchy
- **AI permission boundaries**: Autonomous level controls what actions AI can take
- **Financial safety**: Emergency fund is sacred; AI veto on overspending
- **Vault priority**: AI always cites Vault > Memory > Assumption

---

## Deployment Architecture

```
Production:
  - Next.js standalone build
  - SQLite database file
  - Environment variables for AI API keys

Development:
  - bun run dev (Next.js dev server on port 3000)
  - bun run db:push (sync Prisma schema)
  - bun run lint (ESLint checks)
```
