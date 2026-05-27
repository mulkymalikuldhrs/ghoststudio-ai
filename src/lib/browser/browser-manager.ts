// Browser Manager — Puppeteer session pool for browser automation
// Manages browser instances, session lifecycle, idle cleanup, and health checks

import puppeteer, { type Browser, type Page } from "puppeteer";
import { randomUUID } from "crypto";
import type {
  BrowserSession,
  BrowserSessionStatus,
  CreateSessionOptions,
} from "@/types/browser";

interface SessionEntry {
  id: string;
  browser: Browser;
  page: Page;
  session: BrowserSession;
  lastActivity: Date;
  createdAt: Date;
  userId?: string; // Track which user created this session
}

class BrowserManager {
  private sessions = new Map<string, SessionEntry>();
  private maxInstances: number;
  private idleTimeoutMs: number;
  private headlessDefault: boolean;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private startedAt = new Date();

  constructor() {
    this.maxInstances = parseInt(
      process.env.PUPPETEER_MAX_INSTANCES || "5",
      10
    );
    this.idleTimeoutMs = parseInt(
      process.env.PUPPETEER_IDLE_TIMEOUT || "300000",
      10
    );
    this.headlessDefault = process.env.PUPPETEER_HEADLESS !== "false";
    this.startCleanupInterval();
  }

  /**
   * Create a new browser session, launch browser, create page, return session ID
   */
  async createSession(options: CreateSessionOptions = {}): Promise<BrowserSession> {
    if (this.sessions.size >= this.maxInstances) {
      throw new Error(
        `Maximum browser instances reached (${this.maxInstances}). Close an existing session first.`
      );
    }

    const id = randomUUID();
    const headless = options.headless ?? this.headlessDefault;
    const viewport = options.viewport ?? { width: 1920, height: 1080 };

    const browser = await puppeteer.launch({
      headless,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-features=IsolateOrigins,site-per-process",
        "--window-size=1920,1080",
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    });

    const page = await browser.newPage();
    await page.setViewport(viewport);

    // Stealth: Override navigator.webdriver
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => false,
      });
      // Override plugins to look more human
      Object.defineProperty(navigator, "plugins", {
        get: () => [1, 2, 3, 4, 5],
      });
      // Override languages
      Object.defineProperty(navigator, "languages", {
        get: () => ["en-US", "en"],
      });
    });

    // Set user agent
    const userAgent =
      options.userAgent ||
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    await page.setUserAgent(userAgent);

    const now = new Date();
    const session: BrowserSession = {
      id,
      url: "about:blank",
      headless,
      viewport,
      status: "connected",
      platform: options.platform,
      userId: options.userId,
      createdAt: now.toISOString(),
      lastActivity: now.toISOString(),
    };

    const entry: SessionEntry = {
      id,
      browser,
      page,
      session,
      lastActivity: now,
      createdAt: now,
      userId: options.userId,
    };

    this.sessions.set(id, entry);
    return { ...session };
  }

  /**
   * Get session by ID
   */
  getSession(id: string): SessionEntry | undefined {
    return this.sessions.get(id);
  }

  /**
   * Get page for a session
   */
  getPage(id: string): Page {
    const entry = this.sessions.get(id);
    if (!entry) {
      throw new Error(`Session not found: ${id}`);
    }
    entry.lastActivity = new Date();
    entry.session.lastActivity = new Date().toISOString();
    return entry.page;
  }

  /**
   * Get browser for a session
   */
  getBrowser(id: string): Browser {
    const entry = this.sessions.get(id);
    if (!entry) {
      throw new Error(`Session not found: ${id}`);
    }
    return entry.browser;
  }

  /**
   * Update session URL and status
   */
  updateSession(id: string, updates: Partial<Pick<BrowserSession, "url" | "status">>): void {
    const entry = this.sessions.get(id);
    if (!entry) return;
    if (updates.url !== undefined) entry.session.url = updates.url;
    if (updates.status !== undefined) entry.session.status = updates.status;
    entry.lastActivity = new Date();
    entry.session.lastActivity = new Date().toISOString();
  }

  /**
   * Close a specific session and cleanup
   */
  async closeSession(id: string): Promise<boolean> {
    const entry = this.sessions.get(id);
    if (!entry) return false;

    try {
      if (entry.page && !entry.page.isClosed()) {
        await entry.page.close().catch(() => {});
      }
      if (entry.browser && entry.browser.connected) {
        await entry.browser.close().catch(() => {});
      }
    } catch (error) {
      console.error(`Error closing session ${id}:`, error);
    } finally {
      this.sessions.delete(id);
    }

    return true;
  }

  /**
   * Close all sessions and cleanup
   */
  async closeAllSessions(): Promise<number> {
    const ids = Array.from(this.sessions.keys());
    let closed = 0;

    for (const id of ids) {
      const success = await this.closeSession(id);
      if (success) closed++;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    return closed;
  }

  /**
   * Get session status / health check
   */
  async getSessionStatus(id: string): Promise<BrowserSession | null> {
    const entry = this.sessions.get(id);
    if (!entry) return null;

    let status: BrowserSessionStatus = "connected";

    try {
      // Check if browser is still connected
      if (!entry.browser.connected) {
        status = "disconnected";
      } else if (entry.page.isClosed()) {
        status = "error";
      } else {
        // Try a lightweight evaluation to confirm page is responsive
        await Promise.race([
          entry.page.evaluate(() => true),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Health check timeout")), 5000)
          ),
        ]);
      }
    } catch {
      status = "error";
    }

    entry.session.status = status;
    return { ...entry.session };
  }

  /**
   * List all active sessions
   */
  listSessions(): BrowserSession[] {
    return Array.from(this.sessions.values()).map((entry) => ({
      ...entry.session,
    }));
  }

  /**
   * Get pool statistics
   */
  getStatus(): {
    activeSessions: number;
    maxInstances: number;
    idleTimeoutMs: number;
    uptime: number;
    sessions: BrowserSession[];
  } {
    return {
      activeSessions: this.sessions.size,
      maxInstances: this.maxInstances,
      idleTimeoutMs: this.idleTimeoutMs,
      uptime: Date.now() - this.startedAt.getTime(),
      sessions: this.listSessions(),
    };
  }

  /**
   * Start automatic cleanup of idle sessions
   */
  private startCleanupInterval(): void {
    // Check every 60 seconds for idle sessions
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleSessions().catch((err) =>
        console.error("Idle cleanup error:", err)
      );
    }, 60_000);
  }

  /**
   * Cleanup sessions that have exceeded the idle timeout
   */
  private async cleanupIdleSessions(): Promise<number> {
    const now = new Date();
    let cleaned = 0;

    for (const [id, entry] of this.sessions) {
      const idleMs = now.getTime() - entry.lastActivity.getTime();
      if (idleMs > this.idleTimeoutMs) {
        console.log(
          `Closing idle session ${id} (idle for ${Math.round(idleMs / 1000)}s)`
        );
        await this.closeSession(id);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Check if a session exists
   */
  hasSession(id: string): boolean {
    return this.sessions.has(id);
  }

  /**
   * Check if a session belongs to a specific user
   */
  isSessionOwner(sessionId: string, userId: string): boolean {
    const entry = this.sessions.get(sessionId);
    if (!entry) return false;
    // If no userId was set on session (legacy), allow access
    if (!entry.userId) return true;
    return entry.userId === userId;
  }

  /**
   * Get session count
   */
  get sessionCount(): number {
    return this.sessions.size;
  }
}

// Singleton instance
export const browserManager = new BrowserManager();
