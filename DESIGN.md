# Design System

> Famlyzer AI — UI/UX Design Documentation

## Design Philosophy

Famlyzer AI is designed as a **Decision Intelligence Tool**, not a reporting dashboard. Every visual element serves the purpose of reducing cognitive load, increasing clarity, and enabling better decisions. The design language balances information density with visual calmness, using color purposefully to signal urgency and status rather than decoration.

**Core Principles:**
- **Clarity over beauty** — Every element must earn its place
- **Signal, not noise** — Color and animation convey meaning
- **Calm confidence** — The UI should feel like a trusted advisor, not an alarm system
- **Progressive disclosure** — Show summary first, detail on demand

---

## Color System

### Primary Palette

| Color | Hex | Usage |
|-------|-----|-------|
| **Emerald 500** | `#10b981` | Primary actions, positive trends, active states |
| **Emerald 600** | `#059669` | Hover states, emphasis |
| **Teal 500** | `#14b8a6` | Secondary accent, gradient endpoint |
| **Teal 600** | `#0d9488` | Gradient hover states |

### Semantic Colors

| Color | Hex | Usage |
|-------|-----|-------|
| **Red 500** | `#ef4444` | Danger, overspending, critical alerts |
| **Amber 500** | `#f59e0b` | Warning, moderate risk, trial status |
| **Purple 500** | `#8b5cf6` | AI indicators, decision logs, suggestions |
| **Blue 500** | `#3b82f6` | Information, preventive suggestions |

### Neutral Palette

| Color | Hex | Usage |
|-------|-----|-------|
| **Background** | `oklch(1 0 0)` | Page background |
| **Card** | `oklch(1 0 0)` | Card surfaces |
| **Muted** | `oklch(0.97 0 0)` | Subtle backgrounds, hover states |
| **Border** | `oklch(0.922 0 0)` | Borders, dividers |

### Dark Mode

Dark mode inverts the neutral palette while keeping semantic colors intact. Card surfaces shift to `oklch(0.205 0 0)`, borders become subtle white at 10% opacity.

---

## Typography

| Role | Font | Size | Weight |
|------|------|------|--------|
| **Page Title** | Geist Sans | 24px | Bold (700) |
| **Card Title** | Geist Sans | 16px | Semibold (600) |
| **Body** | Geist Sans | 14px | Regular (400) |
| **Small/Meta** | Geist Sans | 12px | Regular (400) |
| **Badge** | Geist Sans | 10px | Medium (500) |
| **Code** | Geist Mono | 13px | Regular (400) |

---

## Component Specifications

### Layout

The application uses a **sidebar + main content** layout pattern:

```
┌────────────────────────────────────────────────┐
│ ┌──────────┐ ┌──────────────────────────────┐  │
│ │          │ │                              │  │
│ │ Sidebar  │ │     Main Content Area        │  │
│ │ 256px    │ │     (scrollable)             │  │
│ │          │ │                              │  │
│ │ - Logo   │ │ - Page Header               │  │
│ │ - WS Sel │ │ - Content Cards             │  │
│ │ - Nav    │ │ - Charts / Tables           │  │
│ │ - Status │ │ - Action Buttons            │  │
│ │ - User   │ │                              │  │
│ │          │ │                              │  │
│ └──────────┘ └──────────────────────────────┘  │
└────────────────────────────────────────────────┘
```

- **Desktop**: Fixed sidebar (256px) + scrollable main area
- **Mobile**: Hamburger menu → Sheet sidebar overlay + full-width content
- **Mobile bottom bar**: Not used (sidebar sheet is sufficient)

### Navigation

| Item | Icon | Route | Badge |
|------|------|-------|-------|
| Dashboard | `LayoutDashboard` | `dashboard` | — |
| Planner | `CalendarCheck` | `planner` | — |
| Finance | `Wallet` | `finance` | — |
| Vault | `Lock` | `vault` | — |
| AI Assistant | `MessageSquare` | `assistant` | "AI" |
| Settings | `Settings` | `settings` | — |

