# Energy System

**AI Media Intelligence OS — Fatigue Tracking and Saturation Prevention**

---

## Philosophy

Most content systems have a volume problem: they publish too much, too often, on the same topics, in the same tone, with the same hooks. The result is audience fatigue, declining engagement, and diminished authority. Publishing more does not mean performing better — in fact, beyond a certain point, it means performing worse.

The Energy System is the AI Media Intelligence OS's answer to content exhaustion. It tracks fatigue across five dimensions, applies natural decay to allow recovery, and enforces pre-publish gates that block content from going out when the system (or the audience) is too tired.

The core insight is simple: **rest is a feature, not a bug.** The best content creators know when to pause, when to pivot, and when to push. The Energy System encodes this knowledge into the operating system itself.

---

## Fatigue Categories

### 1. Topic Fatigue

**What it tracks**: How frequently you publish on the same topic.  
**Why it matters**: Audiences tire of repetitive subject matter. Publishing 5 articles about "AI automation" in a week signals that you have nothing else to say.  
**Increment per publish**: +15 fatigue points  
**Decay rate**: -2 points per hour  

Topic fatigue is the most common form of content exhaustion. It happens when a creator finds a topic that performs well and over-exploits it. The first article about AI automation might get 1,000 views. The fifth article on the same topic in two weeks might get 200. The energy system prevents this by tracking topic frequency and flagging when a topic is overused.

### 2. Tone Fatigue

**What it tracks**: How often you use the same voice or style.  
**Why it matters**: Even varied topics become boring when delivered in the same tone. A relentlessly "authoritative and professional" voice becomes monotonous.  
**Increment per publish**: +12 fatigue points  
**Decay rate**: -3 points per hour  

Tone fatigue is subtler than topic fatigue. It accumulates slowly and is harder to notice because the content itself is different. But readers who consume multiple pieces will feel the sameness. Varying tone — from analytical to conversational, from serious to lighthearted — keeps the audience engaged.

### 3. Publish Saturation

**What it tracks**: Overall publishing volume regardless of topic or tone.  
**Why it matters**: There is an optimal publishing frequency for every audience. Going beyond it does not increase reach — it increases unsubscribes.  
**Increment per publish**: +10 fatigue points  
**Decay rate**: -1.5 points per hour  

Publish saturation is the macro-level check. Even with diverse topics and varied tones, there is a limit to how much content an audience can consume. The saturation tracker ensures the system respects that limit.

### 4. Audience Exhaustion

**What it tracks**: Whether the audience is being overwhelmed.  
**Why it matters**: This is the most important metric because it directly reflects audience experience, not just publishing activity.  
**Increment per publish**: +8 fatigue points  
**Decay rate**: -1 point per hour  

Audience exhaustion is the slowest to accumulate and the slowest to recover from. It represents accumulated reader burnout — the feeling of "I keep seeing content from this source and I'm tired of it." Once an audience is exhausted, recovery takes significantly longer than topic or tone fatigue.

### 5. Hook Repetition

**What it tracks**: How often the same opening hook pattern is reused.  
**Why it matters**: Hooks are the first impression. Repeating hooks trains the audience to ignore your openings.  
**Increment per publish**: +18 fatigue points  
**Decay rate**: -4 points per hour  

Hook repetition has the highest increment and the fastest decay. This reflects the reality that hooks need to be fresh for each article, but audiences also forget hooks relatively quickly. A hook that would be repetitive if used two days apart is perfectly fine if used two weeks apart.

---

## Fatigue Thresholds

Each category has four status levels with corresponding thresholds:

| Category | Fresh | Moderate | Tired | Exhausted |
|----------|-------|----------|-------|-----------|
| Topic Fatigue | 0-29 | 30-59 | 60-79 | 80+ |
| Tone Fatigue | 0-29 | 30-54 | 55-74 | 75+ |
| Publish Saturation | 0-24 | 25-49 | 50-74 | 75+ |
| Audience Exhaustion | 0-34 | 35-59 | 60-84 | 85+ |
| Hook Repetition | 0-29 | 30-54 | 55-69 | 70+ |

### Status Definitions

- **Fresh**: No concerns. The category has plenty of room for publishing.
- **Moderate**: Approaching limits. Plan to diversify soon, but publishing is still fine.
- **Tired**: At the limit. The system recommends pausing or pivoting. Publishing is possible but not recommended.
- **Exhausted**: Over the limit. The system blocks publishing in this category. Rest or reset is required.

---

## Natural Decay

Fatigue scores naturally decrease over time. This is not a manual process — it is built into the system. The decay rates ensure that fatigue recovers at a realistic pace:

- **Topic fatigue**: Loses 2 points per hour (recovers from "tired" to "fresh" in ~30 hours)
- **Tone fatigue**: Loses 3 points per hour (recovers from "tired" to "fresh" in ~18 hours)
- **Publish saturation**: Loses 1.5 points per hour (recovers from "tired" to "fresh" in ~33 hours)
- **Audience exhaustion**: Loses 1 point per hour (recovers from "tired" to "fresh" in ~60 hours)
- **Hook repetition**: Loses 4 points per hour (recovers from "tired" to "fresh" in ~14 hours)

