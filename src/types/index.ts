// ────────────────────────────────────────────────────────────────────────────────
// Types Barrel Export
// GhostStudio AI v2.0
// ────────────────────────────────────────────────────────────────────────────────

// Content types
export type {
  ContentStatus,
  ContentSourceType,
  Platform,
  VariantType,
  VariantStatus,
  PublishJobStatus,
  SchedulerJobStatus,
  SchedulerJobType,
  MetricType,
  MetricSource,
  TagCategory,
  MemoryCategory,
  MemorySource,
  EnergyCategory,
  EnergyStatus,
  SubscriptionPlan,
  SubscriptionStatus,
} from "./content";

export type {
  ContentItem,
  ContentVariant,
  SeoData,
  ContentTag,
  PublishJob,
  SchedulerJob,
  QueueStatus,
  AnalyticsEvent,
  AnalyticsSummary,
  ContentScores,
  ContentListResponse,
  ContentCreateInput,
  ContentUpdateInput,
  ContentGenerateInput,
  ContentScoreInput,
  PublishInput,
  SchedulerEnqueueInput,
  SchedulerProcessInput,
  MemoryEntry,
  EnergyEntry,
  EnergyReport,
  FatigueEntry,
  Subscription,
} from "./content";

// Video types
export type {
  VideoProjectStatus,
  VideoNiche,
  AspectRatio,
  VideoSceneType,
  VideoSceneStatus,
  VideoAssetType,
  RenderJobType,
  RenderJobStatus,
  VideoTemplateCategory,
  VideoCreationStep,
} from "./video";

export type {
  VideoProject,
  VideoScene,
  VideoAsset,
  VideoTemplate,
  VideoRenderJob,
  ScriptData,
  ScriptScene,
  VideoProjectListResponse,
  VideoProjectCreateInput,
  VideoGenerateInput,
  VideoRenderInput,
} from "./video";

// Heatmap types
export type {
  HeatmapClipJobStatus,
  ClipOutputFormat,
  ClipResolution,
} from "./heatmap";

export type {
  HeatmapClipJob,
  HeatmapDataPoint,
  HeatmapSegment,
  TranscriptSegment,
  ClipSuggestion,
  HeatmapJobListResponse,
  HeatmapJobCreateInput,
  ClipInput,
} from "./heatmap";

// Browser types
export type {
  BrowserAction,
  BrowserSessionStatus,
} from "./browser";

export type {
  BrowserSession,
  BrowserStatus,
  InteractionInput,
  InteractionResult,
  ScreenshotOptions,
  ScreenshotResult,
  LivePreviewState,
  TestCase,
  TestStep,
  TestResult,
  TestStepResult,
  PlatformActionInput,
  PlatformActionResult,
} from "./browser";

// Agent types
export type {
  AgentType,
  AgentCategory,
  AgentTaskStatus,
} from "./agents";

export type {
  AgentInfo,
  AgentTask,
  PipelineStage,
} from "./agents";

export {
  CONTENT_PIPELINE,
  VIDEO_PIPELINE,
  AGENT_REGISTRY,
} from "./agents";
