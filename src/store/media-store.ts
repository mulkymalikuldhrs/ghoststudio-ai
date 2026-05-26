// ────────────────────────────────────────────────────────────────────────────────
// Media Store — Main OS Dashboard State (Zustand)
// GhostStudio AI v2.0
// ────────────────────────────────────────────────────────────────────────────────

import { create } from "zustand";
import type {
  ContentItem,
  VideoProject,
  HeatmapClipJob,
  SchedulerJob,
  QueueStatus,
  MemoryEntry,
  EnergyEntry,
  AnalyticsEvent,
  AnalyticsSummary,
} from "@/types";

// ─── Tab Types ───────────────────────────────────────────────────────────────

export type OSTab =
  | "content"
  | "video"
  | "publish"
  | "scheduler"
  | "memory"
  | "energy"
  | "analytics"
  | "browser"
  | "heatmap";

export type AutomationMode = "manual" | "semi_auto" | "full_auto";

// ─── Store Interface ─────────────────────────────────────────────────────────

interface MediaStore {
  // ── Content Pipeline ────────────────────────────────────────────────────
  contentItems: ContentItem[];
  selectedContentId: string | null;
  contentFilter: string;
  setContentItems: (items: ContentItem[]) => void;
  setSelectedContentId: (id: string | null) => void;
  setContentFilter: (filter: string) => void;

  // ── Video Studio ────────────────────────────────────────────────────────
  videoProjects: VideoProject[];
  selectedVideoId: string | null;
  videoFilter: string;
  setVideoProjects: (projects: VideoProject[]) => void;
  setSelectedVideoId: (id: string | null) => void;
  setVideoFilter: (filter: string) => void;

  // ── Heatmap / Viral Lab ─────────────────────────────────────────────────
  heatmapJobs: HeatmapClipJob[];
  currentHeatmapUrl: string | null;
  heatmapSegments: HeatmapClipJob[];
  setHeatmapJobs: (jobs: HeatmapClipJob[]) => void;
  setCurrentHeatmapUrl: (url: string | null) => void;
  setHeatmapSegments: (segments: HeatmapClipJob[]) => void;

  // ── Scheduler ───────────────────────────────────────────────────────────
  queueStatus: Record<string, number>;
  schedulerJobs: SchedulerJob[];
  setQueueStatus: (status: Record<string, number>) => void;
  setSchedulerJobs: (jobs: SchedulerJob[]) => void;

  // ── Memory ──────────────────────────────────────────────────────────────
  memories: MemoryEntry[];
  memoryCategory: string;
  memorySearch: string;
  setMemories: (memories: MemoryEntry[]) => void;
  setMemoryCategory: (category: string) => void;
  setMemorySearch: (search: string) => void;

  // ── Analytics ───────────────────────────────────────────────────────────
  analyticsSummary: AnalyticsSummary | null;
  analyticsEvents: AnalyticsEvent[];
  setAnalyticsSummary: (summary: AnalyticsSummary | null) => void;
  setAnalyticsEvents: (events: AnalyticsEvent[]) => void;

  // ── Energy ──────────────────────────────────────────────────────────────
  energyReport: {
    overallEnergy: number;
    canPublish: boolean;
    entries: EnergyEntry[];
    warnings: string[];
  } | null;
  energyEntries: EnergyEntry[];
  setEnergyReport: (report: MediaStore["energyReport"]) => void;
  setEnergyEntries: (entries: EnergyEntry[]) => void;

  // ── Browser ─────────────────────────────────────────────────────────────
  browserStatus: { active: boolean; pageCount: number } | null;
  currentScreenshot: string | null;
  testResults: Record<string, unknown>[];
  setBrowserStatus: (status: { active: boolean; pageCount: number } | null) => void;
  setCurrentScreenshot: (screenshot: string | null) => void;
  setTestResults: (results: Record<string, unknown>[]) => void;

