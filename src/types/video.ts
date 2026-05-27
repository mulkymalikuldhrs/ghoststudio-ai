// ────────────────────────────────────────────────────────────────────────────────
// Video Types — Matching Prisma Schema exactly
// GhostStudio AI v2.0
// ────────────────────────────────────────────────────────────────────────────────

// ─── Enums / Union Types ─────────────────────────────────────────────────────

export type VideoProjectStatus =
  | "draft"
  | "scripting"
  | "generating"
  | "rendering"
  | "completed"
  | "failed";

export type VideoNiche =
  | "general"
  | "horror"
  | "motivation"
  | "crypto"
  | "anime"
  | "education"
  | "tech";

export type AspectRatio =
  | "9:16"
  | "16:9"
  | "1:1";

export type VideoSceneType =
  | "image"
  | "video"
  | "text"
  | "transition";

export type VideoSceneStatus =
  | "pending"
  | "generating"
  | "rendered"
  | "failed";

export type VideoAssetType =
  | "image"
  | "audio"
  | "video"
  | "font"
  | "bgm";

export type RenderJobType =
  | "full"
  | "scene"
  | "thumbnail"
  | "preview";

export type RenderJobStatus =
  | "queued"
  | "processing"
  | "rendering"
  | "completed"
  | "failed";

export type VideoTemplateCategory =
  | "minimal"
  | "elegant"
  | "neon"
  | "cartoon"
  | "modern"
  | "healing"
  | "book";

// ─── Video Project ───────────────────────────────────────────────────────────

export interface VideoProject {
  id: string;
  userId: string;
  workspaceId: string | null;
  title: string;
  prompt: string | null;
  niche: VideoNiche;
  style: string | null;
  aspectRatio: AspectRatio;
  status: VideoProjectStatus;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  duration: number;
  resolution: string;
  voiceId: string;
  subtitleStyle: string;
  bgmUrl: string | null;
  configJson: string;
  renderProgress: number;
  createdAt: string;
  updatedAt: string;

  // Relations
  scenes?: VideoScene[];
  assets?: VideoAsset[];
  renderJobs?: VideoRenderJob[];
}

// ─── Video Scene ─────────────────────────────────────────────────────────────

export interface VideoScene {
  id: string;
  projectId: string;
  order: number;
  type: VideoSceneType;
  templateName: string | null;
  duration: number;
  narration: string | null;
  htmlContent: string | null;
  mediaUrl: string | null;
  overlayText: string | null;
  styleJson: string;
  transitionType: string | null;
  status: VideoSceneStatus;
  createdAt: string;
  updatedAt: string;
}

// ─── Video Asset ─────────────────────────────────────────────────────────────

export interface VideoAsset {
  id: string;
  projectId: string;
  type: VideoAssetType;
  name: string;
  url: string;
  mimeType: string | null;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  metadataJson: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Video Template ──────────────────────────────────────────────────────────

export interface VideoTemplate {
  id: string;
  name: string;
  category: VideoTemplateCategory;
  resolution: string;
  htmlTemplate: string;
  thumbnailUrl: string | null;
  description: string | null;
  isPremium: boolean;
  configJson: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Video Render Job ────────────────────────────────────────────────────────

export interface VideoRenderJob {
  id: string;
  projectId: string;
  jobType: RenderJobType;
  status: RenderJobStatus;
  progress: number;
  engineUrl: string | null;
  outputUrl: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  retryCount: number;
  maxRetries: number;
  configJson: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Video Creation Wizard Types ─────────────────────────────────────────────

export type VideoCreationStep =
  | "prompt"
  | "script"
  | "scenes"
  | "voice"
  | "render"
  | "preview";

export interface ScriptData {
  title: string;
  hook: string;
  scenes: ScriptScene[];
  cta: string;
  hashtags: string[];
}

export interface ScriptScene {
  id: number;
  narration: string;
  visual: string;
  duration: number;
  subtitle: string;
}

// ─── API Response Types ──────────────────────────────────────────────────────

export interface VideoProjectListResponse {
  projects: VideoProject[];
  total: number;
}

export interface VideoProjectCreateInput {
  title: string;
  prompt?: string;
  niche?: VideoNiche;
  style?: string;
  aspectRatio?: AspectRatio;
  voiceId?: string;
  subtitleStyle?: string;
  workspaceId?: string;
}

export interface VideoGenerateInput {
  prompt?: string;
  niche?: string;
  style?: string;
  aspectRatio?: string;
  voiceId?: string;
  subtitleStyle?: string;
}

export interface VideoRenderInput {
  projectId: string;
  jobType?: RenderJobType;
  config?: Record<string, unknown>;
}