Active state: `bg-emerald-100 text-emerald-700` (light) / `bg-emerald-950 text-emerald-400` (dark)

### Card System

All content cards follow consistent styling:

```
┌─────────────────────────────┐
│ Card Header (pb-2)          │
│ ┌─────────────────────────┐ │
│ │ Icon + Title            │ │
│ └─────────────────────────┘ │
│─────────────────────────────│
│ Card Content               │
│ - padding: p-4 or p-6      │
│ - gap: gap-3 or gap-4      │
│                             │
│ Lists: max-h-96 with        │
│ overflow-y-auto scroll      │
└─────────────────────────────┘
```

### Badge System

| Type | Style | Usage |
|------|-------|-------|
| **Priority: Critical** | `bg-red-100 text-red-700` | Critical tasks, urgent alerts |
| **Priority: High** | `bg-orange-100 text-orange-700` | High-priority items |
| **Priority: Medium** | `bg-amber-100 text-amber-700` | Standard items |
| **Priority: Low** | `bg-gray-100 text-gray-700` | Low-priority items |
| **Status: Active** | `bg-emerald-600 text-white` | Active agents, live status |
| **Status: Idle** | `bg-muted text-muted-foreground` | Inactive items |
| **Agent: AI** | `bg-emerald-100 text-emerald-700` | AI-related indicators |

### Button System

| Type | Style | Usage |
|------|-------|-------|
| **Primary** | `bg-gradient-to-r from-emerald-500 to-teal-600 text-white` | Main CTAs |
| **Secondary** | `border-emerald-300 text-emerald-700` | Secondary actions |
| **Destructive** | `variant="destructive"` | Delete actions |
| **Ghost** | `variant="ghost"` | Inline actions |

---

## Page Designs

### Dashboard

The dashboard is the central command center, designed for at-a-glance understanding:

```
┌──────────────────────────────────────────────┐
│ Dashboard                    [Run Analysis]  │
│ Welcome back to My Workspace                │
├──────────┬──────────┬──────────┬────────────┤
│ Total    │ Monthly  │ Active   │ AI         │
│ Balance  │ Spending │ Tasks    │ Suggestions│
│ $14,500  │ $3,200   │ 4        │ 3          │
├──────────┴──────────┴──────────┴────────────┤
│ ┌─────────────────┐ ┌─────────────────────┐ │
│ │ Cashflow Chart  │ │ Stress & Energy     │ │
│ │ [Area Chart]    │ │ [Bar Chart]         │ │
│ └─────────────────┘ └─────────────────────┘ │
│ ┌─────────────────┐ ┌─────────────────────┐ │
│ │ Emergency Fund  │ │ Autonomous Status   │ │
│ │ [Progress Bar]  │ │ [Level Indicator]   │ │
│ └─────────────────┘ └─────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ AI Agent Network (7 agents grid)        │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────┐ ┌─────────────────────┐ │
│ │ AI Decision Log │ │ Predictions         │ │
│ │ [Scroll List]   │ │ [Warning Cards]     │ │
│ └─────────────────┘ └─────────────────────┘ │
└──────────────────────────────────────────────┘
```

### Planner

Task management with pipeline visualization:

```
┌──────────────────────────────────────────────┐
│ Planner      [Optimize] [Add Task]           │
│ Manage tasks and optimize your schedule      │
├──────────────────────────────────────────────┤
│ [Filter: Status ▼] [Filter: Priority ▼]     │
├──────────────┬──────────────┬────────────────┤
│ ⏳ Pending   │ ✅ Approved  │ ✓ Done        │
│ ┌──────────┐│ ┌──────────┐│ ┌────────────┐│
│ │ Task 1   ││ │ Task 3   ││ │ Task 5     ││
│ │ ⏱90m ⚡30%││ │ ⏱60m     ││ │ Completed  ││
│ │ $250     ││ │ $0       ││ │            ││
│ │[Approve] ││ │[Complete]││ │            ││
│ └──────────┘│ └──────────┘│ └────────────┘│
│ ┌──────────┐│              │                │
│ │ Task 2   ││              │                │
│ │ 🚫 AI    ││              │                │
│ │ Rejected ││              │                │
│ └──────────┘│              │                │
├──────────────┴──────────────┴────────────────┤
│ 📅 Week View                                 │
│ [Mon][Tue][Wed][Thu][Fri][Sat][Sun]          │
└──────────────────────────────────────────────┘
```

