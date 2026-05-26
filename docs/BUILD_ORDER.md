# Build Order

**AI Media Intelligence OS — V1 Through V5 Build Phases**

---

## Overview

The AI Media Intelligence OS is built in five phases, each building on the previous one. This phased approach ensures that foundational systems are solid before adding complexity, that each phase delivers usable value, and that the system can be validated incrementally rather than in a single big-bang release.

The build order follows a strict dependency chain: you cannot build the content pipeline without the database schema. You cannot build the scoring system without the pipeline. You cannot build autonomous publishing without scoring. Each phase is a complete, deployable increment.

---

## V1: Foundation + Core Pipeline (Current)

**Goal**: A working content pipeline that generates, scores, and publishes to WordPress.

### V1.1: Database & Auth

**Status**: Complete

- Prisma schema with all 13 models
- SQLite database with migrations
- User authentication via NextAuth
- Workspace creation and management
- User roles (operator, admin, viewer)
- Automation mode support (manual, semi_auto, full_auto)

**Deliverables**:
- `prisma/schema.prisma`
- `src/lib/db.ts`
- `src/lib/auth.ts`
- Auth API routes

### V1.2: AI Orchestration

**Status**: Complete

- z-ai-web-dev-sdk integration
- 3-tier model routing (cheap, mid, premium)
- Content pipeline: draft → humanic rewrite → SEO → repurpose → score
- Task-based model selection
- AI call logging

**Deliverables**:
- `src/lib/ai-orchestrator.ts`
- `src/lib/ai.ts`
- All agent functions

### V1.3: Memory System

**Status**: Complete

- Memory storage with upsert semantics
- 10 memory categories
- Reinforcement learning score updates
- Pattern detection
- Memory decay
- Platform behavior intelligence

**Deliverables**:
- `src/lib/memory-system.ts`
- Memory API routes

### V1.4: Content Scoring

**Status**: Complete

- 4-dimension scoring (writing, humanic, SEO, trust)
- Composite score calculation
- Action thresholds (auto_schedule, human_review, reject_rewrite)
- Full scoring pipeline (parallel)
- Quick scoring (single pass)
- Score persistence

**Deliverables**:
- `src/lib/content-scoring.ts`
- Scoring API routes

### V1.5: Energy System

**Status**: Complete

- 5 fatigue categories (topic, tone, saturation, audience, hook)
- Fatigue thresholds (fresh, moderate, tired, exhausted)
- Natural decay
- Pre-publish energy checks
- Energy reports with recommendations

**Deliverables**:
- `src/lib/energy-system.ts`
- Energy API routes

### V1.6: Scheduler

**Status**: Complete

- Persistent job queue with priority
- 9 job types
- Job locking and stale lock cleanup
- Exponential backoff retry
- Dead letter queue
- Daily autonomous cycle

**Deliverables**:
- `src/lib/scheduler.ts`
- Scheduler API routes

### V1.7: WordPress Publishing

**Status**: Complete

- Full REST API v2 integration
- Application Passwords authentication
- Create, publish, schedule, update, delete
- Category and tag management
- Retry logic with exponential backoff
- Connection testing

**Deliverables**:
- `src/lib/publishers/wordpress.ts`
- `src/lib/publishers/index.ts`
- Publish API routes

### V1.8: Dashboard UI

**Status**: Complete

- 6-tab dashboard (Content, Scheduler, Memory, Analytics, Energy, Settings)
- Content pipeline view with creation and filtering
- Scheduler queue management
- Memory browser with search
- Analytics charts (Recharts)
- Energy monitoring with color-coded indicators
- Automation mode selector
- Responsive design

**Deliverables**:
- `src/app/page.tsx`
- `src/components/dashboard/`
- `src/store/` (Zustand stores)

### V1.9: Landing Page & Auth UI

**Status**: Complete

- Public landing page with hero, features, pricing, testimonials
- Sign up and sign in pages
- Dashboard layout with sidebar and header

**Deliverables**:
- `src/components/landing/`
- `src/app/auth/`
- `src/app/dashboard/`

---

## V2: Multi-Platform + Analytics Integration

**Goal**: Expand beyond WordPress to 5+ platforms with real analytics feedback.

### V2.1: Medium Publisher
- Medium API integration
- Medium-specific content adaptation
- Medium authentication

### V2.2: Substack Publisher
- Substack API integration
- Newsletter format optimization
- Subscriber analytics

### V2.3: Beehiiv Publisher
- Beehiiv API integration
- Newsletter digest format
- CTA optimization

### V2.4: DevTo Publisher
- DevTo API integration
- Technical article formatting
- Developer community optimization

### V2.5: Hashnode Publisher
- Hashnode API integration
- Developer blog format
- Cross-posting with canonical URLs

### V2.6: Google Analytics Integration
- GA4 API connection
- Real-time analytics data collection
- Automated AnalyticsEvent creation
- Analytics dashboard enhancements

