/**
 * Energy System — Track fatigue, saturation, and exhaustion
 *
 * Prevents content exhaustion by monitoring:
 *   - Topic fatigue: Publishing too much on the same topic
 *   - Tone fatigue: Repetitive voice/style
 *   - Publish saturation: Too many posts in a time window
 *   - Hook repetition: Reusing the same hooks
 *   - Audience exhaustion: Overwhelming the audience
 *
 * Fatigue scores range from 0 (fresh) to 100 (exhausted).
 * When thresholds are exceeded, the system recommends pausing.
 */

import { db } from '@/lib/db';

// ─── Type Definitions ────────────────────────────────────────────────────────

export type EnergyCategory =
  | 'topic_fatigue'
  | 'tone_fatigue'
  | 'publish_saturation'
  | 'audience_exhaustion'
  | 'hook_repetition';

export interface FatigueEntry {
  id: string;
  category: string;
  topic: string | null;
  fatigueScore: number;
  publishCount: number;
  lastResetAt: Date;
}

export interface EnergyReport {
  workspaceId: string;
  overallEnergy: number; // 0 (depleted) to 100 (full)
  categories: Array<{
    category: string;
    fatigueScore: number;
    publishCount: number;
    status: 'fresh' | 'moderate' | 'tired' | 'exhausted';
    shouldPause: boolean;
  }>;
  recommendations: string[];
  canPublish: boolean;
}

export interface EnergyStatus {
  category: string;
  topic?: string | null;
  fatigueScore: number;
  publishCount: number;
  status: 'fresh' | 'moderate' | 'tired' | 'exhausted';
  shouldPause: boolean;
}

// ─── Threshold Configuration ─────────────────────────────────────────────────

export const FATIGUE_THRESHOLDS = {
  topic_fatigue: {
    moderate: 30,
    tired: 60,
    exhausted: 80,
  },
  tone_fatigue: {
    moderate: 30,
    tired: 55,
    exhausted: 75,
  },
  publish_saturation: {
    moderate: 25,
    tired: 50,
    exhausted: 75,
  },
  audience_exhaustion: {
    moderate: 35,
    tired: 60,
    exhausted: 85,
  },
  hook_repetition: {
    moderate: 30,
    tired: 55,
    exhausted: 70,
  },
};

// Score increment per publish action
const FATIGUE_INCREMENT: Record<EnergyCategory, number> = {
  topic_fatigue: 15,
  tone_fatigue: 12,
  publish_saturation: 10,
  audience_exhaustion: 8,
  hook_repetition: 18,
};

// Natural decay per hour (fatigue decreases over time)
const FATIGUE_DECAY_RATE: Record<EnergyCategory, number> = {
  topic_fatigue: 2,    // Loses 2 fatigue points per hour
  tone_fatigue: 3,     // Tone fatigue recovers faster
  publish_saturation: 1.5,
  audience_exhaustion: 1,
  hook_repetition: 4,  // Hook fatigue recovers fastest
};

// ─── Track Topic Fatigue ─────────────────────────────────────────────────────

export async function trackTopicFatigue(
  workspaceId: string,
  topic: string
): Promise<EnergyStatus> {
  return trackEnergy(workspaceId, 'topic_fatigue', topic);
}

// ─── Track Tone Fatigue ──────────────────────────────────────────────────────

export async function trackToneFatigue(
  workspaceId: string,
  tone: string
): Promise<EnergyStatus> {
  return trackEnergy(workspaceId, 'tone_fatigue', tone);
}

// ─── Track Publish Saturation ────────────────────────────────────────────────

export async function trackPublishSaturation(
  workspaceId: string
): Promise<EnergyStatus> {
  return trackEnergy(workspaceId, 'publish_saturation', 'global');
}

// ─── Track Hook Repetition ───────────────────────────────────────────────────

export async function trackHookRepetition(
  workspaceId: string,
  hook: string
): Promise<EnergyStatus> {
  return trackEnergy(workspaceId, 'hook_repetition', hook);
}

// ─── Core Track Energy ───────────────────────────────────────────────────────