The decay is calculated at read time, not via a background process. When `getFatigueLevel` is called, it calculates the current fatigue by applying decay since the last update:

```typescript
const hoursSinceUpdate = (now.getTime() - entry.updatedAt.getTime()) / (1000 * 60 * 60);
const decayAmount = hoursSinceUpdate * decayRate;
const currentFatigue = Math.max(0, entry.fatigueScore - decayAmount);
```

### Decay Application

The `applyNaturalDecay` function can be called to permanently write decayed values to the database. This is useful for:
- Keeping the database values accurate for reporting
- Preventing floating-point drift over very long periods
- Enabling efficient queries on the `fatigueScore` index

Decay is only written when the amount exceeds 0.5 points to avoid unnecessary database writes.

---

## Pre-Publish Energy Check

The `checkBeforePublish` function is the most important function in the energy system. It runs before every publish operation and determines whether publishing is allowed.

### Check Process

1. **Check publish saturation**: Is the overall publishing volume too high?
2. **Check topic fatigue** (if topic provided): Is this specific topic overused?
3. **Check tone fatigue** (if tone provided): Is this voice/style overused?
4. **Check hook repetition** (if hook provided): Has this hook pattern been used too often?

### Decision Logic

```typescript
const exhaustedCount = fatigueLevels.filter(f => f.status === 'exhausted').length;
const allowed = exhaustedCount < 2;
```

Publishing is allowed if fewer than 2 categories are in "exhausted" status. This means:
- 0 exhausted categories: Publish freely
- 1 exhausted category: Publish with warnings
- 2+ exhausted categories: Publishing blocked

### Warning System

Even when publishing is allowed, the system generates warnings for categories that are tired or exhausted:

```
⚠️ Topic "AI automation" is fatigued. Try a different angle or topic.
⚠️ Hook "Did you know that..." has been used too often. Create a fresh hook.
🛑 Publish saturation is high. Consider spacing out your content.
```

These warnings are informational — in semi-auto mode, they help the operator make informed decisions. In full-auto mode, the `shouldPause` flag determines whether the system actually pauses.

---

## Energy Report

The `getEnergyReport` function provides a comprehensive view of the workspace's energy state:

```typescript
interface EnergyReport {
  workspaceId: string;
  overallEnergy: number;        // 0 (depleted) to 100 (full)
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
```

### Overall Energy

Overall energy is the inverse of average fatigue:

```
overallEnergy = 100 - average(fatigueScores)
```

An overall energy of 85 means the workspace is in excellent shape. An overall energy of 30 means the workspace is running on fumes.

### Recommendations

The system generates specific recommendations based on each category's status:

- **Exhausted**: "Stop publishing in this area immediately. Reset or wait for natural recovery."
- **Tired**: "Consider switching to a different [category]."
- **Moderate**: "Plan to rotate topics/tones soon."
- **Fresh**: No recommendation needed.

If all categories are fresh, the report includes: "All energy levels are fresh. You have plenty of room to publish."

---

## Fatigue Reset

The `resetFatigue` function manually resets fatigue scores to 0 for a specific category (and optionally a specific topic). This should be used sparingly — natural decay is the preferred recovery mechanism. Manual resets are appropriate when:

- A workspace has been inactive for a long period and stale data is no longer relevant
- A strategic pivot makes previous fatigue data irrelevant
- The operator intentionally wants to override the system's recommendation

---

## Integration with Content Pipeline

The energy system integrates with the content pipeline at two critical points:

### Before Draft Generation

When generating a new draft, the system checks topic fatigue to ensure the selected topic is not already exhausted. If it is, the system recommends an alternative topic or angle.

### Before Publishing

The `checkBeforePublish` function runs as a gate before every publish operation. If the energy check fails (2+ categories exhausted), publishing is blocked and the operator receives recommendations for how to recover.

### After Publishing

After content is published, the energy system tracks the publish event:
- Topic fatigue is incremented for the content's topic
- Tone fatigue is incremented for the content's tone
- Publish saturation is incremented globally
- Hook repetition is incremented for the opening hook pattern
- Audience exhaustion is incremented globally

This post-publish tracking ensures that fatigue scores accurately reflect recent publishing activity.

---

## Future Enhancements

- **Audience-weighted fatigue**: Factor in actual audience engagement data rather than just publish counts
- **Platform-specific fatigue**: Different platforms may have different saturation points
- **Seasonal adjustments**: Adjust thresholds for known high-traffic periods (e.g., product launches, holidays)
- **Predictive fatigue**: Forecast when fatigue will reach exhaustion based on current publishing cadence
- **Recovery scheduling**: Automatically schedule content pauses for optimal recovery
- **Cross-workspace intelligence**: Anonymized fatigue benchmarks across all workspaces
