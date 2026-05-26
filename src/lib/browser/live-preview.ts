// Live Preview — Real-time browser streaming via WebSocket
// Captures viewport screenshots at throttled frame rate and streams to clients

import { browserManager } from "./browser-manager";
import type { LivePreviewState, StreamConfig } from "@/types/browser";

interface StreamSession {
  sessionId: string;
  intervalId: NodeJS.Timeout | null;
  config: Required<StreamConfig>;
  active: boolean;
  lastFrame: string | null;
  listeners: Set<(frame: string) => void>;
}

class LivePreviewManager {
  private streams = new Map<string, StreamSession>();

  /**
   * Start streaming viewport frames for a session
   */
  async startStreaming(
    sessionId: string,
    config: StreamConfig = {}
  ): Promise<{ started: boolean; error?: string }> {
    if (!browserManager.hasSession(sessionId)) {
      return { started: false, error: `Session not found: ${sessionId}` };
    }

    // Stop existing stream if any
    if (this.streams.has(sessionId)) {
      this.stopStreaming(sessionId);
    }

    const fullConfig: Required<StreamConfig> = {
      fps: config.fps || 1, // Default 1 fps
      quality: config.quality || 60, // JPEG quality
      format: config.format || "jpeg",
    };

    // Clamp fps to 1-2 to avoid overwhelming the connection
    fullConfig.fps = Math.min(Math.max(fullConfig.fps, 1), 2);

    const streamSession: StreamSession = {
      sessionId,
      intervalId: null,
      config: fullConfig,
      active: true,
      lastFrame: null,
      listeners: new Set(),
    };

    // Capture initial frame
    await this.captureFrame(sessionId);

    // Set up frame capture interval
    const intervalMs = Math.round(1000 / fullConfig.fps);
    streamSession.intervalId = setInterval(async () => {
      if (streamSession.active) {
        await this.captureFrame(sessionId);
      }
    }, intervalMs);

    this.streams.set(sessionId, streamSession);

    return { started: true };
  }

  /**
   * Stop streaming for a session
   */
  stopStreaming(sessionId: string): void {
    const stream = this.streams.get(sessionId);
    if (stream) {
      stream.active = false;
      if (stream.intervalId) {
        clearInterval(stream.intervalId);
      }
      stream.listeners.clear();
      this.streams.delete(sessionId);
    }
  }

  /**
   * Get current viewport snapshot as base64 image
   */
  async getSnapshot(sessionId: string): Promise<LivePreviewState | null> {
    if (!browserManager.hasSession(sessionId)) {
      return null;
    }

    try {
      const page = browserManager.getPage(sessionId);
      const url = page.url();
      const title = await page.title();
      const viewport = page.viewport();

      const screenshotBuf = await page.screenshot({
        type: "jpeg",
        quality: 70,
      });
      const screenshot = Buffer.isBuffer(screenshotBuf)
        ? screenshotBuf.toString("base64")
        : String(screenshotBuf);

      return {
        url,
        title,
        screenshot,
        timestamp: new Date().toISOString(),
        viewport: viewport || { width: 1920, height: 1080 },
      };
    } catch (error) {
      console.error(`Snapshot capture failed for ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * Add a listener for frame updates
   */
  addFrameListener(
    sessionId: string,
    listener: (frame: string) => void
  ): boolean {
    const stream = this.streams.get(sessionId);
    if (!stream) return false;
    stream.listeners.add(listener);
    return true;
  }

  /**
   * Remove a frame listener
   */
  removeFrameListener(
    sessionId: string,
    listener: (frame: string) => void
  ): void {
    const stream = this.streams.get(sessionId);
    if (stream) {
      stream.listeners.delete(listener);
    }
  }

  /**
   * Get the last captured frame for a session
   */
  getLastFrame(sessionId: string): string | null {
    const stream = this.streams.get(sessionId);
    return stream?.lastFrame ?? null;
  }

  /**
   * Check if streaming is active for a session
   */
  isStreaming(sessionId: string): boolean {
    const stream = this.streams.get(sessionId);
    return stream?.active ?? false;
  }

  /**
   * Get all active streaming session IDs
   */
  getActiveStreams(): string[] {
    return Array.from(this.streams.entries())
      .filter(([, stream]) => stream.active)
      .map(([id]) => id);
  }

  /**
   * Stop all streaming sessions
   */
  stopAll(): void {
    for (const [sessionId] of this.streams) {
      this.stopStreaming(sessionId);
    }
  }

  /**
   * Capture a single frame for a session
   */
  private async captureFrame(sessionId: string): Promise<void> {
    try {
      if (!browserManager.hasSession(sessionId)) {
        this.stopStreaming(sessionId);
        return;
      }

      const page = browserManager.getPage(sessionId);
      const stream = this.streams.get(sessionId);
      if (!stream || !stream.active) return;

      const screenshotBuf = await page.screenshot({
        type: stream.config.format as "jpeg" | "png",
        quality:
          stream.config.format === "jpeg" ? stream.config.quality : undefined,
      });

      const frame = Buffer.isBuffer(screenshotBuf)
        ? screenshotBuf.toString("base64")
        : String(screenshotBuf);

      stream.lastFrame = frame;

      // Notify all listeners
      for (const listener of stream.listeners) {
        try {
          listener(frame);
        } catch (err) {
          console.error("Frame listener error:", err);
        }
      }
    } catch (error) {
      // Don't stop streaming on a single frame error
      console.error(`Frame capture failed for ${sessionId}:`, error);
    }
  }
}

// Singleton
export const livePreview = new LivePreviewManager();
