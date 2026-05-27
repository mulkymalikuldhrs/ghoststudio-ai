# Task: Break up monolithic OS dashboard into modular per-tab components

## Summary
Successfully refactored the 2591-line monolithic `src/app/os/page.tsx` into 8 modular tab components + 1 sidebar, connected to real API data via TanStack Query hooks.

## Changes Made

### 1. Updated `src/store/media-store.ts`
- Removed all mock data (MOCK_CONTENT, MOCK_QUEUE, MOCK_MEMORIES, MOCK_ENERGY, MOCK_ANALYTICS, etc.)
- Removed data-storage fields (contentItems, videoProjects, heatmapJobs, queueStatus, memories, analyticsSummary, energyReport, etc.)
- Removed data-fetching methods (setContentItems, setVideoProjects, etc.)
- Kept only UI state: activeTab, sidebarOpen, filters, dialog open states, selected items
- Added clean dialog state management (createContentOpen, createVideoOpen, addMemoryOpen, enqueueJobOpen)
- Reduced from 334 lines to ~170 lines

### 2. Updated `src/lib/hooks.ts`
- Added missing hooks: `useDeleteContent`, `useResetEnergy`, `useAnalyticsSummary`, `usePublishJobs`, `useTrends`
- Added browser automation hooks: `useBrowserSessions`, `useCreateBrowserSession`, `useCloseBrowserSession`, `useBrowserNavigate`, `useBrowserPlatformAction`, `useRunBrowserTests`
- All hooks use TanStack Query v5 syntax with proper invalidation
- Kept backwards-compatible alias hooks

### 3. Created `src/components/os/sidebar.tsx`
- Collapsible sidebar with navigation items for all 8 tabs
- Automation mode switcher (manual/semi_auto/full_auto)
- Theme toggle
- Workspace selector
- Active tab indicator with red accent
- Mobile responsive with overlay

### 4. Created `src/components/os/content-pipeline-tab.tsx`
- Content list with status filters
- Content creation dialog with idea/angle/topic/source type
- Content detail dialog with markdown preview (ReactMarkdown)
- Action buttons: Score, Humanic Rewrite, SEO, Repurpose, Delete, Publish
- Connected to useContentItems, useCreateContent, useGenerateContent, useScoreContent, usePublishContent, useDeleteContent
- Loading state with spinner

### 5. Created `src/components/os/video-studio-tab.tsx`
- Video project list with status filter pills
- Video creation wizard (prompt, niche, duration, aspect ratio, style)
- Video detail dialog with scene editor and export options
- Render progress tracking
- Connected to useVideoProjects, useCreateVideoProject, useGenerateVideo, useRenderVideo

### 6. Created `src/components/os/viral-lab-tab.tsx`
- YouTube URL input for heatmap scanning
- Heatmap visualization (Recharts BarChart with color-coded intensity)
- Clip generation with crop/subtitle/format options
- Clip job history
- Connected to useHeatmapJobs, useCreateHeatmapJob, useClipHeatmap

### 7. Created `src/components/os/scheduler-tab.tsx`
- Job queue visualization (pending/locked/running/completed/failed/dead_letter)
- Queue depth visual bar
- Process button, Retry Failed, Run Daily Cycle
- Enqueue job dialog (type, priority, payload)
- Recent jobs list
- Connected to useSchedulerStatus, useEnqueueJob, useProcessJob

### 8. Created `src/components/os/memory-tab.tsx`
- Memory browser by category (11 categories with icons)
- Memory search
- Memory scores visualization (color-coded progress bars)
- Add new memory dialog (category, key, value, score, source, context)
- Grouped display by category
- Connected to useMemories, useStoreMemory

### 9. Created `src/components/os/analytics-tab.tsx`
- KPI cards (views, published, CTR, revenue, total content, memory count)
- Publish trend chart (LineChart)
- Platform distribution pie chart
- Content performance horizontal bar chart
- Top performing content list
- Recent analytics events
- Connected to useAnalytics

### 10. Created `src/components/os/energy-tab.tsx`
- Overall energy gauge (circular SVG progress)
- Fatigue levels per category (topic, tone, saturation, audience, hook, visual)
- Status indicators (fresh/warning/exhausted with icons)
- Per-category reset buttons
- Recommendations card
- Connected to useEnergyReport, useResetEnergy

### 11. Created `src/components/os/browser-lab-tab.tsx`
- Create browser session (default, WordPress, TikTok, YouTube)
- URL navigation
- Interactive controls (click, type, scroll, select)
- Screenshot capture with preview
- Platform auto-post
- E2E test runner with suite selection
- Connected to useBrowserStatus, useBrowserSessions, useCreateBrowserSession, useBrowserInteract, useBrowserScreenshot, useBrowserPlatformAction, useRunBrowserTests

### 12. Rewrote `src/app/os/page.tsx`
- Reduced from 2591 lines to ~120 lines
- Imports all tab components
- Renders sidebar + top header + active tab content
- Tab switching via Zustand store
- Framer Motion page transitions
- No inline JSX from monolith

## Lint Status
- Only pre-existing errors remain (carousel.tsx, use-mobile.ts) - not from new code
- All new code passes lint cleanly
