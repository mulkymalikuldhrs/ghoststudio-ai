// ────────────────────────────────────────────────────────────────────────────────
// TanStack Query Hooks — Comprehensive API layer
// GhostStudio AI v2.0
// ────────────────────────────────────────────────────────────────────────────────

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  ContentItem,
  ContentListResponse,
  ContentCreateInput,
  ContentUpdateInput,
  ContentGenerateInput,
  ContentScoreInput,
  ContentScores,
  PublishInput,
  PublishJob,
  SchedulerJob,
  QueueStatus,
  SchedulerEnqueueInput,
  SchedulerProcessInput,
  MemoryEntry,
  EnergyEntry,
  AnalyticsEvent,
  AnalyticsSummary,
  VideoProject,
  VideoProjectListResponse,
  VideoProjectCreateInput,
  VideoGenerateInput,
  VideoRenderInput,
  VideoRenderJob,
  HeatmapClipJob,
  HeatmapJobListResponse,
  HeatmapJobCreateInput,
  ClipInput,
  BrowserStatus,
  BrowserSession,
  ScreenshotOptions,
  ScreenshotResult,
  InteractionInput,
  InteractionResult,
  PlatformActionInput,
  PlatformActionResult,
  VideoTemplate,
  Subscription,
  TestResult,
} from "@/types";

// ─── API Helper ───────────────────────────────────────────────────────────────

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTENT HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

export function useContentItems(workspaceId: string, filter?: string) {
  return useQuery({
    queryKey: ["content", workspaceId, filter],
    queryFn: () => {
      const params = new URLSearchParams({ workspaceId });
      if (filter && filter !== "all") params.set("status", filter);
      return apiFetch<ContentListResponse>(`/api/content?${params}`);
    },
    enabled: !!workspaceId,
  });
}

export function useContentItem(id: string) {
  return useQuery({
    queryKey: ["content", id],
    queryFn: () => apiFetch<ContentItem>(`/api/content/${id}`),
    enabled: !!id,
  });
}

export function useCreateContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ContentCreateInput) =>
      apiFetch<ContentItem>("/api/content", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content"] });
    },
  });
}