### V2.7: Content Calendar UI
- Visual calendar for scheduling
- Drag-and-drop rescheduling
- Multi-platform scheduling view
- Publishing time optimization suggestions

---

## V3: Intelligence Layer

**Goal**: Make the system genuinely intelligent — not just automated, but strategic.

### V3.1: Trend Detection Agent
- Monitor trending topics via web APIs
- Suggest content ideas based on trends
- Correlate trends with high-performing memory patterns
- Trend fatigue tracking

### V3.2: Content Idea Generator
- AI-powered idea generation based on memory + trends + DNA
- Idea scoring and prioritization
- Idea-to-pipeline one-click launch
- Idea clustering and series identification

### V3.3: A/B Testing Framework
- Variant testing for headlines, hooks, and CTAs
- Statistical significance tracking
- Automated winner selection
- Memory updates from test results

### V3.4: Competitive Intelligence
- Monitor competitor content (opt-in, public sources only)
- Gap analysis (topics they cover that you don't)
- Performance benchmarking
- Differentiation recommendations

### V3.5: Audience Segmentation
- Segment audiences based on engagement patterns
- Platform-specific audience profiles
- Content targeting by segment
- Cross-platform audience overlap analysis

### V3.6: Revenue Optimization
- Affiliate link placement optimization
- Monetization memory category integration
- Revenue attribution per content item
- ROI tracking per article

---

## V4: Collaboration & Scale

**Goal**: Support teams, agencies, and enterprise operations.

### V4.1: Team Collaboration
- Multi-user workspaces with role-based access
- Content assignment and review workflow
- Comment and feedback system
- Approval chains for publishing

### V4.2: Agency Mode
- Multi-client workspace management
- Client-specific DNA profiles
- White-label dashboard (custom branding)
- Client reporting and analytics

### V4.3: PostgreSQL Migration
- Migration from SQLite to PostgreSQL
- Connection pooling
- Read replicas for analytics queries
- Database-level encryption

### V4.4: Public API
- RESTful API for third-party integrations
- API key management
- Rate limiting
- Webhook support for content events

### V4.5: Plugin System
- Custom agent creation API
- Custom publisher adapters
- Custom scoring dimensions
- Event hooks for external systems

### V4.6: Advanced Scheduling
- Timezone-aware scheduling
- Optimal timing suggestions per platform
- Batch scheduling
- Recurring content series

---

## V5: Autonomous Media Company

**Goal**: The system operates as an autonomous media company — strategy, production, distribution, and monetization with minimal human oversight.

### V5.1: Strategic Planning Agent
- Quarterly content strategy generation
- Goal setting and progress tracking
- Resource allocation recommendations
- Market opportunity identification

### V5.2: Self-Optimizing Pipeline
- Automatic model selection based on task complexity
- Quality-adaptive routing (use premium only when needed)
- Cost optimization with quality constraints
- Pipeline step parallelization

### V5.3: Revenue Operations
- Automated affiliate program management
- Dynamic pricing for premium content
- Subscription optimization
- Ad placement optimization

### V5.4: Brand Voice Evolution
- DNA profile that evolves based on performance
- Voice consistency monitoring across all content
- Brand deviation alerts
- Voice calibration recommendations

### V5.5: Multi-Language Support
- Content translation and localization
- Market-specific DNA profiles
- Regional timing optimization
- Cross-language content repurposing

### V5.6: Autonomous Operation Dashboard
- "Set and forget" mode with strategic oversight only
- Exception-based alerting (only notify when action needed)
- Weekly strategic brief generated by AI
- Monthly performance review with recommendations

---

## Build Principles

### 1. Ship V1 Before Starting V2
Every phase must be complete, tested, and deployed before the next phase begins. This prevents the "forever in development" trap.

### 2. Each Phase Delivers Standalone Value
V1 is useful on its own — you can generate, score, and publish content. V2 adds platforms. V3 adds intelligence. Each phase is a product, not a stepping stone.

### 3. Validate with Real Usage
Before expanding, validate that the current phase works in production. Real usage reveals problems that no amount of planning can predict.

### 4. Preserve the Architecture
The 7-layer architecture must be maintained across all phases. If a new feature doesn't fit the architecture, either the feature design or the architecture needs adjustment — not a shortcut.

### 5. Never Compromise Quality Gates
The scoring system and energy system are non-negotiable. Adding more platforms or features must never bypass the quality gates. Every piece of content, regardless of how it was created, must pass through scoring and energy checks.

### 6. Cost Awareness at Every Phase
Each phase should include a cost analysis of new AI operations. The cost per article should remain under $0.15 even as features are added.

---

## Phase Duration Estimates

| Phase | Estimated Duration | Key Risk |
|-------|-------------------|----------|
| V1 | 4-6 weeks (complete) | Dashboard complexity |
| V2 | 6-8 weeks | Platform API reliability |
| V3 | 8-12 weeks | AI quality of strategic features |
| V4 | 10-14 weeks | Team collaboration complexity |
| V5 | 12-16 weeks | Autonomous operation safety |
