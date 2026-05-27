// ────────────────────────────────────────────────────────────────────────────────
// Heatmap Types — Matching Prisma Schema exactly
// GhostStudio AI v2.0
// ────────────────────────────────────────────────────────────────────────────────

// ─── Enums / Union Types ─────────────────────────────────────────────────────

export type HeatmapClipJobStatus =
  | "pending"
  | "downloading"
  | "analyzing"
  | "clipping"
  | "completed"
  | "failed";

export type ClipOutputFormat = "mp4" | "webm";

export type ClipResolution = "720p" | "1080p" | "4k";

// ─── Heatmap Clip Job ────────────────────────────────────────────────────────

export interface HeatmapClipJob {
  id: string;
  userId: string;
  videoUrl: string;
  videoId: string | null;
  videoTitle: string | null;
  channelName: string | null;
  status: HeatmapClipJobStatus;
  heatmapData: string | null;
  transcriptData: string | null;
  clipStart: number | null;
  clipEnd: number | null;
  clipReason: string | null;
  peakScore: number;
  outputUrl: string | null;
  outputFormat: ClipOutputFormat;
  resolution: ClipResolution;
  errorMessage: string | null;
  progress: number;
  metadataJson: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Heatmap Data ────────────────────────────────────────────────────────────

export interface HeatmapDataPoint {
  time: number; // seconds
  retention: number; // 0-100
}

export interface HeatmapSegment {
  startTime: number;
  endTime: number;
  avgRetention: number;
  peakRetention: number;
  label: "hook" | "build" | "peak" | "decline" | "cta";
}

// ─── Transcript ──────────────────────────────────────────────────────────────

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  confidence: number;
}

// ─── Clip Suggestions ────────────────────────────────────────────────────────

export interface ClipSuggestion {
  startTime: number;
  endTime: number;
  reason: string;
  peakScore: number;
  estimatedViews: number;
  segment: HeatmapSegment;
}

// ─── API Response Types ──────────────────────────────────────────────────────

export interface HeatmapJobListResponse {
  jobs: HeatmapClipJob[];
  total: number;
}

export interface HeatmapJobCreateInput {
  videoUrl: string;
  outputFormat?: ClipOutputFormat;
  resolution?: ClipResolution;
}

export interface ClipInput {
  jobId: string;
  startTime: number;
  endTime: number;
  format?: ClipOutputFormat;
  resolution?: ClipResolution;
}