export function useUpdateContent(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ContentUpdateInput) =>
      apiFetch<ContentItem>(`/api/content/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content"] });
      queryClient.invalidateQueries({ queryKey: ["content", id] });
    },
  });
}

export function useDeleteContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/api/content/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content"] });
    },
  });
}

export function useGenerateContent(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ContentGenerateInput) =>
      apiFetch<ContentItem>(`/api/content/${id}/generate`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content"] });
      queryClient.invalidateQueries({ queryKey: ["content", id] });
    },
  });
}

export function useScoreContent(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ContentScoreInput) =>
      apiFetch<ContentScores>(`/api/content/${id}/score`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content"] });
      queryClient.invalidateQueries({ queryKey: ["content", id] });
    },
  });
}

export function usePublishContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PublishInput) =>
      apiFetch<PublishJob>("/api/publish", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content"] });
      queryClient.invalidateQueries({ queryKey: ["scheduler"] });
      queryClient.invalidateQueries({ queryKey: ["publish"] });
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEDULER HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

export function useSchedulerStatus(workspaceId: string) {
  return useQuery({
    queryKey: ["scheduler", workspaceId],
    queryFn: () =>
      apiFetch<{ jobs: SchedulerJob[]; queueStatus: QueueStatus }>(
        `/api/scheduler?workspaceId=${workspaceId}`
      ),
    enabled: !!workspaceId,
    refetchInterval: 10000,
  });
}

export function useEnqueueJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SchedulerEnqueueInput) =>
      apiFetch<SchedulerJob>("/api/scheduler", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduler"] });
    },
  });
}

export function useProcessJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SchedulerProcessInput) =>
      apiFetch<{ processed: number }>("/api/scheduler/process", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduler"] });
      queryClient.invalidateQueries({ queryKey: ["content"] });
      queryClient.invalidateQueries({ queryKey: ["video"] });
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// MEMORY HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

export function useMemories(workspaceId: string, category?: string, search?: string) {
  return useQuery({
    queryKey: ["memory", workspaceId, category, search],
    queryFn: () => {
      const params = new URLSearchParams({ workspaceId });
      if (category && category !== "all") params.set("category", category);
      if (search) params.set("search", search);
      return apiFetch<{ entries: MemoryEntry[] }>(`/api/memory?${params}`);
    },
    enabled: !!workspaceId,
  });
}

export function useStoreMemory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      workspaceId: string;
      category: string;
      key: string;
      value: string;
      source?: string;
      score?: number;
      contextJson?: string;
    }) =>
      apiFetch<MemoryEntry>("/api/memory", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memory"] });
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENERGY HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

export function useEnergyReport(workspaceId: string) {
  return useQuery({
    queryKey: ["energy", workspaceId],
    queryFn: () =>
      apiFetch<{
        entries: EnergyEntry[];
        summary: {
          overallEnergy: number;
          canPublish: boolean;
          warnings: string[];
          criticalAreas: string[];
        };
      }>(`/api/energy?workspaceId=${workspaceId}`),
    enabled: !!workspaceId,
  });
}

export function useTrackEnergy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      workspaceId: string;
      category: string;
      topic?: string;
      fatigueScore?: number;
    }) =>
      apiFetch<EnergyEntry>("/api/energy", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["energy"] });
    },
  });
}

export function useResetEnergy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      workspaceId: string;
      category: string;
      topic?: string;
    }) =>
      apiFetch<{ success: boolean }>("/api/energy", {
        method: "POST",
        body: JSON.stringify({ ...data, action: "reset" }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["energy"] });
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANALYTICS HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

export function useAnalytics(workspaceId: string, days: number = 30) {
  return useQuery({
    queryKey: ["analytics", workspaceId, days],
    queryFn: () =>
      apiFetch<{
        events: AnalyticsEvent[];
        summary: AnalyticsSummary;
      }>(`/api/analytics?workspaceId=${workspaceId}&days=${days}`),
    enabled: !!workspaceId,
  });
}

export function useAnalyticsSummary(workspaceId: string, period: string = "7d") {
  return useQuery({
    queryKey: ["analytics-summary", workspaceId, period],
    queryFn: () =>
      apiFetch<AnalyticsSummary>(`/api/analytics?workspaceId=${workspaceId}&period=${period}`),
    enabled: !!workspaceId,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIDEO HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

export function useVideoProjects(userId: string, filter?: string) {
  return useQuery({
    queryKey: ["video", userId, filter],
    queryFn: () => {
      const params = new URLSearchParams({ userId });
      if (filter && filter !== "all") params.set("status", filter);
      return apiFetch<VideoProjectListResponse>(`/api/video?${params}`);
    },
    enabled: !!userId,
  });
}

export function useVideoProject(id: string) {
  return useQuery({
    queryKey: ["video", id],
    queryFn: () => apiFetch<VideoProject>(`/api/video/${id}`),
    enabled: !!id,
  });
}

export function useCreateVideoProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: VideoProjectCreateInput) =>
      apiFetch<VideoProject>("/api/video", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video"] });
    },
  });
}

export function useGenerateVideo(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: VideoGenerateInput) =>
      apiFetch<VideoProject>(`/api/video/${id}/generate`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video"] });
      queryClient.invalidateQueries({ queryKey: ["video", id] });
    },
  });
}

export function useRenderVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: VideoRenderInput) =>
      apiFetch<VideoRenderJob>("/api/video/render", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video"] });
    },
  });
}

export function useGenerateScript() {
  return useMutation({
    mutationFn: (data: { prompt: string; niche: string; duration: number }) =>
      apiFetch<{ script: string; scenes: unknown[] }>(
        "/api/projects/generate-script",
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      ),
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// HEATMAP / VIRAL LAB HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

export function useHeatmapJobs(userId: string) {
  return useQuery({
    queryKey: ["heatmap", userId],
    queryFn: () =>
      apiFetch<HeatmapJobListResponse>(`/api/heatmap?userId=${userId}`),
    enabled: !!userId,
    refetchInterval: 5000,
  });
}

export function useCreateHeatmapJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: HeatmapJobCreateInput) =>
      apiFetch<HeatmapClipJob>("/api/heatmap", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["heatmap"] });
    },
  });
}

export function useClipHeatmap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ClipInput) =>
      apiFetch<HeatmapClipJob>("/api/clip", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["heatmap"] });
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// BROWSER AUTOMATION HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

export function useBrowserStatus() {
  return useQuery({
    queryKey: ["browser"],
    queryFn: () => apiFetch<BrowserStatus>("/api/browser"),
    refetchInterval: 15000,
  });
}

export function useBrowserSessions() {
  return useQuery({
    queryKey: ["browser-sessions"],
    queryFn: () =>
      apiFetch<{ sessions: BrowserSession[] }>("/api/browser"),
    refetchInterval: 10000,
  });
}

export function useCreateBrowserSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      platform?: string;
      headless?: boolean;
      viewport?: { width: number; height: number };
    }) =>
      apiFetch<BrowserSession>("/api/browser", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["browser"] });
      queryClient.invalidateQueries({ queryKey: ["browser-sessions"] });
    },
  });
}

export function useCloseBrowserSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) =>
      apiFetch<{ success: boolean }>(`/api/browser/session/${sessionId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["browser"] });
      queryClient.invalidateQueries({ queryKey: ["browser-sessions"] });
    },
  });
}