  // ── UI State ────────────────────────────────────────────────────────────
  activeTab: OSTab;
  setActiveTab: (tab: OSTab) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  automationMode: AutomationMode;
  setAutomationMode: (mode: AutomationMode) => void;
  workspaceId: string;
  setWorkspaceId: (id: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // ── Dialogs ─────────────────────────────────────────────────────────────
  showCreateContent: boolean;
  setShowCreateContent: (open: boolean) => void;
  showCreateVideo: boolean;
  setShowCreateVideo: (open: boolean) => void;
  showAddMemory: boolean;
  setShowAddMemory: (open: boolean) => void;
  showContentDetail: boolean;
  setShowContentDetail: (open: boolean) => void;
  showVideoDetail: boolean;
  setShowVideoDetail: (open: boolean) => void;
  showEnqueueJob: boolean;
  setShowEnqueueJob: (open: boolean) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useMediaStore = create<MediaStore>((set) => ({
  // ── Content Pipeline ────────────────────────────────────────────────────
  contentItems: [],
  selectedContentId: null,
  contentFilter: "all",
  setContentItems: (items) => set({ contentItems: items }),
  setSelectedContentId: (id) => set({ selectedContentId: id }),
  setContentFilter: (filter) => set({ contentFilter: filter }),

  // ── Video Studio ────────────────────────────────────────────────────────
  videoProjects: [],
  selectedVideoId: null,
  videoFilter: "all",
  setVideoProjects: (projects) => set({ videoProjects: projects }),
  setSelectedVideoId: (id) => set({ selectedVideoId: id }),
  setVideoFilter: (filter) => set({ videoFilter: filter }),

  // ── Heatmap / Viral Lab ─────────────────────────────────────────────────
  heatmapJobs: [],
  currentHeatmapUrl: null,
  heatmapSegments: [],
  setHeatmapJobs: (jobs) => set({ heatmapJobs: jobs }),
  setCurrentHeatmapUrl: (url) => set({ currentHeatmapUrl: url }),
  setHeatmapSegments: (segments) => set({ heatmapSegments: segments }),

  // ── Scheduler ───────────────────────────────────────────────────────────
  queueStatus: {},
  schedulerJobs: [],
  setQueueStatus: (status) => set({ queueStatus: status }),
  setSchedulerJobs: (jobs) => set({ schedulerJobs: jobs }),

  // ── Memory ──────────────────────────────────────────────────────────────
  memories: [],
  memoryCategory: "all",
  memorySearch: "",
  setMemories: (memories) => set({ memories }),
  setMemoryCategory: (category) => set({ memoryCategory: category }),
  setMemorySearch: (search) => set({ memorySearch: search }),

  // ── Analytics ───────────────────────────────────────────────────────────
  analyticsSummary: null,
  analyticsEvents: [],
  setAnalyticsSummary: (summary) => set({ analyticsSummary: summary }),
  setAnalyticsEvents: (events) => set({ analyticsEvents: events }),

  // ── Energy ──────────────────────────────────────────────────────────────
  energyReport: null,
  energyEntries: [],
  setEnergyReport: (report) => set({ energyReport: report }),
  setEnergyEntries: (entries) => set({ energyEntries: entries }),

  // ── Browser ─────────────────────────────────────────────────────────────
  browserStatus: null,
  currentScreenshot: null,
  testResults: [],
  setBrowserStatus: (status) => set({ browserStatus: status }),
  setCurrentScreenshot: (screenshot) => set({ currentScreenshot: screenshot }),
  setTestResults: (results) => set({ testResults: results }),

  // ── UI State ────────────────────────────────────────────────────────────
  activeTab: "content",
  setActiveTab: (tab) => set({ activeTab: tab }),
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  automationMode: "semi_auto",
  setAutomationMode: (mode) => set({ automationMode: mode }),
  workspaceId: "demo-workspace",
  setWorkspaceId: (id) => set({ workspaceId: id }),
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  // ── Dialogs ─────────────────────────────────────────────────────────────
  showCreateContent: false,
  setShowCreateContent: (open) => set({ showCreateContent: open }),
  showCreateVideo: false,
  setShowCreateVideo: (open) => set({ showCreateVideo: open }),
  showAddMemory: false,
  setShowAddMemory: (open) => set({ showAddMemory: open }),
  showContentDetail: false,
  setShowContentDetail: (open) => set({ showContentDetail: open }),
  showVideoDetail: false,
  setShowVideoDetail: (open) => set({ showVideoDetail: open }),
  showEnqueueJob: false,
  setShowEnqueueJob: (open) => set({ showEnqueueJob: open }),
}));
