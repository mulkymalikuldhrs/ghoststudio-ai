// ────────────────────────────────────────────────────────────────────────────────
// Media Store — UI State Only (Zustand)
// GhostStudio AI v2.0
// Data fetching is handled by TanStack Query hooks
// ────────────────────────────────────────────────────────────────────────────────

import { create } from "zustand";
import type {
  ContentItem as ContentType,
  VideoProject as VideoProjectType,
  ContentStatus,
  VideoProjectStatus,
} from "@/types";

// ─── Re-export types used by tab components ──────────────────────────────────

export type { ContentStatus };
export type { VideoProjectStatus };

// ─── Tab Types ───────────────────────────────────────────────────────────────

export type OSTab =
  | "content"
  | "video"
  | "publish"
  | "scheduler"
  | "memory"
  | "energy"
  | "analytics"
  | "browser";

export type AutomationMode = "manual" | "semi_auto" | "full_auto";

// ─── Heatmap types local to store ────────────────────────────────────────────

export interface HeatmapSegment {
  id: string;
  startTime: number;
  endTime: number;
  intensity: number;
  label: string;
}

export interface HeatmapJob {
  id: string;
  userId: string;
  youtubeUrl: string;
  status: string;
  progress: number;
  segments: HeatmapSegment[];
  outputUrl?: string;
  createdAt: string;
}

// ─── Browser types local to store ────────────────────────────────────────────

export interface BrowserInstance {
  id: string;
  status: string;
  pageCount: number;
  currentUrl: string;
}

export interface PlatformLogin {
  platform: string;
  label: string;
  loggedIn: boolean;
  username?: string;
}

export interface TestResult {
  id: string;
  suite: string;
  name: string;
  status: string;
  duration?: number;
  error?: string;
  timestamp: string;
}

export interface EnergyReport {
  overallEnergy: number;
  canPublish: boolean;
  entries: import("@/types").EnergyEntry[];
  warnings: string[];
}

// ─── Store Interface ─────────────────────────────────────────────────────────

interface MediaStore {
  // ── Content Pipeline UI ────────────────────────────────────────────────
  selectedContent: ContentType | null;
  setSelectedContent: (content: ContentType | null) => void;
  contentFilter: string;
  setContentFilter: (filter: string) => void;
  contentDetailOpen: boolean;
  setContentDetailOpen: (open: boolean) => void;
  createContentOpen: boolean;
  setCreateContentOpen: (open: boolean) => void;

  // ── Video Studio UI ────────────────────────────────────────────────────
  selectedVideo: VideoProjectType | null;
  setSelectedVideo: (video: VideoProjectType | null) => void;
  videoFilter: string;
  setVideoFilter: (filter: string) => void;
  videoDetailOpen: boolean;
  setVideoDetailOpen: (open: boolean) => void;
  createVideoOpen: boolean;
  setCreateVideoOpen: (open: boolean) => void;

  // ── Memory UI ──────────────────────────────────────────────────────────
  memoryFilter: string;
  setMemoryFilter: (filter: string) => void;
  memorySearch: string;
  setMemorySearch: (search: string) => void;
  addMemoryOpen: boolean;
  setAddMemoryOpen: (open: boolean) => void;

  // ── Scheduler UI ───────────────────────────────────────────────────────
  enqueueJobOpen: boolean;
  setEnqueueJobOpen: (open: boolean) => void;

  // ── Browser UI ─────────────────────────────────────────────────────────
  currentScreenshot: string | null;
  setCurrentScreenshot: (screenshot: string | null) => void;

  // ── Global UI State ────────────────────────────────────────────────────
  activeTab: OSTab;
  setActiveTab: (tab: OSTab) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  automationMode: AutomationMode;
  setAutomationMode: (mode: AutomationMode) => void;
  activeWorkspaceId: string;
  setActiveWorkspaceId: (id: string) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useMediaStore = create<MediaStore>((set) => ({
  // ── Content Pipeline UI ────────────────────────────────────────────────
  selectedContent: null,
  setSelectedContent: (content) => set({ selectedContent: content }),
  contentFilter: "all",
  setContentFilter: (filter) => set({ contentFilter: filter }),
  contentDetailOpen: false,
  setContentDetailOpen: (open) => set({ contentDetailOpen: open }),
  createContentOpen: false,
  setCreateContentOpen: (open) => set({ createContentOpen: open }),

  // ── Video Studio UI ────────────────────────────────────────────────────
  selectedVideo: null,
  setSelectedVideo: (video) => set({ selectedVideo: video }),
  videoFilter: "all",
  setVideoFilter: (filter) => set({ videoFilter: filter }),
  videoDetailOpen: false,
  setVideoDetailOpen: (open) => set({ videoDetailOpen: open }),
  createVideoOpen: false,
  setCreateVideoOpen: (open) => set({ createVideoOpen: open }),

  // ── Memory UI ──────────────────────────────────────────────────────────
  memoryFilter: "all",
  setMemoryFilter: (filter) => set({ memoryFilter: filter }),
  memorySearch: "",
  setMemorySearch: (search) => set({ memorySearch: search }),
  addMemoryOpen: false,
  setAddMemoryOpen: (open) => set({ addMemoryOpen: open }),

  // ── Scheduler UI ───────────────────────────────────────────────────────
  enqueueJobOpen: false,
  setEnqueueJobOpen: (open) => set({ enqueueJobOpen: open }),

  // ── Browser UI ─────────────────────────────────────────────────────────
  currentScreenshot: null,
  setCurrentScreenshot: (screenshot) => set({ currentScreenshot: screenshot }),

  // ── Global UI State ────────────────────────────────────────────────────
  activeTab: "content",
  setActiveTab: (tab) => set({ activeTab: tab }),
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  automationMode: "semi_auto",
  setAutomationMode: (mode) => set({ automationMode: mode }),
  activeWorkspaceId: "demo-workspace",
  setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),
}));
