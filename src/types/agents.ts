// ────────────────────────────────────────────────────────────────────────────────
// Agent Types
// GhostStudio AI v2.0
// ────────────────────────────────────────────────────────────────────────────────

// ─── Enums / Union Types ─────────────────────────────────────────────────────

export type AgentType =
  | "draft"
  | "humanic"
  | "seo"
  | "repurpose"
  | "scoring"
  | "tagging"
  | "script"
  | "image"
  | "voice"
  | "video_compose"
  | "heatmap"
  | "clip"
  | "publish"
  | "strategy"
  | "browser"
  | "memory"
  | "tiktok"
  | "thumbnail"
  | "caption"
  | "trend"
  | "review"
  | "format"
  | "summary"
  | "qa";

export type AgentCategory =
  | "content"
  | "video"
  | "analytics"
  | "automation";

export type AgentTaskStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed";

// ─── Agent Info ──────────────────────────────────────────────────────────────

export interface AgentInfo {
  type: AgentType;
  name: string;
  description: string;
  category: AgentCategory;
  icon?: string;
}

// ─── Agent Task ──────────────────────────────────────────────────────────────

export interface AgentTask {
  id: string;
  type: AgentType;
  priority: number;
  payload: Record<string, unknown>;
  status: AgentTaskStatus;
  result?: Record<string, unknown>;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

// ─── Pipeline ────────────────────────────────────────────────────────────────

export interface PipelineStage {
  agent: AgentType;
  label: string;
  description: string;
  icon?: string;
}

// ─── Pipeline Definitions ────────────────────────────────────────────────────

export const CONTENT_PIPELINE: PipelineStage[] = [
  { agent: "draft", label: "Draft", description: "Generate initial content", icon: "pen-tool" },
  { agent: "humanic", label: "Humanize", description: "Remove robotic patterns", icon: "user" },
  { agent: "seo", label: "SEO Optimize", description: "Optimize for search engines", icon: "search" },
  { agent: "scoring", label: "Score", description: "Evaluate quality (4 dimensions)", icon: "bar-chart" },
  { agent: "tagging", label: "Tag", description: "Add tags and categories", icon: "tag" },
  { agent: "publish", label: "Publish", description: "Distribute to platforms", icon: "send" },
];

export const VIDEO_PIPELINE: PipelineStage[] = [
  { agent: "script", label: "Script", description: "Write narration script", icon: "file-text" },
  { agent: "image", label: "Images", description: "Generate visual assets", icon: "image" },
  { agent: "voice", label: "Voice", description: "Generate TTS audio", icon: "mic" },
  { agent: "video_compose", label: "Compose", description: "Assemble final video", icon: "film" },
  { agent: "caption", label: "Captions", description: "Generate subtitles", icon: "subtitles" },
];

export const HEATMAP_PIPELINE: PipelineStage[] = [
  { agent: "heatmap", label: "Heatmap", description: "Analyze audience retention", icon: "activity" },
  { agent: "clip", label: "Clip", description: "Extract viral clips", icon: "scissors" },
  { agent: "caption", label: "Captions", description: "Generate subtitles for clips", icon: "subtitles" },
  { agent: "publish", label: "Publish", description: "Distribute clips to platforms", icon: "send" },
];

export const TIKTOK_PIPELINE: PipelineStage[] = [
  { agent: "trend", label: "Trend", description: "Find trending opportunities", icon: "trending-up" },
  { agent: "script", label: "Script", description: "Write TikTok script", icon: "file-text" },
  { agent: "tiktok", label: "TikTok", description: "Create TikTok variant", icon: "music" },
  { agent: "thumbnail", label: "Thumbnail", description: "Generate thumbnail", icon: "image" },
  { agent: "caption", label: "Captions", description: "Generate captions", icon: "subtitles" },
];

// ─── Agent Registry ──────────────────────────────────────────────────────────

export const AGENT_REGISTRY: AgentInfo[] = [
  // Content agents
  { type: "draft", name: "Draft Agent", description: "Generates initial content from ideas and notes", category: "content", icon: "pen-tool" },
  { type: "humanic", name: "Humanic Agent", description: "Removes AI-robotic patterns and humanizes text", category: "content", icon: "user" },
  { type: "seo", name: "SEO Agent", description: "Optimizes content for search engine performance", category: "content", icon: "search" },
  { type: "scoring", name: "Scoring Agent", description: "Evaluates quality across 4 dimensions", category: "content", icon: "bar-chart" },
  { type: "tagging", name: "Tagging Agent", description: "Auto-tags content with topics and categories", category: "content", icon: "tag" },
  { type: "repurpose", name: "Repurpose Agent", description: "Creates platform-specific content variants", category: "content", icon: "repeat" },
  { type: "strategy", name: "Strategy Agent", description: "Plans content strategy and scheduling", category: "content", icon: "compass" },
  { type: "publish", name: "Publish Agent", description: "Distributes content to platforms", category: "content", icon: "send" },
  { type: "review", name: "Review Agent", description: "AI editorial review for content quality and voice alignment", category: "content", icon: "check-circle" },
  { type: "format", name: "Format Agent", description: "Transforms content between formats and styles", category: "content", icon: "layout" },
  { type: "summary", name: "Summary Agent", description: "Generates concise summaries in multiple formats", category: "content", icon: "file-minus" },
  { type: "qa", name: "QA Agent", description: "Generates Q&A pairs from content", category: "content", icon: "help-circle" },

  // Video agents
  { type: "script", name: "Script Agent", description: "Writes narration scripts for videos", category: "video", icon: "file-text" },
  { type: "image", name: "Image Agent", description: "Generates visual assets and thumbnails", category: "video", icon: "image" },
  { type: "voice", name: "Voice Agent", description: "Generates text-to-speech audio", category: "video", icon: "mic" },
  { type: "video_compose", name: "Video Compose Agent", description: "Assembles final video from scenes", category: "video", icon: "film" },
  { type: "tiktok", name: "TikTok Agent", description: "Creates TikTok-optimized short-form video content", category: "video", icon: "music" },
  { type: "thumbnail", name: "Thumbnail Agent", description: "Generates thumbnail concepts for video platforms", category: "video", icon: "image" },
  { type: "caption", name: "Caption Agent", description: "Generates captions and subtitles in SRT/VTT formats", category: "video", icon: "subtitles" },

  // Analytics agents
  { type: "heatmap", name: "Heatmap Agent", description: "Analyzes YouTube audience retention", category: "analytics", icon: "activity" },
  { type: "clip", name: "Clip Agent", description: "Extracts viral clips from video peaks", category: "analytics", icon: "scissors" },
  { type: "memory", name: "Memory Agent", description: "Stores and retrieves performance memories", category: "analytics", icon: "database" },
  { type: "trend", name: "Trend Agent", description: "Detects and analyzes trending topics", category: "analytics", icon: "trending-up" },

  // Automation agents
  { type: "browser", name: "Browser Agent", description: "Automates browser interactions and testing", category: "automation", icon: "globe" },
];
