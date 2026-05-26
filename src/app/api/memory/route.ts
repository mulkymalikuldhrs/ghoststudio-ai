/**
 * Memory System API
 * GET  /api/memory — Search/retrieve memories (query params: workspaceId, category, limit, search)
 * POST /api/memory — Store new memory
 * PUT  /api/memory — Update memory score
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  storeMemory,
  retrieveMemory,
  searchMemory,
  updateMemoryScore,
  getMemoryStats,
  detectPatterns,
  type MemoryInput,
} from '@/lib/memory-system';

// ─── GET: Search/Retrieve Memories ───────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    let memories;
    let stats;

    if (search) {
      // Search mode
      memories = await searchMemory(workspaceId, search, category);
    } else if (category) {
      // Category retrieval mode
      memories = await retrieveMemory(workspaceId, category, limit);
    } else {
      // Get all memories across categories (limited)
      const categories = ['hook', 'topic', 'tone', 'timing', 'cta', 'format', 'platform', 'monetization', 'audience', 'style'];
      const allMemories = [];
      for (const cat of categories) {
        const catMemories = await retrieveMemory(workspaceId, cat, Math.ceil(limit / categories.length));
        allMemories.push(...catMemories);
      }
      memories = allMemories
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    }

    // Always include stats
    stats = await getMemoryStats(workspaceId);

    // Include patterns if requested
    const includePatterns = searchParams.get('includePatterns') === 'true';
    const patterns = includePatterns ? await detectPatterns(workspaceId) : undefined;

    console.log(`[Memory API] Retrieved ${memories.length} memories for workspace ${workspaceId}`);

    return NextResponse.json({
      memories,
      stats,
      ...(patterns && { patterns }),
    });
  } catch (error) {
    console.error('[Memory API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve memories', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// ─── POST: Store New Memory ──────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId, category, key, value, score, source, contextJson } = body;

    if (!workspaceId || !category || !key || !value) {
      return NextResponse.json(
        { error: 'workspaceId, category, key, and value are required' },
        { status: 400 }
      );
    }

    const input: MemoryInput = {
      workspaceId,
      category,
      key,
      value,
      score: score || 0,
      source: source || 'manual',
      contextJson: contextJson || undefined,
    };

    const result = await storeMemory(input);

    console.log(`[Memory API] Stored memory [${category}/${key}] in workspace ${workspaceId} (created=${result.created})`);

    return NextResponse.json(
      {
        success: true,
        memoryId: result.id,
        created: result.created,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Memory API] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to store memory', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// ─── PUT: Update Memory Score ────────────────────────────────────────────────

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { memoryId, score } = body;

    if (!memoryId || score === undefined) {
      return NextResponse.json(
        { error: 'memoryId and score are required' },
        { status: 400 }
      );
    }

    if (typeof score !== 'number' || score < 0 || score > 100) {
      return NextResponse.json(
        { error: 'score must be a number between 0 and 100' },
        { status: 400 }
      );
    }

    await updateMemoryScore(memoryId, score);

    console.log(`[Memory API] Updated memory ${memoryId} score to ${score}`);

    return NextResponse.json({
      success: true,
      memoryId,
      score,
    });
  } catch (error) {
    console.error('[Memory API] PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update memory score', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
