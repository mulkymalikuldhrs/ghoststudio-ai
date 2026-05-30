// Memory System — Reinforcement learning moat
// Stores: what worked, what failed, preferences, patterns
// Each cycle makes the next one better. That's the flywheel.

import { db } from "@/lib/db";

export interface MemoryQuery {
  workspaceId: string;
  category?: string;
  key?: string;
  minScore?: number;
  limit?: number;
}

export interface MemoryUpsert {
  workspaceId: string;
  category: string;
  key: string;
  value: string;
  score?: number;
  source?: string;
  contextJson?: Record<string, unknown>;
}

export interface MemoryInsight {
  category: string;
  topMemories: {
    key: string;
    value: string;
    score: number;
  }[];
  averageScore: number;
  totalEntries: number;
}

// Auto-decay result
export interface AutoDecayResult {
  decayed: number;
  deactivated: number;
}

// Memory categories used across the system
export const MEMORY_CATEGORIES = {
  hook: "hook",
  topic: "topic",
  tone: "tone",
  timing: "timing",
  cta: "cta",
  format: "format",
  platform: "platform",
  monetization: "monetization",
  audience: "audience",
  style: "style",
  video_style: "video_style",
  thumbnail: "thumbnail",
  hook_type: "hook_type",
  visual_fatigue: "visual_fatigue",
} as const;

// Auto-decay constants
const DECAY_THRESHOLD_DAYS = 30;
const DECAY_PER_WEEK = 1;
const DEACTIVATION_SCORE = 5;

// LRU cache constants
const MAX_CACHE_SIZE = 100;
const EVICT_COUNT = 20;

export class MemorySystem {
  private workspaceId: string;

  constructor(workspaceId: string) {
    this.workspaceId = workspaceId;
  }

  // Query memories
  async query(params: Omit<MemoryQuery, "workspaceId"> = {}): Promise<Record<string, unknown>[]> {
    const where: Record<string, unknown> = {
      workspaceId: this.workspaceId,
      isActive: true,
    };

    if (params.category) where.category = params.category;
    if (params.key) where.key = params.key;
    if (params.minScore) where.score = { gte: params.minScore };

    const entries = await db.memoryEntry.findMany({
      where,
      orderBy: { score: "desc" },
      take: params.limit || 50,
    });

    return entries;
  }

  // Store or update a memory
  async store(data: Omit<MemoryUpsert, "workspaceId">): Promise<Record<string, unknown>> {
    const entry = await db.memoryEntry.upsert({
      where: {
        workspaceId_category_key: {
          workspaceId: this.workspaceId,
          category: data.category,
          key: data.key,
        },
      },
      update: {
        value: data.value,
        score: data.score ?? undefined,
        source: data.source ?? undefined,
        contextJson: data.contextJson ? JSON.stringify(data.contextJson) : undefined,
      },
      create: {
        workspaceId: this.workspaceId,
        category: data.category,
        key: data.key,
        value: data.value,
        score: data.score ?? 0,
        source: data.source ?? "manual",
        contextJson: data.contextJson ? JSON.stringify(data.contextJson) : null,
      },
    });

    return entry;
  }

  // Reinforce a memory — increase its score based on positive feedback
  async reinforce(category: string, key: string, delta: number = 5): Promise<void> {
    const entry = await db.memoryEntry.findUnique({
      where: {
        workspaceId_category_key: {
          workspaceId: this.workspaceId,
          category,
          key,
        },
      },
    });

    if (entry) {
      const newScore = Math.min(100, entry.score + delta);
      await db.memoryEntry.update({
        where: { id: entry.id },
        data: { score: newScore },
      });
    }
  }

  // Decay a memory — decrease its score (used for stale patterns)
  async decay(category: string, key: string, delta: number = 2): Promise<void> {
    const entry = await db.memoryEntry.findUnique({
      where: {
        workspaceId_category_key: {
          workspaceId: this.workspaceId,
          category,
          key,
        },
      },
    });

    if (entry) {
      const newScore = Math.max(0, entry.score - delta);
      await db.memoryEntry.update({
        where: { id: entry.id },
        data: {
          score: newScore,
          isActive: newScore > 0,
        },
      });
    }
  }

