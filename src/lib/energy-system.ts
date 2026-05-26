// Energy System — Fatigue tracking and prevention
// Tracks: topic fatigue, tone fatigue, publish saturation, audience exhaustion, hook repetition
// Prevents content decay and creator/audience burnout

import { db } from "@/lib/db";

export type EnergyCategory =
  | "topic_fatigue"
  | "tone_fatigue"
  | "publish_saturation"
  | "audience_exhaustion"
  | "hook_repetition"
  | "visual_fatigue";

export interface EnergyStatus {
  overall: number;          // 0-100 average fatigue
  status: "healthy" | "moderate" | "warning" | "critical";
  categories: EnergyCategoryStatus[];
  recommendations: string[];
}

export interface EnergyCategoryStatus {
  category: EnergyCategory;
  topic?: string;
  fatigueScore: number;
  publishCount: number;
  label: string;
  color: string;
}

// Fatigue thresholds
const THRESHOLDS = {
  healthy: 30,
  moderate: 50,
  warning: 70,
  critical: 85,
};

// Fatigue increase per publish
const FATIGUE_INCREMENT = {
  topic_fatigue: 15,
  tone_fatigue: 10,
  publish_saturation: 8,
  audience_exhaustion: 12,
  hook_repetition: 18,
  visual_fatigue: 14,
};

// Natural fatigue decay per hour
const FATIGUE_DECAY_RATE = 0.5;

export class EnergySystem {
  private workspaceId: string;

  constructor(workspaceId: string) {
    this.workspaceId = workspaceId;
  }

  // Get current energy status
  async getStatus(): Promise<EnergyStatus> {
    const entries = await db.energyEntry.findMany({
      where: { workspaceId: this.workspaceId },
    });

    if (entries.length === 0) {
      return {
        overall: 0,
        status: "healthy",
        categories: [],
        recommendations: ["Energy system is fresh — start publishing!"],
      };
    }

    // Apply time-based decay
    await this.applyDecay(entries);

    // Refresh entries after decay
    const freshEntries = await db.energyEntry.findMany({
      where: { workspaceId: this.workspaceId },
    });

    // Calculate overall fatigue
    const avgFatigue =
      freshEntries.reduce((sum, e) => sum + e.fatigueScore, 0) / freshEntries.length;

    let status: EnergyStatus["status"];
    if (avgFatigue >= THRESHOLDS.critical) status = "critical";
    else if (avgFatigue >= THRESHOLDS.warning) status = "warning";
    else if (avgFatigue >= THRESHOLDS.moderate) status = "moderate";
    else status = "healthy";

    const categories = freshEntries.map((entry) => ({
      category: entry.category as EnergyCategory,
      topic: entry.topic || undefined,
      fatigueScore: entry.fatigueScore,
      publishCount: entry.publishCount,
      label: this.getCategoryLabel(entry.category),
      color: this.getFatigueColor(entry.fatigueScore),
    }));

    const recommendations = this.generateRecommendations(categories);

    return {
      overall: Math.round(avgFatigue * 10) / 10,
      status,
      categories,
      recommendations,
    };
  }

  // Record a publish event — increases fatigue
  async recordPublish(category: EnergyCategory, topic?: string): Promise<void> {
    const existing = await db.energyEntry.findFirst({
      where: {
        workspaceId: this.workspaceId,
        category,
        topic: topic || null,
      },
    });

    const increment = FATIGUE_INCREMENT[category];

    if (existing) {
      const newScore = Math.min(100, existing.fatigueScore + increment);
      await db.energyEntry.update({
        where: { id: existing.id },
        data: {
          fatigueScore: newScore,
          publishCount: existing.publishCount + 1,
        },
      });
    } else {
      await db.energyEntry.create({
        data: {
          workspaceId: this.workspaceId,
          category,
          topic,
          fatigueScore: increment,
          publishCount: 1,
        },
      });
    }

    // Log the energy event
    await db.systemLog.create({
      data: {
        service: "energy",
        level: "info",
        action: "fatigue_increase",
        message: `Fatigue increased for ${category}${topic ? ` (${topic})` : ""}`,
        metadataJson: JSON.stringify({ category, topic }),
      },
    });
  }

