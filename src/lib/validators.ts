/**
 * Zod Validation Schemas for API Routes
 *
 * Every POST/PUT route must validate input with these schemas.
 * Ensures type safety, prevents mass assignment, and catches bad data early.
 */

import { z } from "zod";

// ─── Content Schemas ──────────────────────────────────────────────────────────

export const CreateContentSchema = z.object({
  workspaceId: z.string().min(1, "workspaceId is required"),
  title: z.string().min(1, "title is required").max(500, "title too long"),
  subtitle: z.string().max(500).optional(),
  slug: z.string().min(1, "slug is required").max(300, "slug too long"),
  angle: z.string().max(500).optional(),
  topic: z.string().max(200).optional(),
  sourceNotes: z.string().max(50000).optional(),
  sourceType: z.enum(["idea", "trend", "manual", "signal", "repurpose"]).default("idea"),
  masterMarkdown: z.string().max(200000).optional(),
});

export const UpdateContentSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  subtitle: z.string().max(500).optional(),
  slug: z.string().min(1).max(300).optional(),
  angle: z.string().max(500).optional(),
  topic: z.string().max(200).optional(),
  masterMarkdown: z.string().max(200000).optional(),
  summary: z.string().max(5000).optional(),
  sourceNotes: z.string().max(50000).optional(),
  sourceType: z.enum(["idea", "trend", "manual", "signal", "repurpose"]).optional(),
  status: z.enum([
    "idea", "draft", "editing", "seo_review", "ready",
    "scheduled", "published", "archived", "failed",
  ]).optional(),
  qualityScore: z.number().min(0).max(100).optional(),
  humanicScore: z.number().min(0).max(100).optional(),
  seoScore: z.number().min(0).max(100).optional(),
  trustScore: z.number().min(0).max(100).optional(),
  humanReviewRequired: z.boolean().optional(),
});

export const GenerateContentSchema = z.object({
  action: z.enum(["draft", "humanic", "seo", "repurpose", "tiktok"]).default("draft"),
  platform: z.string().max(50).optional(),
  options: z.record(z.string(), z.unknown()).default({}),
});

export const ScoreContentSchema = z.object({
  dimensions: z.object({
    quality: z.number().min(0).max(100).optional(),
    humanic: z.number().min(0).max(100).optional(),
    seo: z.number().min(0).max(100).optional(),
    trust: z.number().min(0).max(100).optional(),
  }).optional(),
  useAgent: z.boolean().default(true),
});

// ─── Video Schemas ────────────────────────────────────────────────────────────

export const CreateVideoSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  workspaceId: z.string().optional(),
  title: z.string().min(1, "title is required").max(300),
  prompt: z.string().max(5000).optional(),
  niche: z.enum([
    "general", "horror", "motivation", "crypto", "anime",
    "education", "tech", "storytelling", "documentary",
  ]).default("general"),
  style: z.string().max(100).optional(),
  aspectRatio: z.enum(["9:16", "1:1", "16:9"]).default("9:16"),
  voiceId: z.string().max(50).default("alloy"),
  subtitleStyle: z.string().max(50).default("default"),
  resolution: z.string().max(20).default("1080x1920"),
  configJson: z.record(z.string(), z.unknown()).default({}),
});

export const UpdateVideoSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  prompt: z.string().max(5000).optional(),
  niche: z.enum([
    "general", "horror", "motivation", "crypto", "anime",
    "education", "tech", "storytelling", "documentary",
  ]).optional(),
  style: z.string().max(100).optional(),
  aspectRatio: z.enum(["9:16", "1:1", "16:9"]).optional(),
  voiceId: z.string().max(50).optional(),
  subtitleStyle: z.string().max(50).optional(),
  resolution: z.string().max(20).optional(),
  configJson: z.record(z.string(), z.unknown()).optional(),
});

export const GenerateVideoSchema = z.object({
  pipeline: z.enum(["standard", "tiktok", "heatmap_clip"]).default("standard"),
  options: z.record(z.string(), z.unknown()).default({}),
});

// ─── Scheduler Schemas ────────────────────────────────────────────────────────

export const CreateSchedulerJobSchema = z.object({
  workspaceId: z.string().min(1, "workspaceId is required"),
  jobType: z.enum([
    "draft_job", "rewrite_job", "seo_job", "publish_job",
    "analytics_job", "retry_job", "memory_update_job",
    "repurpose_job", "scoring_job", "tagging_job",
    "script_job", "image_job", "voice_job", "video_compose_job",
    "heatmap_job", "clip_job", "strategy_job",
  ]),
  priority: z.number().min(1).max(10).default(5),
  payloadJson: z.record(z.string(), z.unknown()).default({}),
  nextAttempt: z.string().optional(),
});

export const ProcessSchedulerSchema = z.object({
  action: z.enum(["process", "retry_failed", "daily_cycle"]).default("process"),
  workspaceId: z.string().min(1, "workspaceId is required"),
  jobId: z.string().optional(),
});

// ─── Publish Schemas ──────────────────────────────────────────────────────────

