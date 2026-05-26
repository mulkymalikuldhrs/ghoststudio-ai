/**
 * Content CRUD API
 * GET  /api/content          — List content items (with filtering by status, topic, workspaceId)
 * POST /api/content          — Create new content item (idea → draft pipeline)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateDraft } from '@/lib/ai-orchestrator';

// ─── GET: List Content Items ─────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const status = searchParams.get('status');
    const topic = searchParams.get('topic');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = {
      workspaceId,
    };

    if (status) {
      where.status = status;
    } else {
      where.status = { not: 'archived' };
    }

    if (topic) {
      where.topic = { contains: topic };
    }

    const [items, total] = await Promise.all([
      db.contentItem.findMany({
        where,
        include: {
          contentTags: true,
          seoData: true,
          _count: { select: { variants: true, analyticsEvents: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.contentItem.count({ where }),
    ]);

    console.log(`[Content API] Listed ${items.length}/${total} items for workspace ${workspaceId}`);

    return NextResponse.json({
      items,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[Content API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to list content items', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// ─── POST: Create Content Item ───────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      workspaceId,
      idea,
      sources,
      angle,
      tone,
      topic,
      sourceType = 'idea',
      autoDraft = true,
    } = body;

    if (!workspaceId || !idea) {
      return NextResponse.json(
        { error: 'workspaceId and idea are required' },
        { status: 400 }
      );
    }

    // Verify workspace exists
    const workspace = await db.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    // Create content item with initial idea
    const slug = idea
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 60)
      .replace(/^-|-$/g, '');

    const contentItem = await db.contentItem.create({
      data: {
        workspaceId,
        title: idea.slice(0, 200),
        slug,
        angle: angle || null,
        topic: topic || null,
        status: 'idea',
        sourceNotes: sources ? JSON.stringify(sources) : null,
        sourceType,
        masterMarkdown: null,
        summary: null,
      },
    });

    console.log(`[Content API] Created content item ${contentItem.id} — "${idea.slice(0, 60)}"`);

    // Optionally auto-generate draft
    let draftResult = null;
    if (autoDraft) {
      try {
        console.log(`[Content API] Auto-generating draft for ${contentItem.id}...`);
        draftResult = await generateDraft({
          idea,
          sources: sources || [],
          angle,
          workspaceId,
          tone,
        });

        // Update content item with draft
        await db.contentItem.update({
          where: { id: contentItem.id },
          data: {
            title: draftResult.title || contentItem.title,
            subtitle: draftResult.subtitle || null,
            slug: draftResult.slug || contentItem.slug,
            masterMarkdown: draftResult.markdown,
            summary: draftResult.summary || null,
            angle: draftResult.suggestedAngle || angle || null,
            status: 'draft',
          },
        });

        // Create tags from generated tags
        if (draftResult.tags && draftResult.tags.length > 0) {
          await db.contentTag.createMany({
            data: draftResult.tags.map((tag) => ({
              contentId: contentItem.id,
              tag,
              category: 'topic',
            })),
            skipDuplicates: true,
          });
        }

        console.log(`[Content API] Draft generated for ${contentItem.id}`);
      } catch (draftError) {
        console.error(`[Content API] Draft generation failed for ${contentItem.id}:`, draftError);
        // Content item remains in "idea" status — draft can be retried
      }
    }

    // Fetch the final state with relations
    const finalItem = await db.contentItem.findUnique({
      where: { id: contentItem.id },
      include: {
        contentTags: true,
        seoData: true,
        variants: true,
      },
    });

    return NextResponse.json(
      {
        item: finalItem,
        draftGenerated: !!draftResult,
        draft: draftResult
          ? {
              title: draftResult.title,
              subtitle: draftResult.subtitle,
              tags: draftResult.tags,
              suggestedAngle: draftResult.suggestedAngle,
            }
          : null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Content API] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create content item', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