export function useBrowserNavigate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { sessionId: string; url: string }) =>
      apiFetch<InteractionResult>("/api/browser/interact", {
        method: "POST",
        body: JSON.stringify({ action: "navigate", ...data }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["browser"] });
      queryClient.invalidateQueries({ queryKey: ["browser-sessions"] });
    },
  });
}

export function useBrowserScreenshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ScreenshotOptions) =>
      apiFetch<ScreenshotResult>("/api/browser/screenshot", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["browser"] });
    },
  });
}

export function useBrowserInteract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InteractionInput) =>
      apiFetch<InteractionResult>("/api/browser/interact", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["browser"] });
    },
  });
}

export function useBrowserPlatformAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PlatformActionInput) =>
      apiFetch<PlatformActionResult>("/api/browser/platform-action", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["browser"] });
    },
  });
}

export function useRunBrowserTests() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { type: string; suite?: string }) =>
      apiFetch<{ results: TestResult[] }>("/api/browser/test", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["browser"] });
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER / AUTH HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

export function useUser() {
  return useQuery({
    queryKey: ["user"],
    queryFn: () =>
      apiFetch<{
        id: string;
        email: string;
        name: string | null;
        avatar: string | null;
        role: string;
        automationMode: string;
        plan: string;
        stripeCustomerId: string | null;
      }>("/api/user"),
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROJECTS HOOKS (Legacy — maps to Video Projects)
// ═══════════════════════════════════════════════════════════════════════════════

export function useProjects(status?: string) {
  return useQuery({
    queryKey: ["projects", status],
    queryFn: () => {
      const params = status ? `?status=${status}` : "";
      return apiFetch<{ projects: VideoProject[] }>(`/api/projects${params}`);
    },
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ["project", id],
    queryFn: () => apiFetch<VideoProject>(`/api/projects/${id}`),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; prompt?: string; niche?: string }) =>
      apiFetch<VideoProject>("/api/projects", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["video"] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/api/projects/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["video"] });
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATES HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

export function useTemplates(category?: string, search?: string) {
  return useQuery({
    queryKey: ["templates", category, search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (category && category !== "all") params.set("category", category);
      if (search) params.set("search", search);
      return apiFetch<{ templates: VideoTemplate[] }>(
        `/api/templates?${params}`
      );
    },
  });
}

export function useVideoTemplates(category?: string) {
  return useQuery({
    queryKey: ["video-templates", category],
    queryFn: () => {
      const params = new URLSearchParams();
      if (category && category !== "all") params.set("category", category);
      return apiFetch<{ templates: VideoTemplate[] }>(
        `/api/video/templates?${params}`
      );
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTIONS HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

export function useSubscriptions() {
  return useQuery({
    queryKey: ["subscriptions"],
    queryFn: () =>
      apiFetch<{ subscriptions: Subscription[] }>("/api/subscriptions"),
  });
}

export function useCreateCheckout() {
  return useMutation({
    mutationFn: (planId: string) =>
      apiFetch<{ url: string }>("/api/stripe/checkout", {
        method: "POST",
        body: JSON.stringify({ planId }),
      }),
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLISH JOBS HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

export function usePublishJobs(workspaceId: string) {
  return useQuery({
    queryKey: ["publish", workspaceId],
    queryFn: () =>
      apiFetch<{ jobs: PublishJob[] }>(`/api/publish?workspaceId=${workspaceId}`),
    enabled: !!workspaceId,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// TREND HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

export function useTrends(niche?: string) {
  return useQuery({
    queryKey: ["trends", niche],
    queryFn: () => {
      const params = new URLSearchParams();
      if (niche) params.set("niche", niche);
      return apiFetch<{ trends: { topic: string; score: number; source: string }[] }>(`/api/trends?${params}`);
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ALIAS HOOKS (backwards compat)
// ═══════════════════════════════════════════════════════════════════════════════

/** @deprecated Use useMemories instead */
export function useMemoryEntries(workspaceId: string, category?: string) {
  return useMemories(workspaceId, category);
}

/** @deprecated Use useStoreMemory instead */
export function useCreateMemory() {
  return useStoreMemory();
}

/** @deprecated Use useEnergyReport instead */
export function useEnergyStatus(workspaceId: string) {
  return useEnergyReport(workspaceId);
}

/** @deprecated Use useUser instead */
export function useCurrentUser() {
  return useUser();
}

/** @deprecated Use useSchedulerStatus instead */
export function useSchedulerJobs(workspaceId: string) {
  return useSchedulerStatus(workspaceId);
}