export const PublishContentSchema = z.object({
  contentId: z.string().min(1, "contentId is required"),
  contentVariantId: z.string().optional(),
  platform: z.enum([
    "wordpress", "medium", "blogger", "substack", "beehiiv",
    "devto", "hashnode", "ghost", "mirror",
  ]),
  scheduledTime: z.string().optional(),
  isDryRun: z.boolean().default(false),
  action: z.enum(["draft", "publish", "schedule"]).default("publish"),
});

// ─── Memory Schemas ───────────────────────────────────────────────────────────

export const StoreMemorySchema = z.object({
  workspaceId: z.string().min(1, "workspaceId is required"),
  category: z.enum([
    "hook", "topic", "tone", "timing", "cta", "format",
    "platform", "monetization", "audience", "style",
    "video_style", "thumbnail", "hook_type", "visual_fatigue",
  ]),
  key: z.string().min(1, "key is required").max(200),
  value: z.string().min(1, "value is required").max(10000),
  score: z.number().min(0).max(100).default(0),
  source: z.enum(["analytics", "manual", "ai", "experiment"]).default("manual"),
  contextJson: z.record(z.string(), z.unknown()).optional(),
});

export const UpdateMemorySchema = z.object({
  value: z.string().min(1).max(10000).optional(),
  score: z.number().min(0).max(100).optional(),
  source: z.enum(["analytics", "manual", "ai", "experiment"]).optional(),
  contextJson: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().optional(),
});

// ─── Energy Schemas ───────────────────────────────────────────────────────────

export const TrackEnergySchema = z.object({
  workspaceId: z.string().min(1, "workspaceId is required"),
  category: z.enum([
    "topic_fatigue", "tone_fatigue", "publish_saturation",
    "audience_exhaustion", "hook_repetition", "visual_fatigue",
  ]),
  topic: z.string().max(200).optional(),
  fatigueScore: z.number().min(0).max(100).optional(),
  publishCount: z.number().min(0).optional(),
  action: z.enum(["track", "check", "status", "schedule"]).default("track"),
});

// ─── Analytics Schemas ────────────────────────────────────────────────────────

export const RecordAnalyticsSchema = z.object({
  workspaceId: z.string().min(1, "workspaceId is required"),
  contentId: z.string().optional(),
  platform: z.string().max(50).optional(),
  metricType: z.enum([
    "views", "clicks", "ctr", "opens", "shares",
    "conversions", "revenue", "read_time", "video_views", "clip_saves",
  ]),
  metricValue: z.number().default(0),
  rawPayload: z.record(z.string(), z.unknown()).optional(),
  source: z.enum(["auto", "manual", "api"]).default("auto"),
});

// ─── Heatmap & Clip Schemas ───────────────────────────────────────────────────

export const CreateHeatmapSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  workspaceId: z.string().optional(),
  videoUrl: z.string().min(1, "videoUrl is required").url("Must be a valid URL"),
  resolution: z.enum(["720p", "1080p", "4k"]).default("1080p"),
  outputFormat: z.enum(["mp4", "webm"]).default("mp4"),
  metadataJson: z.record(z.string(), z.unknown()).default({}),
});

export const GenerateClipSchema = z.object({
  jobId: z.string().min(1, "jobId is required"),
  cropMode: z.enum(["center", "split_left", "split_right"]).default("center"),
  outputRatio: z.enum(["9:16", "1:1", "16:9"]).default("9:16"),
  generateSubtitles: z.boolean().default(true),
});

// ─── TikTok Campaign Schemas ──────────────────────────────────────────────────

export const CreateTikTokCampaignSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  workspaceId: z.string().optional(),
  name: z.string().min(1, "name is required").max(200),
  campaignType: z.enum(["affiliate", "brand_collab", "organic_boost", "viral_clip"]).default("affiliate"),
  productId: z.string().max(100).optional(),
  productTitle: z.string().max(300).optional(),
  affiliateLink: z.string().max(500).optional(),
  targetAudience: z.string().max(1000).optional(),
  hashtags: z.array(z.string().max(100)).max(30).default([]),
  sounds: z.array(z.string().max(200)).max(10).default([]),
  contentPillars: z.array(z.string().max(200)).max(10).default([]),
  postingSchedule: z.record(z.string(), z.unknown()).default({}),
  budgetCents: z.number().min(0).default(0),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// ─── Review Schemas ───────────────────────────────────────────────────────────

export const SubmitReviewSchema = z.object({
  contentId: z.string().min(1, "contentId is required"),
  workspaceId: z.string().min(1, "workspaceId is required"),
  reviewType: z.enum(["editorial", "quality", "voice_alignment", "accuracy", "full"]).default("full"),
  options: z.record(z.string(), z.unknown()).default({}),
});

// ─── Trends Schemas ───────────────────────────────────────────────────────────

export const GetTrendsSchema = z.object({
  niche: z.string().max(100).optional(),
  platform: z.enum(["tiktok", "youtube", "twitter", "reddit", "general"]).default("general"),
  limit: z.number().min(1).max(50).default(10),
});

// ─── Helper: Format Zod errors for API responses ─────────────────────────────

export function formatZodErrors(error: z.ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".") || "_root";
    if (!errors[path]) errors[path] = [];
    errors[path].push(issue.message);
  }
  return errors;
}
