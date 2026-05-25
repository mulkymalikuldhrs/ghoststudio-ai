# Famlyzer AI

> **Autonomous AI Decision & Planning Intelligence**
> Life · Family · Team · Finance · Decision Intelligence

[![Version](https://img.shields.io/badge/version-3.0.0-emerald.svg)](https://github.com/mulkymalikuldhrs/famlyzer-ai)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Famlyzer AI is an AI-powered SaaS platform that manages **time, money, energy, relationships, and life goals** in one unified system — with AI as the operator, not just an assistant.

## What We Sell

> Access to intelligence, memory, and AI's ability to think & act.

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/mulkymalikuldhrs/famlyzer-ai.git
cd famlyzer-ai

# Install dependencies
bun install

# Set up the database
bun run db:push

# Start development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Features

### 🧠 7 AI Agents

| Agent | Function |
|-------|----------|
| **Planner Agent** | Schedule optimization & task assignment |
| **Finance Agent** | Budget monitoring & overspend veto |
| **Mediator Agent** | Conflict detection & resolution |
| **Health Agent** | Energy/stress monitoring & burnout prevention |
| **Education Agent** | Skill gap analysis & learning recommendations |
| **Memory Agent** | Consistency checking & pattern recognition |
| **Executive Agent** | Final decision orchestration |

### ⚡ 4-Level Autonomous System

```
0. Observe       → AI only monitors and records
1. Suggest       → AI provides recommendations
2. Act (Confirm) → AI acts with your confirmation
3. Full Auto     → AI acts autonomously within safety bounds
```

### 🧬 4-Layer Memory System

1. **Short-term** — Recent context (24h TTL, 100 entries)
2. **Long-term** — Behavioral patterns (90d TTL, 1,000 entries)
3. **Decisions** — Choice history (permanent, 500 entries)
4. **Emotional** — Stress/energy trends (optional, 200 entries)

### 📦 Knowledge Vault

Single source of truth for AI reasoning. Priority: **Vault > Memory > Assumption**

- Rules & policies
- Contracts & documents
- Financial records
- Health data
- Audio transcripts

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 + shadcn/ui |
| **Database** | Prisma ORM (SQLite) |
| **State** | Zustand + React Query |
| **AI** | z-ai-web-dev-sdk |
| **Charts** | Recharts |
| **Animations** | Framer Motion |

---

## Project Structure

```
famlyzer-ai/
├── prisma/
│   └── schema.prisma          # Database schema (12 models)
├── src/
│   ├── app/
│   │   ├── api/               # 26 REST API endpoints
│   │   │   ├── ai/            # AI agent endpoints
│   │   │   ├── auth/          # Authentication
│   │   │   ├── workspaces/    # Workspace + sub-resources
│   │   │   └── subscriptions/ # Subscription management
│   │   ├── layout.tsx         # Root layout with metadata
│   │   ├── page.tsx           # Main SPA entry
│   │   └── globals.css        # Tailwind + theme variables
│   ├── components/
│   │   ├── ui/                # shadcn/ui component library
│   │   ├── dashboard.tsx      # Decision intelligence dashboard
│   │   ├── planner.tsx        # Task management with AI
│   │   ├── finance.tsx        # Budget tracker with auto-veto
│   │   ├── vault.tsx          # Knowledge vault management
│   │   ├── ai-assistant.tsx   # Multi-agent chat interface
│   │   ├── settings.tsx       # Configuration & preferences
│   │   ├── onboarding.tsx     # Setup wizard
│   │   └── app-layout.tsx     # Sidebar + content layout
│   ├── lib/
│   │   ├── ai.ts              # AI SDK (z-ai-web-dev-sdk)
│   │   ├── db.ts              # Prisma client singleton
│   │   ├── hooks.ts           # React Query hooks (all APIs)
│   │   ├── store.ts           # Zustand global state
│   │   └── utils.ts           # Utility functions
│   └── hooks/
│       ├── use-mobile.ts      # Mobile detection
│       └── use-toast.ts       # Toast notifications
├── ARCHITECTURE.md            # System architecture documentation
├── CHANGELOG.md               # Version history
├── DESIGN.md                  # UI/UX design system
├── BLUEPRINT.md               # Product blueprint (vision)
└── README.md                  # This file
```

---

## API Overview

| Category | Endpoints |
|----------|-----------|
| **Auth** | `POST /api/auth/setup`, `GET /api/user` |
| **Workspaces** | `POST / GET / PATCH /api/workspaces` |
| **Members** | `POST / GET / PATCH /api/workspaces/[id]/members` |
| **Tasks** | `POST / GET / PATCH / DELETE /api/workspaces/[id]/tasks` |
| **Finance** | Accounts, Transactions, Budget Rules, Financial Goals |
| **Vault** | `POST / GET / PATCH / DELETE /api/workspaces/[id]/vault` |
| **Memory** | `POST / GET / DELETE /api/workspaces/[id]/memories` |
| **AI** | Chat, Analyze, Suggest, Optimize Schedule, Audit Finances, Agent Run |
| **Suggestions** | `GET / PATCH /api/workspaces/[id]/suggestions` |
| **Subscriptions** | `GET / POST /api/subscriptions` |

---

## Business Model

### 🆓 7-Day Free Trial
- All features and AI agents active
- Full autonomous level
- Unlimited data

### 💳 Subscription Tiers

| Tier | Price | Workspaces | Users | Autonomous Level |
|------|-------|-----------|-------|-----------------|
| **Starter** | Free | 1 | 3 | Advisory only |
| **Professional** | $19/mo | 5 | 15 | Semi-autonomous |
| **Business** | $49/mo | Unlimited | Unlimited | Fully autonomous |

**No free forever. The value of AI must be paid for.**

---

## Core Principles

- **AI is not a gimmick** — It genuinely reduces chaos and increases clarity
- **Data belongs to the user** — Never sold, never used for training
- **Vault > Memory > Assumption** — AI must cite its sources
- **Financial safety above comfort** — Emergency fund is sacred
- **Simulate before deciding** — Always test before acting

---

## Documentation

| Document | Description |
|----------|-------------|
| [BLUEPRINT.md](BLUEPRINT.md) | Product vision and feature specification |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture and data flow |
| [DESIGN.md](DESIGN.md) | UI/UX design system and component specs |
| [CHANGELOG.md](CHANGELOG.md) | Version history and release notes |

---

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server (port 3000) |
| `bun run lint` | Run ESLint checks |
| `bun run db:push` | Sync Prisma schema to database |
| `bun run db:generate` | Generate Prisma client |
| `bun run build` | Production build |

---

## License

MIT

---

*Version 3.0.0 — Built with Next.js 16, TypeScript, and AI-first architecture*
