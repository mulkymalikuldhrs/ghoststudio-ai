/**
 * Energy System API
 * GET  /api/energy — Get energy report for workspace
 * POST /api/energy — Track fatigue (body: { workspaceId, category, topic? })
 * POST with { action: 'reset' } — Reset fatigue
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getEnergyReport,
  getFatigueLevel,
  trackTopicFatigue,
  trackToneFatigue,
  trackPublishSaturation,
  trackHookRepetition,
  resetFatigue,
  applyNaturalDecay,
  checkBeforePublish,
  type EnergyCategory,
} from '@/lib/energy-system';

// ─── GET: Energy Report ──────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const category = searchParams.get('category') || undefined;
    const topic = searchParams.get('topic') || undefined;
    const check = searchParams.get('check') === 'true';

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    // If a specific category is requested, return that fatigue level
    if (category) {
      const fatigue = await getFatigueLevel(workspaceId, category, topic);

      return NextResponse.json({
        workspaceId,
        category,
        fatigue,
      });
    }

    // If check=true, run the pre-publish check
    if (check) {
      const topicParam = searchParams.get('checkTopic') || undefined;
      const tone = searchParams.get('checkTone') || undefined;
      const hook = searchParams.get('checkHook') || undefined;

      const checkResult = await checkBeforePublish(workspaceId, topicParam, tone, hook);

      return NextResponse.json({
        workspaceId,
        check: checkResult,
      });
    }

    // Default: return full energy report
    const report = await getEnergyReport(workspaceId);

    // Also apply natural decay
    const decayResult = await applyNaturalDecay(workspaceId);

    console.log(`[Energy API] Report for ${workspaceId}: energy=${report.overallEnergy}, canPublish=${report.canPublish}`);

    return NextResponse.json({
      report,
      decayApplied: decayResult.entriesDecayed,
    });
  } catch (error) {
    console.error('[Energy API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to get energy report', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// ─── POST: Track Fatigue / Reset ─────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId, category, topic, action } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    // ─── Reset Action ──────────────────────────────────────────────────
    if (action === 'reset') {
      const resetCategory = category || 'publish_saturation';
      const result = await resetFatigue(workspaceId, resetCategory, topic);

      console.log(`[Energy API] Reset fatigue for ${resetCategory} in workspace ${workspaceId} — ${result.reset} entries reset`);

      return NextResponse.json({
        success: true,
        action: 'reset',
        category: resetCategory,
        topic: topic || null,
        resetCount: result.reset,
      });
    }

    // ─── Track Fatigue ─────────────────────────────────────────────────
    if (!category) {
      return NextResponse.json(
        { error: 'category is required for tracking fatigue' },
        { status: 400 }
      );
    }

    const validCategories: EnergyCategory[] = [
      'topic_fatigue',
      'tone_fatigue',
      'publish_saturation',
      'audience_exhaustion',
      'hook_repetition',
    ];

    if (!validCategories.includes(category as EnergyCategory)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    let result;

    switch (category as EnergyCategory) {
      case 'topic_fatigue':
        result = await trackTopicFatigue(workspaceId, topic || 'general');
        break;
      case 'tone_fatigue':
        result = await trackToneFatigue(workspaceId, topic || 'professional');
        break;
      case 'publish_saturation':
        result = await trackPublishSaturation(workspaceId);
        break;
      case 'hook_repetition':
        result = await trackHookRepetition(workspaceId, topic || 'default');
        break;
      case 'audience_exhaustion':
        // Audience exhaustion uses same tracking mechanism
        result = await trackPublishSaturation(workspaceId);
        break;
    }

    console.log(`[Energy API] Tracked ${category} for workspace ${workspaceId}: score=${result.fatigueScore}, status=${result.status}`);

    return NextResponse.json({
      success: true,
      action: 'track',
      ...result,
    });
  } catch (error) {
    console.error('[Energy API] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to track fatigue', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
