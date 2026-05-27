// ────────────────────────────────────────────────────────────────────────────────
// Content Types — Matching Prisma Schema exactly
// GhostStudio AI v2.0
// ────────────────────────────────────────────────────────────────────────────────

// ─── Enums / Union Types ─────────────────────────────────────────────────────

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

export type ContentSourceType =
  | "idea"
  | "trend"
  | "manual"
  | "signal"
  | "repurpose";

export type Platform =
  | "wordpress"
  | "medium"
  | "blogger"
  | "substack"
  | "beehiiv"
  | "devto"
  | "hashnode"
  | "ghost"
  | "mirror";

export type VariantType =
  | "full"
  | "summary"
  | "thread"
  | "teaser"
  | "newsletter";

export type VariantStatus =
  | "pending"
  | "ready"
  | "published"
  | "failed";

export type PublishJobStatus =
  | "queued"
  | "processing"
  | "published"
  | "failed"
  | "retrying";

export type SchedulerJobStatus =
  | "pending"
  | "locked"
  | "running"
  | "completed"
  | "failed"
  | "dead_letter";

export type SchedulerJobType =
  | "draft_job"
  | "rewrite_job"
  | "seo_job"
  | "publish_job"
  | "analytics_job"
  | "retry_job"
  | "memory_update_job"
  | "video_render_job"
  | "heatmap_clip_job";

export type MetricType =
  | "views"
  | "clicks"
  | "ctr"
  | "opens"
  | "shares"
  | "conversions"
  | "revenue"
  | "read_time"
  | "video_views"
  | "clip_saves";

export type MetricSource = "auto" | "manual" | "api";

export type TagCategory =
  | "topic"
  | "format"
  | "niche"
  | "tone"
  | "series";

// ─── Content Item ────────────────────────────────────────────────────────────

export interface ContentItem {
  id: string;
  workspaceId: string;
  title: string;
  subtitle: string | null;
  slug: string;
  angle: string | null;
  topic: string | null;
  status: ContentStatus;
  masterMarkdown: string | null;
  summary: string | null;
  sourceNotes: string | null;
  sourceType: ContentSourceType;
  qualityScore: number;
  humanicScore: number;
  seoScore: number;
  trustScore: number;
  humanReviewRequired: boolean;
  version: number;
  parentContentId: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;

  // Relations
  variants?: ContentVariant[];
  publishJobs?: PublishJob[];
  analyticsEvents?: AnalyticsEvent[];
  seoData?: SeoData | null;
  contentTags?: ContentTag[];

  // Counts
  _count?: {
    variants: number;
    publishJobs: number;
    analyticsEvents: number;
  };
}

// ─── Content Variant ─────────────────────────────────────────────────────────

export interface ContentVariant {
  id: string;
  contentId: string;
  platform: Platform;
  variantType: VariantType;
  title: string | null;
  body: string | null;
  metadataJson: string;
  status: VariantStatus;
  createdAt: string;
  updatedAt: string;

  // Relations
  publishJobs?: PublishJob[];
}

// ─── SEO Data ────────────────────────────────────────────────────────────────

export interface SeoData {
  id: string;
  contentId: string;
  metaTitle: string | null;
  metaDescription: string | null;
  focusKeyword: string | null;
  secondaryKeywords: string | null;
  slug: string | null;
  headingStructure: string | null;
  internalLinks: string | null;
  schemaMarkup: string | null;
  readabilityScore: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Content Tag ─────────────────────────────────────────────────────────────

export interface ContentTag {
  id: string;
  contentId: string;
  tag: string;
  category: TagCategory;
  createdAt: string;
}

// ─── Publish Job ─────────────────────────────────────────────────────────────

export interface PublishJob {
  id: string;
  workspaceId: string;
  contentId: string;
  contentVariantId: string | null;
  platform: Platform;
  status: PublishJobStatus;
  scheduledTime: string | null;
  publishedTime: string | null;
  retryCount: number;
  maxRetries: number;
  lastError: string | null;
  responsePayload: string | null;
  isDryRun: boolean;
  createdAt: string;
  updatedAt: string;

