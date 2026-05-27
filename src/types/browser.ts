// ────────────────────────────────────────────────────────────────────────────────
// Browser Automation Types
// GhostStudio AI v2.0
// ────────────────────────────────────────────────────────────────────────────────

// ─── Enums / Union Types ─────────────────────────────────────────────────────

export type BrowserAction =
  | "click"
  | "type"
  | "scroll"
  | "select"
  | "wait"
  | "hover"
  | "screenshot"
  | "navigate"
  | "evaluate"
  | "getContent"
  | "getTitle"
  | "getUrl"
  | "waitForNavigation"
  | "goBack"
  | "goForward"
  | "refresh";

export type BrowserSessionStatus =
  | "connected"
  | "disconnected"
  | "error"
  | "idle";

export type PlatformActionType =
  | "wordpress-login"
  | "wordpress-create-draft"
  | "wordpress-publish"
  | "tiktok-login"
  | "tiktok-upload"
  | "youtube-studio-login"
  | "generic-login";

export type TestType =
  | "accessibility"
  | "visual-regression"
  | "link-check"
  | "performance"
  | "custom";

// ─── Browser Session ─────────────────────────────────────────────────────────

export interface BrowserSession {
  id: string;
  url: string;
  headless: boolean;
  viewport: { width: number; height: number };
  status: BrowserSessionStatus;
  platform?: string;
  userId?: string; // Owner of this session — used for authorization
  createdAt: string;
  lastActivity: string;
}

export interface CreateSessionOptions {
  platform?: string;
  headless?: boolean;
  viewport?: { width: number; height: number };
  userAgent?: string;
  userId?: string; // Track which user created this session
}

// ─── Browser Status ──────────────────────────────────────────────────────────

export interface BrowserStatus {
  active: boolean;
  pageCount: number;
  sessions: BrowserSession[];
  uptime: number;
  maxInstances: number;
  idleTimeoutMs: number;
}

// ─── Interaction ─────────────────────────────────────────────────────────────

export interface InteractionInput {
  action: BrowserAction;
  sessionId: string;
  selector?: string;
  value?: string;
  url?: string;
  timeout?: number;
  direction?: "up" | "down" | "left" | "right";
  amount?: number;
  delay?: number;
  clear?: boolean;
  waitUntil?: "load" | "domcontentloaded" | "networkidle0" | "networkidle2";
  expression?: string;
}

export interface InteractionResult {
  success: boolean;
  action: BrowserAction;
  selector?: string;
  value?: string;
  data?: unknown;
  error?: string;
  screenshot?: string; // Base64 encoded
  timestamp: string;
}

// ─── Screenshot ──────────────────────────────────────────────────────────────

export interface ScreenshotOptions {
  sessionId: string;
  selector?: string;
  fullPage?: boolean;
  format?: "png" | "jpeg" | "webp";
  quality?: number;
}

export interface ScreenshotResult {
  screenshot: string; // Base64 encoded
  url: string;
  title: string;
  timestamp: string;
  viewport: { width: number; height: number };
  format: string;
  fullPage: boolean;
}

// ─── Live Preview ────────────────────────────────────────────────────────────

export interface LivePreviewState {
  url: string;
  title: string;
  screenshot: string; // Base64 encoded
  timestamp: string;
  viewport: { width: number; height: number };
}

export interface StreamConfig {
  fps?: number; // 1-2 fps recommended
  quality?: number; // JPEG quality 1-100
  format?: "jpeg" | "png";
}

// ─── Testing ─────────────────────────────────────────────────────────────────

export interface TestConfig {
  name: string;
  type: TestType;
  url?: string;
  steps?: TestStep[];
  baselineScreenshot?: string; // Base64 for visual regression
  options?: Record<string, unknown>;
}

export interface TestCase {
  name: string;
  steps: TestStep[];
}

export interface TestStep {
  action: BrowserAction;
  selector?: string;
  value?: string;
  url?: string;
  timeout?: number;
}

export interface TestResult {
  name: string;
  type: TestType;
  passed: boolean;
  steps?: TestStepResult[];
  durationMs: number;
  error?: string;
  details?: Record<string, unknown>;
}

export interface TestStepResult {
  action: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

export interface AccessibilityIssue {
  type: "error" | "warning" | "info";
  rule: string;
  description: string;
  selector?: string;
  impact: "critical" | "serious" | "moderate" | "minor";
}

export interface PerformanceMetrics {
  firstContentfulPaint: number;
  domContentLoaded: number;
  loadComplete: number;
  totalTransferSize: number;
  totalRequests: number;
  javascriptHeapUsed: number;
  timestamp: string;
}

export interface LinkCheckResult {
  url: string;
  status: number | "error";
  ok: boolean;
  error?: string;
}

// ─── Platform Actions ────────────────────────────────────────────────────────

export interface PlatformActionInput {
  action: PlatformActionType;
  sessionId: string;
  params: Record<string, unknown>;
}

export interface PlatformActionResult {
  success: boolean;
  platform: string;
  action: string;
  result?: Record<string, unknown>;
  error?: string;
  screenshot?: string;
  timestamp: string;
}

export interface WordPressLoginParams {
  url: string;
  username: string;
  password: string;
}

export interface WordPressCreateDraftParams {
  title: string;
  content: string;
  tags?: string[];
}

export interface WordPressPublishParams {
  postId: string;
}

export interface TikTokLoginParams {
  username: string;
  password: string;
}

export interface TikTokUploadParams {
  videoPath: string;
  caption: string;
  tags?: string[];
}

export interface YouTubeStudioLoginParams {
  email: string;
  password: string;
}

export interface GenericLoginParams {
  url: string;
  usernameSelector: string;
  passwordSelector: string;
  submitSelector: string;
  username: string;
  password: string;
}