  // Auto-decay: automatically age out old memory entries
  // Finds all active entries older than 30 days and reduces their score based on age.
  // Deactivates entries whose score drops below the threshold.
  async autoDecay(deactivationThreshold: number = DEACTIVATION_SCORE): Promise<AutoDecayResult> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - DECAY_THRESHOLD_DAYS);

    // Find all active memory entries older than the threshold
    const oldEntries = await db.memoryEntry.findMany({
      where: {
        workspaceId: this.workspaceId,
        isActive: true,
        createdAt: { lt: cutoffDate },
      },
    });

    let decayed = 0;
    let deactivated = 0;
    const now = new Date();

    for (const entry of oldEntries) {
      // Calculate how many full weeks the entry is past the threshold
      const ageMs = now.getTime() - entry.createdAt.getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);
      const weeksOverThreshold = Math.floor(
        (ageDays - DECAY_THRESHOLD_DAYS) / 7
      );

      if (weeksOverThreshold <= 0) continue;

      const scoreReduction = weeksOverThreshold * DECAY_PER_WEEK;
      const newScore = Math.max(0, entry.score - scoreReduction);

      const shouldDeactivate = newScore < deactivationThreshold;

      await db.memoryEntry.update({
        where: { id: entry.id },
        data: {
          score: newScore,
          isActive: !shouldDeactivate,
        },
      });

      decayed++;
      if (shouldDeactivate) deactivated++;
    }

    return { decayed, deactivated };
  }

  // Start automatic decay on an interval timer
  // Returns a cleanup function to stop the timer
  startAutoDecay(intervalMs: number = 24 * 60 * 60 * 1000): () => void {
    const timer = setInterval(async () => {
      try {
        await this.autoDecay();
      } catch (error) {
        console.error("[MemorySystem] Auto-decay error:", error);
      }
    }, intervalMs);

    return () => {
      clearInterval(timer);
    };
  }

  // Get insights for a workspace
  async getInsights(): Promise<MemoryInsight[]> {
    const categories = await db.memoryEntry.findMany({
      where: { workspaceId: this.workspaceId, isActive: true },
      select: { category: true },
      distinct: ["category"],
    });

    const insights: MemoryInsight[] = [];

    for (const { category } of categories) {
      const entries = await db.memoryEntry.findMany({
        where: { workspaceId: this.workspaceId, category, isActive: true },
        orderBy: { score: "desc" },
        take: 5,
      });

      const allInCategory = await db.memoryEntry.findMany({
        where: { workspaceId: this.workspaceId, category, isActive: true },
      });

      insights.push({
        category,
        topMemories: entries.map((e) => ({
          key: e.key,
          value: e.value,
          score: e.score,
        })),
        averageScore:
          allInCategory.length > 0
            ? allInCategory.reduce((sum, e) => sum + e.score, 0) / allInCategory.length
            : 0,
        totalEntries: allInCategory.length,
      });
    }

    return insights;
  }

  // Get context for AI generation — the most important function
  async getContextForGeneration(taskType: string): Promise<string> {
    const categoryMap: Record<string, string[]> = {
      draft: ["hook", "topic", "tone", "format", "audience"],
      humanic: ["style", "tone"],
      seo: ["platform", "topic"],
      script: ["hook", "topic", "tone", "video_style"],
      publish: ["platform", "timing", "cta"],
    };

    const categories = categoryMap[taskType] || ["topic", "tone"];

    const memories = await db.memoryEntry.findMany({
      where: {
        workspaceId: this.workspaceId,
        category: { in: categories },
        isActive: true,
        score: { gte: 50 },
      },
      orderBy: { score: "desc" },
      take: 15,
    });

    if (memories.length === 0) return "";

    return memories
      .map((m) => `[${m.category}/${m.key}] (score: ${m.score}): ${m.value}`)
      .join("\n");
  }

  // Learn from analytics — reinforce successful patterns
  async learnFromAnalytics(metricType: string, metricValue: number, metadata: Record<string, unknown>): Promise<void> {
    if (metricValue > 0) {
      // Positive outcome — reinforce related memories
      const { category, key } = metadata;
      if (category && key) {
        const delta = Math.min(10, metricValue / 10);
        await this.reinforce(String(category), String(key), delta);
      }
    }
  }

  // Clean up expired memories — removes or deactivates memories past their expiration
  async cleanupExpired(): Promise<{ deactivated: number; deleted: number }> {
    const now = new Date()

    // Deactivate expired short-term Memory model entries
    const { count: deactivated } = await db.memory.updateMany({
      where: {
        workspaceId: this.workspaceId,
        layer: 'short_term',
        expiresAt: { lt: now },
      },
      data: {
        expiresAt: null,
        layer: 'long_term', // Promote to long-term instead of losing data
      },
    })

    // Delete truly old expired memories (older than 90 days past expiration)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    const { count: deleted } = await db.memory.deleteMany({
      where: {
        workspaceId: this.workspaceId,
        expiresAt: { lt: ninetyDaysAgo },
      },
    })

    return { deactivated, deleted }
  }
}

// ─── Global cleanup function for expired memories ─────────────────────────────

export async function cleanupExpiredMemories(
  workspaceId?: string
): Promise<{ deactivated: number; deleted: number }> {
  const now = new Date()
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

  const whereBase = {
    layer: 'short_term' as const,
    expiresAt: { lt: now },
  }

  const where = workspaceId
    ? { ...whereBase, workspaceId }
    : whereBase

  // Deactivate expired memories by promoting them to long-term
  const { count: deactivated } = await db.memory.updateMany({
    where,
    data: {
      expiresAt: null,
      layer: 'long_term',
    },
  })

  // Delete truly old expired memories (older than 90 days past expiration)
  const deleteWhere = workspaceId
    ? { workspaceId, expiresAt: { lt: ninetyDaysAgo } }
    : { expiresAt: { lt: ninetyDaysAgo } }

  const { count: deleted } = await db.memory.deleteMany({
    where: deleteWhere,
  })

  return { deactivated, deleted }
}

// ─── Singleton factory with LRU eviction ──────────────────────────────────────

interface CacheEntry {
  system: MemorySystem;
  lastAccess: number;
}

const memorySystems = new Map<string, CacheEntry>();

function evictIfNeeded(): void {
  if (memorySystems.size <= MAX_CACHE_SIZE) return;

  // Sort by lastAccess ascending (least recently used first)
  const entries = [...memorySystems.entries()].sort(
    (a, b) => a[1].lastAccess - b[1].lastAccess
  );

  // Evict the EVICT_COUNT least-recently-accessed entries
  const toEvict = entries.slice(0, EVICT_COUNT);
  for (const [key] of toEvict) {
    memorySystems.delete(key);
  }
}

export function getMemorySystem(workspaceId: string): MemorySystem {
  const existing = memorySystems.get(workspaceId);
  if (existing) {
    existing.lastAccess = Date.now();
    return existing.system;
  }

  // Evict stale entries before adding a new one
  evictIfNeeded();

  const system = new MemorySystem(workspaceId);
  memorySystems.set(workspaceId, { system, lastAccess: Date.now() });
  return system;
}