async function trackEnergy(
  workspaceId: string,
  category: EnergyCategory | string,
  topic: string
): Promise<EnergyStatus> {
  try {
    // Find or create the energy entry
    const existing = await db.energyEntry.findFirst({
      where: {
        workspaceId,
        category,
        topic,
      },
    });

    const now = new Date();
    const increment = FATIGUE_INCREMENT[category as EnergyCategory] || 10;
    const decayRate = FATIGUE_DECAY_RATE[category as EnergyCategory] || 2;

    if (existing) {
      // Apply time-based decay since last update
      const hoursSinceUpdate = (now.getTime() - existing.updatedAt.getTime()) / (1000 * 60 * 60);
      const decayAmount = hoursSinceUpdate * decayRate;

      // Calculate new fatigue score: decay first, then increment
      const decayedScore = Math.max(0, existing.fatigueScore - decayAmount);
      const newScore = Math.min(100, decayedScore + increment);

      await db.energyEntry.update({
        where: { id: existing.id },
        data: {
          fatigueScore: newScore,
          publishCount: existing.publishCount + 1,
        },
      });

      const status = getEnergyStatus(category, newScore);

      await logEnergyAction('energy_tracked', workspaceId, category, topic, {
        previousScore: existing.fatigueScore,
        newScore,
        decayApplied: decayAmount,
        increment,
      });

      return {
        category,
        topic,
        fatigueScore: newScore,
        publishCount: existing.publishCount + 1,
        status: status.status,
        shouldPause: status.shouldPause,
      };
    } else {
      // Create new entry
      const entry = await db.energyEntry.create({
        data: {
          workspaceId,
          category,
          topic,
          fatigueScore: increment,
          publishCount: 1,
          lastResetAt: now,
        },
      });

      const status = getEnergyStatus(category, increment);

      await logEnergyAction('energy_created', workspaceId, category, topic, {
        initialScore: increment,
      });

      return {
        category,
        topic,
        fatigueScore: increment,
        publishCount: 1,
        status: status.status,
        shouldPause: status.shouldPause,
      };
    }
  } catch (error) {
    await logEnergyError('energy_track_failed', workspaceId, category, topic, error);
    return {
      category,
      topic,
      fatigueScore: 0,
      publishCount: 0,
      status: 'fresh',
      shouldPause: false,
    };
  }
}

// ─── Get Fatigue Level ───────────────────────────────────────────────────────

export async function getFatigueLevel(
  workspaceId: string,
  category: string,
  topic?: string
): Promise<EnergyStatus> {
  try {
    const whereClause: Record<string, unknown> = {
      workspaceId,
      category,
    };

    if (topic) {
      whereClause.topic = topic;
    }

    const entries = await db.energyEntry.findMany({
      where: whereClause,
    });

    if (entries.length === 0) {
      return {
        category,
        topic: topic || null,
        fatigueScore: 0,
        publishCount: 0,
        status: 'fresh',
        shouldPause: false,
      };
    }

    // Apply decay to get current fatigue
    const now = new Date();
    const decayRate = FATIGUE_DECAY_RATE[category as EnergyCategory] || 2;

    let totalFatigue = 0;
    let totalCount = 0;

    for (const entry of entries) {
      const hoursSinceUpdate = (now.getTime() - entry.updatedAt.getTime()) / (1000 * 60 * 60);
      const decayAmount = hoursSinceUpdate * decayRate;
      const currentFatigue = Math.max(0, entry.fatigueScore - decayAmount);
      totalFatigue += currentFatigue;
      totalCount += entry.publishCount;
    }

    const avgFatigue = totalFatigue / entries.length;
    const status = getEnergyStatus(category, avgFatigue);

    return {
      category,
      topic: topic || null,
      fatigueScore: Math.round(avgFatigue * 100) / 100,
      publishCount: totalCount,
      status: status.status,
      shouldPause: status.shouldPause,
    };
  } catch (error) {
    await logEnergyError('fatigue_level_failed', workspaceId, category, topic || '', error);
    return {
      category,
      topic: topic || null,
      fatigueScore: 0,
      publishCount: 0,
      status: 'fresh',
      shouldPause: false,
    };
  }
}

// ─── Should Pause ────────────────────────────────────────────────────────────

export async function shouldPause(
  workspaceId: string,
  category: string
): Promise<boolean> {
  const fatigue = await getFatigueLevel(workspaceId, category);
  return fatigue.shouldPause;
}

// ─── Reset Fatigue ───────────────────────────────────────────────────────────

export async function resetFatigue(
  workspaceId: string,
  category: string,
  topic?: string
): Promise<{ reset: number }> {
  try {
    const whereClause: Record<string, unknown> = {
      workspaceId,
      category,
    };

    if (topic) {
      whereClause.topic = topic;
    }

    const result = await db.energyEntry.updateMany({
      where: whereClause,
      data: {
        fatigueScore: 0,
        publishCount: 0,
        lastResetAt: new Date(),
      },
    });

    await logEnergyAction('fatigue_reset', workspaceId, category, topic || 'all', {
      resetCount: result.count,
    });

    return { reset: result.count };
  } catch (error) {
    await logEnergyError('fatigue_reset_failed', workspaceId, category, topic || '', error);
    return { reset: 0 };
  }
}

