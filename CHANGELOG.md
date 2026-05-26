# Changelog

All notable changes to Famlyzer AI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [3.0.0] - 2026-05-25

### Added
- **Complete platform migration** from Vite/React to Next.js 16 with App Router
- **Prisma ORM** with SQLite database schema (12 models: User, Workspace, WorkspaceMember, Task, FinanceAccount, Transaction, BudgetRule, FinancialGoal, VaultDocument, Memory, Suggestion, AgentLog, Subscription)
- **26 REST API endpoints** covering all CRUD operations
- **AI integration** via z-ai-web-dev-sdk (replacing direct Gemini API calls)
- **Dashboard** with cashflow timeline charts, emergency fund meter, stress & energy index bars, 7-agent status grid, autonomous status indicator, AI decision log, and predictions panel
- **Planner** with task pipeline (Pending/Approved/Done), resource cost visualization (time/energy/money), AI schedule optimization, calendar week view, and AI rejection notices
- **Finance** with multi-account support, transaction tracking with category filtering, budget rules with auto-veto warnings, financial goals with progress tracking, and AI financial audit
- **Knowledge Vault** with document management (notes, rules, contracts, PDFs, images, audio), search/filter by type and scope, metadata system with priority/visibility/tags, and AI intelligence indicator
- **AI Assistant** chat interface with 8 agent selection, quick action buttons (Analyze, Suggest, Optimize, Audit), memory layer indicator, and contextual workspace awareness
- **Settings** with workspace configuration, 4-level autonomous system selector, member management with energy/stress tracking, subscription tier display, and 4-layer memory management dashboard
- **Onboarding wizard** with 4-step setup (Welcome, Account, Workspace, Tutorial)
- **Zustand** state management with localStorage persistence
- **React Query** for server state with automatic cache invalidation
- **Responsive design** with collapsible sidebar for mobile
- **shadcn/ui** component library with emerald/teal color theme
- **Framer Motion** animations for page transitions and card entries
- **Sonner** toast notifications for user feedback

### Changed
- Migrated from Vite build system to Next.js 16
- Migrated from direct Google Gemini API to z-ai-web-dev-sdk
- Migrated from in-memory state to persistent SQLite database via Prisma
- Migrated from client-side AI calls to server-side API routes
- Migrated from CSS modules to Tailwind CSS 4 + shadcn/ui
- Replaced JS Puter orchestration with z-ai-web-dev-sdk agent system

### Removed
- Vite build configuration
- Direct Gemini API client (`@google/genai`)
- Client-side Google Drive integration
- Client-side IndexedDB storage
- Firebase integration stub
- Service worker (sw.js)

---

## [2.0.0] - 2026-02-01

### Added
- Full autonomous AI system with Gemini integration
- 7 AI agents: Planner, Finance, Mediator, Health, Education, Memory, Executive
- Agent Coordinator for orchestration
- Autonomous Core with trigger system
- Memory System with 4 layers (short-term, long-term, decision, emotional)
- Suggestion Engine with 4 types (preventive, corrective, strategic, behavioral)
- Vault Intelligence for document-aware AI reasoning
- Subscription Service with trial logic
- Drive Service for Google Drive data persistence
- Event System for agent communication
- Dashboard with autonomous status display
- Planner with AI optimization
- Finance with auto-veto system
- Vault with document management
- AI Assistant chat interface
- Onboarding flow

### Changed
- Replaced JS Puter orchestration with Gemini AI agents
- All 7 agents now Gemini-powered instead of rule-based
- Improved autonomous flow with trigger detection

---

## [1.0.0] - 2026-01-15

### Added
- Initial Famlyzer AI concept and blueprint
- Core product definition and business model
- Workspace & role system (Personal, Family, Company)
- Member schema with authority levels
- Task system with resource allocation (time, energy, money)
- Budget tracker with financial entities
- Knowledge Vault concept
- System prompt for AI behavior
- MVP roadmap (30 days)

---

[3.0.0]: https://github.com/mulkymalikuldhrs/famlyzer-ai/releases/tag/v3.0.0
[2.0.0]: https://github.com/mulkymalikuldhrs/famlyzer-ai/releases/tag/v2.0.0
[1.0.0]: https://github.com/mulkymalikuldhrs/famlyzer-ai/releases/tag/v1.0.0