  // Relations
  contentItem?: ContentItem;
  contentVariant?: ContentVariant | null;
}

// ─── Scheduler Job ───────────────────────────────────────────────────────────

export interface SchedulerJob {
  id: string;
  workspaceId: string;
  jobType: SchedulerJobType;
  priority: number;
  payloadJson: string;
  status: SchedulerJobStatus;
  nextAttempt: string;
  lockedBy: string | null;
  lockUntil: string | null;
  retryCount: number;
  maxRetries: number;
  lastError: string | null;
  resultJson: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Queue Status ────────────────────────────────────────────────────────────

export interface QueueStatus {
  pending: number;
  locked: number;
  running: number;
  completed: number;
  failed: number;
  dead_letter: number;
  total: number;
}

// ─── Analytics Event ─────────────────────────────────────────────────────────

export interface AnalyticsEvent {
  id: string;
  workspaceId: string;
  contentId: string | null;
  platform: string | null;
  metricType: MetricType;
  metricValue: number;
  capturedAt: string;
  rawPayload: string | null;
  source: MetricSource;
  createdAt: string;

  // Relations
  contentItem?: ContentItem | null;
}

// ─── Analytics Summary ───────────────────────────────────────────────────────

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
    platform: string | null;
    capturedAt: string;
    contentItem: { id: string; title: string } | null;
  }[];
}

// ─── Content Scores ──────────────────────────────────────────────────────────

export interface ContentScores {
  quality: number;
  humanic: number;
  seo: number;
  trust: number;
  composite: number;
}

// ─── API Response Types ──────────────────────────────────────────────────────

export interface ContentListResponse {
  items: ContentItem[];
  total: number;
}

export interface ContentCreateInput {
  workspaceId: string;
  title: string;
  subtitle?: string;
  topic?: string;
  angle?: string;
  sourceNotes?: string;
  sourceType?: ContentSourceType;
}

export interface ContentUpdateInput {
  title?: string;
  subtitle?: string;
  topic?: string;
  angle?: string;
  status?: ContentStatus;
  masterMarkdown?: string;
  sourceNotes?: string;
}

export interface ContentGenerateInput {
  agents?: string[];
  autoAdvance?: boolean;
}

export interface ContentScoreInput {
  dimensions?: ("quality" | "humanic" | "seo" | "trust")[];
}

export interface PublishInput {
  contentId: string;
  platform: Platform;
  contentVariantId?: string;
  scheduledTime?: string;
  isDryRun?: boolean;
}

export interface SchedulerEnqueueInput {
  workspaceId: string;
  jobType: SchedulerJobType;
  priority?: number;
  payloadJson?: string;
}

export interface SchedulerProcessInput {
  jobType?: SchedulerJobType;
  limit?: number;
}

// ─── Memory Entry ────────────────────────────────────────────────────────────

export type MemoryCategory =
  | "hook"
  | "topic"
  | "tone"
  | "timing"
  | "cta"
  | "format"
  | "platform"
  | "monetization"
  | "audience"
  | "style"
  | "video_style"
  | "thumbnail"
  | "hook_type";

export type MemorySource = "analytics" | "manual" | "ai" | "experiment";

export interface MemoryEntry {
  id: string;
  workspaceId: string;
  category: MemoryCategory;
  key: string;
  value: string;
  score: number;
  source: MemorySource;
  contextJson: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Energy Entry ────────────────────────────────────────────────────────────

export type EnergyCategory =
  | "topic_fatigue"
  | "tone_fatigue"
  | "publish_saturation"
  | "audience_exhaustion"
  | "hook_repetition"
  | "visual_fatigue";

export type EnergyStatus = "fresh" | "warning" | "exhausted";

export interface EnergyEntry {
  id: string;
  workspaceId: string;
  category: EnergyCategory;
  topic: string | null;
  fatigueScore: number;
  publishCount: number;
  lastResetAt: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Energy Report ───────────────────────────────────────────────────────────

export interface EnergyReport {
  overallEnergy: number;
  canPublish: boolean;
  entries: EnergyEntry[];
  warnings: string[];
}

// ─── Fatigue Entry (alias) ───────────────────────────────────────────────────

export type FatigueEntry = EnergyEntry;

// ─── Subscription ────────────────────────────────────────────────────────────

export type SubscriptionPlan = "free" | "creator" | "pro" | "agency";

export type SubscriptionStatus = "active" | "cancelled" | "expired" | "past_due";

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  currentPeriodStart: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}
