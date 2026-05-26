/**
 * Memory System — "Memory is the moat, not the model"
 *
 * Stores what worked, what failed, preferences, and patterns.
 * Every content decision is informed by accumulated memory.
 * The system learns from outcomes and continuously improves.
 */

import { db } from '@/lib/db';

// ─── Type Definitions ────────────────────────────────────────────────────────

export type MemoryCategory =
  | 'hook'
  | 'topic'
  | 'tone'
  | 'timing'
  | 'cta'
  | 'format'
  | 'platform'
  | 'monetization'
  | 'audience'
  | 'style';

export type MemorySource = 'analytics' | 'manual' | 'ai' | 'experiment';

export interface MemoryInput {
  workspaceId: string;
  category: MemoryCategory | string;
  key: string;
  value: string;
  score?: number;
  source?: MemorySource | string;
  contextJson?: Record<string, unknown>;
}

export interface MemorySearchResult {
  id: string;
  category: string;
  key: string;
  value: string;
  score: number;
  source: string;
  contextJson: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PatternDetection {
  category: string;
  pattern: string;
  confidence: number;
  evidence: string[];
  recommendation: string;
}

export interface PlatformBehavior {
  platform: string;
  bestPerformingHooks: Array<{ key: string; value: string; score: number }>;
  bestPerformingTopics: Array<{ key: string; value: string; score: number }>;
  optimalTiming: Array<{ key: string; value: string; score: number }>;
  averageScore: number;
}

// ─── Store Memory ────────────────────────────────────────────────────────────

export async function storeMemory(input: MemoryInput): Promise<{ id: string; created: boolean }> {
  const { workspaceId, category, key, value, score = 0, source = 'analytics', contextJson } = input;

  try {
    // Upsert: create or update if the key already exists in this category
    const memory = await db.memoryEntry.upsert({
      where: {
        workspaceId_category_key: {
          workspaceId,
          category,
          key,
        },
      },
      create: {
        workspaceId,
        category,
        key,
        value,
        score,
        source,
        contextJson: contextJson ? JSON.stringify(contextJson) : null,
        isActive: true,
      },
      update: {
        value,
        score: score > 0 ? score : undefined, // Only update score if explicitly provided
        source,
        contextJson: contextJson ? JSON.stringify(contextJson) : undefined,
        isActive: true,
      },
    });

    await logMemoryAction('memory_stored', workspaceId, category, key, score);

    return {
      id: memory.id,
      created: memory.createdAt.getTime() === memory.updatedAt.getTime(),
    };
  } catch (error) {
    await logMemoryError('memory_store_failed', workspaceId, category, key, error);
    throw new Error(
      `Failed to store memory [${category}/${key}]: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ─── Retrieve Memory ─────────────────────────────────────────────────────────

export async function retrieveMemory(
  workspaceId: string,
  category: string,
  limit: number = 20
): Promise<MemorySearchResult[]> {
  try {
    const memories = await db.memoryEntry.findMany({
      where: {
        workspaceId,
        category,
        isActive: true,
      },
      orderBy: [
        { score: 'desc' },
        { updatedAt: 'desc' },
      ],
      take: limit,
    });

    return memories.map((m) => ({
      id: m.id,
      category: m.category,
      key: m.key,
      value: m.value,
      score: m.score,
      source: m.source,
      contextJson: m.contextJson,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }));
  } catch (error) {
    await logMemoryError('memory_retrieve_failed', workspaceId, category, '', error);
    throw new Error(
      `Failed to retrieve memory [${category}]: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ─── Search Memory ───────────────────────────────────────────────────────────

export async function searchMemory(
  workspaceId: string,
  query: string,
  category?: string
): Promise<MemorySearchResult[]> {
  try {
    const whereClause: Record<string, unknown> = {
      workspaceId,
      isActive: true,
      OR: [
        { key: { contains: query } },
        { value: { contains: query } },
      ],
    };

    if (category) {
      whereClause.category = category;
    }

    const memories = await db.memoryEntry.findMany({
      where: whereClause,
      orderBy: [{ score: 'desc' }, { updatedAt: 'desc' }],
      take: 50,
    });

    return memories.map((m) => ({
      id: m.id,
      category: m.category,
      key: m.key,
      value: m.value,
      score: m.score,
      source: m.source,
      contextJson: m.contextJson,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }));
  } catch (error) {
    await logMemoryError('memory_search_failed', workspaceId, category || '', '', error);
    throw new Error(
      `Failed to search memory: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ─── Update Memory Score ────────────────────────────────────────────────────

export async function updateMemoryScore(
  memoryId: string,
  newScore: number
): Promise<void> {
  try {
    await db.memoryEntry.update({
      where: { id: memoryId },
      data: { score: newScore },
    });
  } catch (error) {
    await logMemoryError('memory_score_update_failed', '', '', memoryId, error);
    throw new Error(
      `Failed to update memory score: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ─── Get Top Hooks ───────────────────────────────────────────────────────────

export async function getTopHooks(
  workspaceId: string,
  limit: number = 10
): Promise<Array<{ key: string; value: string; score: number }>> {
  try {
    const hooks = await db.memoryEntry.findMany({
      where: {
        workspaceId,
        category: 'hook',
        isActive: true,
        score: { gt: 0 },
      },
      orderBy: { score: 'desc' },
      take: limit,
    });

    return hooks.map((h) => ({
      key: h.key,
      value: h.value,
      score: h.score,
    }));
  } catch (error) {
    await logMemoryError('memory_hooks_failed', workspaceId, 'hook', '', error);
    return [];
  }
}

// ─── Get Top Topics ──────────────────────────────────────────────────────────

export async function getTopTopics(
  workspaceId: string,
  limit: number = 10
): Promise<Array<{ key: string; value: string; score: number }>> {
  try {
    const topics = await db.memoryEntry.findMany({
      where: {
        workspaceId,
        category: 'topic',
        isActive: true,
        score: { gt: 0 },
      },
      orderBy: { score: 'desc' },
      take: limit,
    });

    return topics.map((t) => ({
      key: t.key,
      value: t.value,
      score: t.score,
    }));
  } catch (error) {
    await logMemoryError('memory_topics_failed', workspaceId, 'topic', '', error);
    return [];
  }
}

// ─── Get Platform Behavior ───────────────────────────────────────────────────

export async function getPlatformBehavior(
  workspaceId: string,
  platform: string
): Promise<PlatformBehavior> {
  try {
    const platformKey = platform.toLowerCase();

    // Get all memories related to this platform
    const platformMemories = await db.memoryEntry.findMany({
      where: {
        workspaceId,
        isActive: true,
        OR: [
          { category: 'platform', key: { contains: platformKey } },
          { category: 'hook', contextJson: { contains: platformKey } },
          { category: 'topic', contextJson: { contains: platformKey } },
          { category: 'timing', contextJson: { contains: platformKey } },
        ],
      },
      orderBy: { score: 'desc' },
      take: 100,
    });

    // Categorize by type
    const hooks = platformMemories
      .filter((m) => m.category === 'hook')
      .slice(0, 5)
      .map((m) => ({ key: m.key, value: m.value, score: m.score }));

    const topics = platformMemories
      .filter((m) => m.category === 'topic')
      .slice(0, 5)
      .map((m) => ({ key: m.key, value: m.value, score: m.score }));

    const timing = platformMemories
      .filter((m) => m.category === 'timing')
      .slice(0, 5)
      .map((m) => ({ key: m.key, value: m.value, score: m.score }));

    const scores = platformMemories.map((m) => m.score).filter((s) => s > 0);
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    return {
      platform: platformKey,
      bestPerformingHooks: hooks,
      bestPerformingTopics: topics,
      optimalTiming: timing,
      averageScore: Math.round(averageScore * 100) / 100,
    };
  } catch (error) {
    await logMemoryError('memory_platform_behavior_failed', workspaceId, 'platform', platform, error);
    return {
      platform,
      bestPerformingHooks: [],
      bestPerformingTopics: [],
      optimalTiming: [],
      averageScore: 0,
    };
  }
}

// ─── Record Outcome ──────────────────────────────────────────────────────────

export async function recordOutcome(
  workspaceId: string,
  contentId: string,
  platform: string,
  metricType: string,
  metricValue: number
): Promise<void> {
  try {
    // Record the analytics event
    await db.analyticsEvent.create({
      data: {
        workspaceId,
        contentId,
        platform,
        metricType,
        metricValue,
        source: 'auto',
      },
    });

    // Update memory scores based on the outcome
    // Higher metric values reinforce memory, lower ones decay it
    const content = await db.contentItem.findUnique({
      where: { id: contentId },
      include: { contentTags: true },
    });

    if (content) {
      // Update topic memories
      for (const tag of content.contentTags) {
        const topicMemories = await db.memoryEntry.findMany({
          where: {
            workspaceId,
            category: tag.category,
            key: tag.tag,
            isActive: true,
          },
        });

        for (const memory of topicMemories) {
          // Reinforcement learning: score moves toward the outcome
          const learningRate = 0.1;
          const newScore = memory.score + learningRate * (metricValue - memory.score);
          await db.memoryEntry.update({
            where: { id: memory.id },
            data: { score: Math.max(0, Math.min(100, newScore)) },
          });
        }
      }

      // Store platform-specific performance
      await storeMemory({
        workspaceId,
        category: 'platform',
        key: `${platform}_${metricType}_${contentId.slice(-8)}`,
        value: `${content.title} — ${metricType}: ${metricValue}`,
        score: metricValue,
        source: 'analytics',
        contextJson: {
          contentId,
          platform,
          metricType,
          metricValue,
          contentTitle: content.title,
        },
      });
    }

    await logMemoryAction('outcome_recorded', workspaceId, 'analytics', contentId, metricValue);
  } catch (error) {
    await logMemoryError('outcome_record_failed', workspaceId, 'analytics', contentId, error);
    throw new Error(
      `Failed to record outcome: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ─── Detect Patterns ─────────────────────────────────────────────────────────

export async function detectPatterns(workspaceId: string): Promise<PatternDetection[]> {
  try {
    const patterns: PatternDetection[] = [];

    // Get all active memories for this workspace
    const memories = await db.memoryEntry.findMany({
      where: {
        workspaceId,
        isActive: true,
        score: { gt: 0 },
      },
      orderBy: { score: 'desc' },
      take: 200,
    });

    // Group by category
    const byCategory = new Map<string, typeof memories>();
    for (const memory of memories) {
      const existing = byCategory.get(memory.category) || [];
      existing.push(memory);
      byCategory.set(memory.category, existing);
    }

    // Detect high-performing patterns
    for (const [category, categoryMemories] of byCategory) {
      const topMemories = categoryMemories.filter((m) => m.score >= 70);
      const avgScore =
        categoryMemories.length > 0
          ? categoryMemories.reduce((sum, m) => sum + m.score, 0) / categoryMemories.length
          : 0;

      if (topMemories.length >= 2) {
        patterns.push({
          category,
          pattern: `High-performing ${category} cluster detected`,
          confidence: Math.min(avgScore / 100, 1),
          evidence: topMemories.slice(0, 5).map((m) => `${m.key}: ${m.score.toFixed(1)}`),
          recommendation: `Double down on ${category} patterns: ${topMemories.map((m) => m.key).join(', ')}`,
        });
      }

      // Detect underperforming patterns
      const lowMemories = categoryMemories.filter((m) => m.score < 30 && m.score > 0);
      if (lowMemories.length >= 2) {
        patterns.push({
          category,
          pattern: `Low-performing ${category} cluster detected`,
          confidence: 0.7,
          evidence: lowMemories.slice(0, 5).map((m) => `${m.key}: ${m.score.toFixed(1)}`),
          recommendation: `Avoid or rework ${category} patterns: ${lowMemories.map((m) => m.key).join(', ')}`,
        });
      }
    }

    // Detect timing patterns
    const timingMemories = byCategory.get('timing') || [];
    if (timingMemories.length > 0) {
      const bestTime = timingMemories.reduce((best, m) => (m.score > best.score ? m : best));
      patterns.push({
        category: 'timing',
        pattern: 'Optimal publishing window',
        confidence: bestTime.score / 100,
        evidence: [`Best time: ${bestTime.key} (score: ${bestTime.score.toFixed(1)})`],
        recommendation: `Schedule publications around ${bestTime.key}`,
      });
    }

    return patterns;
  } catch (error) {
    await logMemoryError('pattern_detection_failed', workspaceId, '', '', error);
    return [];
  }
}

// ─── Bulk Store Memory ───────────────────────────────────────────────────────

export async function bulkStoreMemory(
  entries: Array<Omit<MemoryInput, 'workspaceId'> & { workspaceId: string }>
): Promise<{ stored: number; updated: number }> {
  let stored = 0;
  let updated = 0;

  for (const entry of entries) {
    try {
      const result = await storeMemory(entry);
      if (result.created) {
        stored++;
      } else {
        updated++;
      }
    } catch {
      // Continue with other entries if one fails
    }
  }

  return { stored, updated };
}

// ─── Decay Old Memories ─────────────────────────────────────────────────────

export async function decayMemories(
  workspaceId: string,
  decayRate: number = 0.95
): Promise<{ decayed: number }> {
  try {
    // Decay scores of all active memories
    const memories = await db.memoryEntry.findMany({
      where: {
        workspaceId,
        isActive: true,
        score: { gt: 0 },
      },
    });

    let decayed = 0;
    for (const memory of memories) {
      const newScore = Math.round(memory.score * decayRate * 100) / 100;
      if (newScore < 1) {
        // Deactivate memories that have decayed below threshold
        await db.memoryEntry.update({
          where: { id: memory.id },
          data: { score: 0, isActive: false },
        });
      } else {
        await db.memoryEntry.update({
          where: { id: memory.id },
          data: { score: newScore },
        });
      }
      decayed++;
    }

    await logMemoryAction('memories_decayed', workspaceId, '', '', decayRate);
    return { decayed };
  } catch (error) {
    await logMemoryError('memory_decay_failed', workspaceId, '', '', error);
    return { decayed: 0 };
  }
}

// ─── Get Memory Stats ────────────────────────────────────────────────────────

export async function getMemoryStats(workspaceId: string): Promise<{
  totalMemories: number;
  activeMemories: number;
  categoriesCount: number;
  averageScore: number;
  topCategory: string;
}> {
  try {
    const [total, active, categories] = await Promise.all([
      db.memoryEntry.count({ where: { workspaceId } }),
      db.memoryEntry.count({ where: { workspaceId, isActive: true } }),
      db.memoryEntry.groupBy({
        by: ['category'],
        where: { workspaceId, isActive: true },
        _avg: { score: true },
        _count: { category: true },
        orderBy: { _avg: { score: 'desc' } },
      }),
    ]);

    const allActive = await db.memoryEntry.findMany({
      where: { workspaceId, isActive: true, score: { gt: 0 } },
      select: { score: true },
    });

    const averageScore =
      allActive.length > 0
        ? allActive.reduce((sum, m) => sum + m.score, 0) / allActive.length
        : 0;

    return {
      totalMemories: total,
      activeMemories: active,
      categoriesCount: categories.length,
      averageScore: Math.round(averageScore * 100) / 100,
      topCategory: categories[0]?.category || 'none',
    };
  } catch (error) {
    await logMemoryError('memory_stats_failed', workspaceId, '', '', error);
    return {
      totalMemories: 0,
      activeMemories: 0,
      categoriesCount: 0,
      averageScore: 0,
      topCategory: 'none',
    };
  }
}

// ─── Logging Helpers ─────────────────────────────────────────────────────────

async function logMemoryAction(
  action: string,
  workspaceId: string,
  category: string,
  key: string,
  score: number
): Promise<void> {
  try {
    await db.systemLog.create({
      data: {
        service: 'memory',
        level: 'info',
        action,
        message: `Memory action: ${action} [${category}/${key}]`,
        metadataJson: JSON.stringify({ workspaceId, category, key, score }),
      },
    });
  } catch {
    // Logging failure should not break memory operations
  }
}

async function logMemoryError(
  action: string,
  workspaceId: string,
  category: string,
  key: string,
  error: unknown
): Promise<void> {
  try {
    await db.systemLog.create({
      data: {
        service: 'memory',
        level: 'error',
        action,
        message: `Memory error: ${action} [${category}/${key}]`,
        metadataJson: JSON.stringify({
          workspaceId,
          category,
          key,
          error: error instanceof Error ? error.message : String(error),
        }),
      },
    });
  } catch {
    // Logging failure should not break memory operations
  }
}