// ─── Get Energy Report ───────────────────────────────────────────────────────

export async function getEnergyReport(workspaceId: string): Promise<EnergyReport> {
  try {
    const categories: EnergyCategory[] = [
      'topic_fatigue',
      'tone_fatigue',
      'publish_saturation',
      'audience_exhaustion',
      'hook_repetition',
    ];

    const categoryStatuses: EnergyReport['categories'] = [];

    for (const category of categories) {
      const fatigue = await getFatigueLevel(workspaceId, category);
      categoryStatuses.push({
        category,
        fatigueScore: fatigue.fatigueScore,
        publishCount: fatigue.publishCount,
        status: fatigue.status,
        shouldPause: fatigue.shouldPause,
      });
    }

    // Calculate overall energy (inverse of average fatigue)
    const avgFatigue =
      categoryStatuses.reduce((sum, c) => sum + c.fatigueScore, 0) / categoryStatuses.length;
    const overallEnergy = Math.round(100 - avgFatigue);

    // Generate recommendations
    const recommendations = generateRecommendations(categoryStatuses);

    // Determine if publishing is possible
    const exhaustedCount = categoryStatuses.filter((c) => c.status === 'exhausted').length;
    const canPublish = exhaustedCount < 2; // Allow publishing if fewer than 2 categories are exhausted

    return {
      workspaceId,
      overallEnergy,
      categories: categoryStatuses,
      recommendations,
      canPublish,
    };
  } catch (error) {
    await logEnergyError('energy_report_failed', workspaceId, '', '', error);
    return {
      workspaceId,
      overallEnergy: 100,
      categories: [],
      recommendations: ['Unable to generate energy report'],
      canPublish: true,
    };
  }
}

// ─── Apply Natural Decay ─────────────────────────────────────────────────────

export async function applyNaturalDecay(workspaceId: string): Promise<{
  entriesDecayed: number;
}> {
  try {
    const entries = await db.energyEntry.findMany({
      where: {
        workspaceId,
        fatigueScore: { gt: 0 },
      },
    });

    const now = new Date();
    let entriesDecayed = 0;

    for (const entry of entries) {
      const decayRate = FATIGUE_DECAY_RATE[entry.category as EnergyCategory] || 2;
      const hoursSinceUpdate = (now.getTime() - entry.updatedAt.getTime()) / (1000 * 60 * 60);
      const decayAmount = hoursSinceUpdate * decayRate;

      if (decayAmount > 0.5) {
        // Only apply if meaningful decay
        const newScore = Math.max(0, entry.fatigueScore - decayAmount);

        await db.energyEntry.update({
          where: { id: entry.id },
          data: { fatigueScore: Math.round(newScore * 100) / 100 },
        });

        entriesDecayed++;
      }
    }

    await logEnergyAction('natural_decay_applied', workspaceId, '', '', {
      entriesDecayed,
    });

    return { entriesDecayed };
  } catch (error) {
    await logEnergyError('natural_decay_failed', workspaceId, '', '', error);
    return { entriesDecayed: 0 };
  }
}

// ─── Check Before Publish ────────────────────────────────────────────────────