### Finance

Tabbed interface with auto-veto warnings:

```
┌──────────────────────────────────────────────┐
│ Finance                          [AI Audit]  │
├──────────────────────────────────────────────┤
│ ⚠️ AI VETO ALERT: Food budget exceeded!      │
├──────────┬──────────┬──────────┬────────────┤
│ Balance  │ Income   │ Expenses │ Emergency  │
│ $14,500  │ $4,700   │ $3,100   │ $10,000    │
├──────────────────────────────────────────────┤
│ [Accounts][Transactions][Budgets][Goals]     │
│                                              │
│ Account cards / Transaction list /           │
│ Budget progress / Goal tracking              │
└──────────────────────────────────────────────┘
```

---

## Animation System

### Page Transitions

```typescript
// AnimatePresence with motion.div
initial={{ opacity: 0, y: 8 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: -8 }}
transition={{ duration: 0.2 }}
```

### Card Entries

```typescript
// Staggered card animations
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ delay: index * 0.05 }}
```

### Loading States

- **Skeleton cards**: `animate-pulse` on card content
- **Button loading**: Disabled state with spinner text ("Analyzing...")
- **AI thinking**: Three-dot bounce animation in chat

---

## Responsive Breakpoints

| Breakpoint | Width | Layout |
|-----------|-------|--------|
| **Mobile** | < 1024px | Sheet sidebar, stacked cards, 2-column stats |
| **Desktop** | ≥ 1024px | Fixed sidebar, multi-column grids, side-by-side charts |

### Grid Specifications

| Component | Mobile | Desktop |
|-----------|--------|---------|
| Stat Cards | 2 columns | 4 columns |
| Chart Row | 1 column | 2 columns |
| Agent Grid | 2 columns | 7 columns |
| Account Cards | 1 column | 3 columns |
| Task Pipeline | 1 column (stacked) | 3 columns (side-by-side) |

---

## Interaction Patterns

### Autonomous Analysis

1. User clicks "Run Autonomous Analysis" button (emerald gradient, prominent)
2. Button text changes to "Analyzing..." with disabled state
3. Toast notification: "Running autonomous analysis..."
4. Server processes all agents sequentially
5. Toast updates: "Analysis complete!" with result preview
6. Dashboard refreshes with new agent logs and suggestions

### AI Veto

1. Transaction or budget rule triggers overspend detection
2. Red warning card appears at top of Finance page
3. Warning shows: category, amount spent vs. limit
4. AI explanation available in suggestion details

### Task AI Rejection

1. User creates task that violates constraints
2. Task appears in "Pending" column with red rejection banner
3. Banner shows: "AI Rejected" icon + reason text
4. User can override by changing task parameters

---

## Icon Usage

Icons are from **Lucide React** and used consistently across the application:

| Icon | Usage |
|------|-------|
| `Brain` | AI/Intelligence, logo |
| `Zap` | Energy, autonomous power |
| `ShieldAlert` | Emergency fund, warnings |
| `Wallet` | Finance, balance |
| `CalendarCheck` | Planner, scheduling |
| `Lock` | Vault, security |
| `MessageSquare` | Chat, AI assistant |
| `Play` | Run analysis, start |
| `Sparkles` | AI features, premium |
| `Clock` | Time, planner agent |
| `DollarSign` | Money, finance agent |
| `Activity` | Health, monitoring |
| `Radio` | Executive, broadcasting |