  // Check if a publish is advisable
  async canPublish(category: EnergyCategory, topic?: string): Promise<boolean> {
    const entry = await db.energyEntry.findFirst({
      where: {
        workspaceId: this.workspaceId,
        category,
        topic: topic || null,
      },
    });

    if (!entry) return true;
    return entry.fatigueScore < THRESHOLDS.critical;
  }

  // Get the optimal publishing schedule based on energy levels
  async getOptimalSchedule(): Promise<{
    recommendedActions: string[];
    avoidTopics: string[];
    cooldownMinutes: number;
  }> {
    const status = await this.getStatus();

    const recommendedActions: string[] = [];
    const avoidTopics: string[] = [];

    for (const cat of status.categories) {
      if (cat.fatigueScore >= THRESHOLDS.critical) {
        avoidTopics.push(cat.topic || cat.category);
        recommendedActions.push(`Avoid ${cat.label} — critically fatigued`);
      } else if (cat.fatigueScore >= THRESHOLDS.warning) {
        recommendedActions.push(`Use ${cat.label} sparingly — approaching burnout`);
      } else if (cat.fatigueScore < THRESHOLDS.healthy) {
        recommendedActions.push(`${cat.label} is fresh — good time to publish`);
      }
    }

    const cooldownMinutes =
      status.status === "critical" ? 240 :
      status.status === "warning" ? 120 :
      status.status === "moderate" ? 60 : 30;

    return { recommendedActions, avoidTopics, cooldownMinutes };
  }

  // Apply time-based decay to all entries
  private async applyDecay(entries: { id: string; fatigueScore: number; lastResetAt: Date }[]): Promise<void> {
    const now = new Date();

    for (const entry of entries) {
      const hoursSinceReset = (now.getTime() - entry.lastResetAt.getTime()) / (1000 * 60 * 60);
      const decay = hoursSinceReset * FATIGUE_DECAY_RATE;

      if (decay > 0) {
        const newScore = Math.max(0, entry.fatigueScore - decay);
        await db.energyEntry.update({
          where: { id: entry.id },
          data: {
            fatigueScore: newScore,
            lastResetAt: now,
          },
        });
      }
    }
  }

  private getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      topic_fatigue: "Topic Fatigue",
      tone_fatigue: "Tone Fatigue",
      publish_saturation: "Publish Saturation",
      audience_exhaustion: "Audience Exhaustion",
      hook_repetition: "Hook Repetition",
      visual_fatigue: "Visual Fatigue",
    };
    return labels[category] || category;
  }

  private getFatigueColor(score: number): string {
    if (score >= THRESHOLDS.critical) return "text-red-600";
    if (score >= THRESHOLDS.warning) return "text-red-500";
    if (score >= THRESHOLDS.moderate) return "text-yellow-500";
    if (score >= THRESHOLDS.healthy) return "text-emerald-500";
    return "text-green-500";
  }

  private generateRecommendations(categories: EnergyCategoryStatus[]): string[] {
    const recommendations: string[] = [];

    const criticalCount = categories.filter((c) => c.fatigueScore >= THRESHOLDS.critical).length;
    if (criticalCount > 0) {
      recommendations.push(`${criticalCount} area(s) are critically fatigued. Consider taking a break.`);
    }

    const topicFatigue = categories.find((c) => c.category === "topic_fatigue");
    if (topicFatigue && topicFatigue.fatigueScore > 50) {
      recommendations.push("Try exploring new topics to reduce topic fatigue.");
    }

    const hookRep = categories.find((c) => c.category === "hook_repetition");
    if (hookRep && hookRep.fatigueScore > 60) {
      recommendations.push("Your hooks are becoming repetitive. Experiment with new opening patterns.");
    }

    const publishSat = categories.find((c) => c.category === "publish_saturation");
    if (publishSat && publishSat.fatigueScore > 50) {
      recommendations.push("Reduce publishing frequency to avoid audience fatigue.");
    }

    if (recommendations.length === 0) {
      recommendations.push("Energy levels are healthy. Keep up the great work!");
    }

    return recommendations;
  }
}

// Singleton factory
const energySystems = new Map<string, EnergySystem>();

export function getEnergySystem(workspaceId: string): EnergySystem {
  if (!energySystems.has(workspaceId)) {
    energySystems.set(workspaceId, new EnergySystem(workspaceId));
  }
  return energySystems.get(workspaceId)!;
}
