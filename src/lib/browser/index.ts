/**
 * GhostStudio AI v2.0 — Browser Automation Modules
 * Barrel export file
 */

// Re-export the main singleton instances
export { browserManager } from "./browser-manager";
export { livePreview } from "./live-preview";

// Re-export page interaction functions
export {
  navigate,
  click,
  type,
  scroll,
  select,
  wait,
  evaluate,
  getContent,
  getTitle,
  getUrl,
  waitForNavigation,
  goBack,
  goForward,
  refresh,
  hover,
  dispatchInteraction,
} from "./page-interactions";

// Re-export platform action functions
export {
  wordpressLogin,
  wordpressCreateDraft,
  wordpressPublish,
  tiktokLogin,
  tiktokUpload,
  youtubeStudioLogin,
  genericLogin,
  dispatchPlatformAction,
} from "./platform-actions";

// Re-export testing functions
export {
  runTest,
  runAccessibilityCheck,
  runVisualRegression,
  runLinkCheck,
  runPerformanceCheck,
  dispatchTest,
} from "./testing-runner";
