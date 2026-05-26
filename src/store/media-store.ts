"use client";

import { create } from "zustand";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ContentStatus =
  | "idea"
  | "draft"
  | "editing"
  | "seo_review"
  | "ready"
  | "scheduled"
  | "published"
  | "archived"
  | "failed";

export interface ContentItem {
  id: string;
  workspaceId: string;
  title: string;
  subtitle?: string | null;
  slug: string;
  angle?: string | null;
  topic?: string | null;
  status: ContentStatus;
  masterMarkdown?: string | null;
  summary?: string | null;
  sourceNotes?: string | null;
  sourceType: string;
  qualityScore: number;
  humanicScore: number;
  seoScore: number;
  trustScore: number;
  humanReviewRequired: boolean;
  version: number;
  parentContentId?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  contentTags?: { id: string; tag: string; category: string }[];
  seoData?: {
    id: string;
    metaTitle?: string | null;
    metaDescription?: string | null;
    focusKeyword?: string | null;
    secondaryKeywords?: string | null;
    readabilityScore: number;
  } | null;
  variants?: ContentVariant[];
  _count?: { variants: number; analyticsEvents: number };
}

export interface ContentVariant {
  id: string;
  contentId: string;
  platform: string;
  variantType: string;
  title?: string | null;
  body?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface QueueStatus {
  pending: number;
  locked: number;
  running: number;
  completed: number;
  failed: number;
  dead_letter: number;
  total: number;
}

export interface SchedulerJob {
  id: string;
  workspaceId: string;
  jobType: string;
  priority: number;
  payloadJson: string;
  status: string;
  nextAttempt: string;
  lockedBy?: string | null;
  retryCount: number;
  maxRetries: number;
  lastError?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryEntry {
  id: string;
  workspaceId: string;
  category: string;
  key: string;
  value: string;
  score: number;
  source: string;
  contextJson?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FatigueEntry {
  id: string;
  workspaceId: string;
  category: string;
  topic?: string | null;
  fatigueScore: number;
  publishCount: number;
  lastResetAt: string;
  status: "fresh" | "warning" | "exhausted";
}

export interface EnergyReport {
  overallEnergy: number;
  canPublish: boolean;
  entries: FatigueEntry[];
  warnings: string[];
}

export interface AnalyticsSummary {
  workspaceId: string;
  period: string;
  since: string;
  content: {
    total: number;
    byStatus: { status: string; count: number }[];
    published: number;
    topPerforming: {
      id: string;
      title: string;
      qualityScore: number;
      humanicScore: number;
      seoScore: number;
      status: string;
    }[];
  };
  publishing: {
    totalJobs: number;
    successful: number;
    successRate: number;
    byPlatform: { platform: string; count: number }[];
  };
  metrics: {
    type: string;
    total: number;
    count: number;
    average: number;
  }[];
  recentEvents: {
    id: string;
    metricType: string;
    metricValue: number;
    platform?: string | null;
    capturedAt: string;
    contentItem?: { id: string; title: string } | null;
  }[];
}

export type AutomationMode = "manual" | "semi_auto" | "full_auto";

// ─── Store Interface ──────────────────────────────────────────────────────────

interface MediaStore {
  // Content
  contentItems: ContentItem[];
  selectedContent: ContentItem | null;
  contentFilter: string;
  setContentItems: (items: ContentItem[]) => void;
  setSelectedContent: (item: ContentItem | null) => void;
  setContentFilter: (filter: string) => void;

  // Queue
  queueStatus: QueueStatus | null;
  schedulerJobs: SchedulerJob[];
  setQueueStatus: (status: QueueStatus) => void;
  setSchedulerJobs: (jobs: SchedulerJob[]) => void;

  // Memory
  memories: MemoryEntry[];
  memoryFilter: string;
  memorySearch: string;
  setMemories: (memories: MemoryEntry[]) => void;
  setMemoryFilter: (filter: string) => void;
  setMemorySearch: (search: string) => void;

  // Energy
  energyReport: EnergyReport | null;
  setEnergyReport: (report: EnergyReport) => void;

  // Analytics
  analyticsSummary: AnalyticsSummary | null;
  setAnalyticsSummary: (summary: AnalyticsSummary) => void;

  // UI State
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isGenerating: boolean;
  setIsGenerating: (val: boolean) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (val: boolean) => void;
  contentDetailOpen: boolean;
  setContentDetailOpen: (val: boolean) => void;
  createDialogOpen: boolean;
  setCreateDialogOpen: (val: boolean) => void;
  automationMode: AutomationMode;
  setAutomationMode: (mode: AutomationMode) => void;

  // Workspace
  workspaceId: string;
  setWorkspaceId: (id: string) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useMediaStore = create<MediaStore>((set) => ({
  // Content
  contentItems: [],
  selectedContent: null,
  contentFilter: "all",
  setContentItems: (items) => set({ contentItems: items }),
  setSelectedContent: (item) => set({ selectedContent: item }),
  setContentFilter: (filter) => set({ contentFilter: filter }),

  // Queue
  queueStatus: null,
  schedulerJobs: [],
  setQueueStatus: (status) => set({ queueStatus: status }),
  setSchedulerJobs: (jobs) => set({ schedulerJobs: jobs }),

  // Memory
  memories: [],
  memoryFilter: "all",
  memorySearch: "",
  setMemories: (memories) => set({ memories }),
  setMemoryFilter: (filter) => set({ memoryFilter: filter }),
  setMemorySearch: (search) => set({ memorySearch: search }),

  // Energy
  energyReport: null,
  setEnergyReport: (report) => set({ energyReport: report }),

  // Analytics
  analyticsSummary: null,
  setAnalyticsSummary: (summary) => set({ analyticsSummary: summary }),

  // UI State
  activeTab: "pipeline",
  setActiveTab: (tab) => set({ activeTab: tab }),
  isGenerating: false,
  setIsGenerating: (val) => set({ isGenerating: val }),
  sidebarOpen: true,
  setSidebarOpen: (val) => set({ sidebarOpen: val }),
  contentDetailOpen: false,
  setContentDetailOpen: (val) => set({ contentDetailOpen: val }),
  createDialogOpen: false,
  setCreateDialogOpen: (val) => set({ createDialogOpen: val }),
  automationMode: "semi_auto",
  setAutomationMode: (mode) => set({ automationMode: mode }),

  // Workspace
  workspaceId: "demo-workspace",
  setWorkspaceId: (id) => set({ workspaceId: id }),
}));