export async function checkBeforePublish(
  workspaceId: string,
  topic?: string,
  tone?: string,
  hook?: string
): Promise<{
  allowed: boolean;
  warnings: string[];
  fatigueLevels: Array<{ category: string; score: number; status: string }>;
}> {
  const warnings: string[] = [];
  const fatigueLevels: Array<{ category: string; score: number; status: string }> = [];

  // Check publish saturation
  const saturation = await getFatigueLevel(workspaceId, 'publish_saturation');
  fatigueLevels.push({
    category: 'publish_saturation',
    score: saturation.fatigueScore,
    status: saturation.status,
  });

  if (saturation.shouldPause) {
    warnings.push('Publish saturation is high. Consider spacing out your content.');
  }

  // Check topic fatigue
  if (topic) {
    const topicFatigue = await getFatigueLevel(workspaceId, 'topic_fatigue', topic);
    fatigueLevels.push({
      category: 'topic_fatigue',
      score: topicFatigue.fatigueScore,
      status: topicFatigue.status,
    });

    if (topicFatigue.shouldPause) {
      warnings.push(`Topic "${topic}" is fatigued. Try a different angle or topic.`);
    }
  }

  // Check tone fatigue
  if (tone) {
    const toneFatigue = await getFatigueLevel(workspaceId, 'tone_fatigue', tone);
    fatigueLevels.push({
      category: 'tone_fatigue',
      score: toneFatigue.fatigueScore,
      status: toneFatigue.status,
    });

    if (toneFatigue.shouldPause) {
      warnings.push(`Tone "${tone}" is overused. Try varying your voice.`);
    }
  }

  // Check hook repetition
  if (hook) {
    const hookFatigue = await getFatigueLevel(workspaceId, 'hook_repetition', hook);
    fatigueLevels.push({
      category: 'hook_repetition',
      score: hookFatigue.fatigueScore,
      status: hookFatigue.status,
    });

    if (hookFatigue.shouldPause) {
      warnings.push(`Hook "${hook.slice(0, 50)}..." has been used too often. Create a fresh hook.`);
    }
  }

  const exhaustedCount = fatigueLevels.filter((f) => f.status === 'exhausted').length;
  const allowed = exhaustedCount < 2;

  return { allowed, warnings, fatigueLevels };
}

// ─── Private: Get Energy Status ──────────────────────────────────────────────

function getEnergyStatus(
  category: string,
  fatigueScore: number
): { status: 'fresh' | 'moderate' | 'tired' | 'exhausted'; shouldPause: boolean } {
  const thresholds = FATIGUE_THRESHOLDS[category as EnergyCategory] || FATIGUE_THRESHOLDS.publish_saturation;

  if (fatigueScore >= thresholds.exhausted) {
    return { status: 'exhausted', shouldPause: true };
  }
  if (fatigueScore >= thresholds.tired) {
    return { status: 'tired', shouldPause: true };
  }
  if (fatigueScore >= thresholds.moderate) {
    return { status: 'moderate', shouldPause: false };
  }
  return { status: 'fresh', shouldPause: false };
}

// ─── Private: Generate Recommendations ───────────────────────────────────────

function generateRecommendations(
  categories: EnergyReport['categories']
): string[] {
  const recommendations: string[] = [];

  for (const cat of categories) {
    switch (cat.status) {
      case 'exhausted':
        recommendations.push(
          `🛑 ${cat.category}: Completely exhausted (score: ${cat.fatigueScore.toFixed(1)}). Stop publishing in this area immediately. Reset or wait for natural recovery.`
        );
        break;
      case 'tired':
        recommendations.push(
          `⚠️ ${cat.category}: Approaching exhaustion (score: ${cat.fatigueScore.toFixed(1)}). Consider switching to a different ${cat.category.replace('_', ' ')}.`
        );
        break;
      case 'moderate':
        recommendations.push(
          `📊 ${cat.category}: Moderate fatigue (score: ${cat.fatigueScore.toFixed(1)}). Plan to rotate topics/tones soon.`
        );
        break;
      case 'fresh':
        // No recommendation needed for fresh categories
        break;
    }
  }

  // Add general recommendation if no specific ones
  if (recommendations.length === 0) {
    recommendations.push('✅ All energy levels are fresh. You have plenty of room to publish.');
  }

  return recommendations;
}

// ─── Logging ─────────────────────────────────────────────────────────────────

async function logEnergyAction(
  action: string,
  workspaceId: string,
  category: string,
  topic: string,
  metadata: Record<string, unknown>
): Promise<void> {
  try {
    await db.systemLog.create({
      data: {
        service: 'energy',
        level: 'info',
        action,
        message: `Energy: ${action} [${category}${topic ? `/${topic}` : ''}]`,
        metadataJson: JSON.stringify({ workspaceId, category, topic, ...metadata }),
      },
    });
  } catch {
    // Logging failure should not break energy tracking
  }
}

async function logEnergyError(
  action: string,
  workspaceId: string,
  category: string,
  topic: string,
  error: unknown
): Promise<void> {
  try {
    await db.systemLog.create({
      data: {
        service: 'energy',
        level: 'error',
        action,
        message: `Energy error: ${action} [${category}${topic ? `/${topic}` : ''}]`,
        metadataJson: JSON.stringify({
          workspaceId,
          category,
          topic,
          error: error instanceof Error ? error.message : String(error),
        }),
      },
    });
  } catch {
    // Logging failure should not break energy tracking
  }
}
