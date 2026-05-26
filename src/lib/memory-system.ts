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
}

// Singleton factory
const memorySystems = new Map<string, MemorySystem>();

export function getMemorySystem(workspaceId: string): MemorySystem {
  if (!memorySystems.has(workspaceId)) {
    memorySystems.set(workspaceId, new MemorySystem(workspaceId));
  }
  return memorySystems.get(workspaceId)!;
}
