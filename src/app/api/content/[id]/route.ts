/**
 * Single Content Item API
 * GET    /api/content/[id]   — Get content item with variants, SEO data, tags
 * PUT    /api/content/[id]   — Update content item (master markdown, status, scores)
 * DELETE /api/content/[id]   — Soft delete (set status to 'archived')
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ─── GET: Get Content Item ───────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const item = await db.contentItem.findUnique({
      where: { id },
      include: {
        variants: {
          orderBy: { createdAt: 'desc' },
        },
        seoData: true,
        contentTags: true,
        publishJobs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        analyticsEvents: {
          orderBy: { capturedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!item || item.status === 'archived') {
      return NextResponse.json(
        { error: 'Content item not found' },
        { status: 404 }
      );
    }

    console.log(`[Content API] Retrieved content item ${id}`);

    return NextResponse.json({ item });
  } catch (error) {
    console.error('[Content API] GET [id] error:', error);
    return NextResponse.json(
      { error: 'Failed to get content item', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// ─── PUT: Update Content Item ────────────────────────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Verify content exists
    const existing = await db.contentItem.findUnique({
      where: { id },
    });

    if (!existing || existing.status === 'archived') {
      return NextResponse.json(
        { error: 'Content item not found' },
        { status: 404 }
      );
    }

    // Build update data from allowed fields
    const updateData: Record<string, unknown> = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.subtitle !== undefined) updateData.subtitle = body.subtitle;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.masterMarkdown !== undefined) updateData.masterMarkdown = body.masterMarkdown;
    if (body.summary !== undefined) updateData.summary = body.summary;
    if (body.angle !== undefined) updateData.angle = body.angle;
    if (body.topic !== undefined) updateData.topic = body.topic;
    if (body.sourceNotes !== undefined) updateData.sourceNotes = body.sourceNotes;
    if (body.sourceType !== undefined) updateData.sourceType = body.sourceType;

    // Score updates
    if (body.qualityScore !== undefined) updateData.qualityScore = body.qualityScore;
    if (body.humanicScore !== undefined) updateData.humanicScore = body.humanicScore;
    if (body.seoScore !== undefined) updateData.seoScore = body.seoScore;
    if (body.trustScore !== undefined) updateData.trustScore = body.trustScore;
    if (body.humanReviewRequired !== undefined) updateData.humanReviewRequired = body.humanReviewRequired;

    // Status transitions with validation
    if (body.status !== undefined) {
      const validStatuses = ['idea', 'draft', 'editing', 'seo_review', 'ready', 'scheduled', 'published', 'archived', 'failed'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
      updateData.status = body.status;

      // Auto-set publishedAt when status changes to published
      if (body.status === 'published' && existing.status !== 'published') {
        updateData.publishedAt = new Date();
      }
    }

    // Increment version on significant changes
    if (body.masterMarkdown !== undefined && body.masterMarkdown !== existing.masterMarkdown) {
      updateData.version = existing.version + 1;
    }

    const updated = await db.contentItem.update({
      where: { id },
      data: updateData,
      include: {
        variants: true,
        seoData: true,
        contentTags: true,
      },
    });

    // Update SEO data if provided
    if (body.seoData) {
      await db.seoData.upsert({
        where: { contentId: id },
        create: {
          contentId: id,
          metaTitle: body.seoData.metaTitle,
          metaDescription: body.seoData.metaDescription,
          focusKeyword: body.seoData.focusKeyword,
          secondaryKeywords: body.seoData.secondaryKeywords
            ? Array.isArray(body.seoData.secondaryKeywords)
              ? body.seoData.secondaryKeywords.join(',')
              : body.seoData.secondaryKeywords
            : undefined,
          slug: body.seoData.slug,
          headingStructure: body.seoData.headingStructure,
          schemaMarkup: body.seoData.schemaMarkup,
          readabilityScore: body.seoData.readabilityScore,
        },
        update: {
          ...(body.seoData.metaTitle !== undefined && { metaTitle: body.seoData.metaTitle }),
          ...(body.seoData.metaDescription !== undefined && { metaDescription: body.seoData.metaDescription }),
          ...(body.seoData.focusKeyword !== undefined && { focusKeyword: body.seoData.focusKeyword }),
          ...(body.seoData.secondaryKeywords !== undefined && {
            secondaryKeywords: Array.isArray(body.seoData.secondaryKeywords)
              ? body.seoData.secondaryKeywords.join(',')
              : body.seoData.secondaryKeywords,
          }),
          ...(body.seoData.slug !== undefined && { slug: body.seoData.slug }),
          ...(body.seoData.headingStructure !== undefined && { headingStructure: body.seoData.headingStructure }),
          ...(body.seoData.schemaMarkup !== undefined && { schemaMarkup: body.seoData.schemaMarkup }),
          ...(body.seoData.readabilityScore !== undefined && { readabilityScore: body.seoData.readabilityScore }),
        },
      });
    }

    // Update tags if provided
    if (body.tags && Array.isArray(body.tags)) {
      // Remove existing tags and create new ones
      await db.contentTag.deleteMany({ where: { contentId: id } });
      if (body.tags.length > 0) {
        await db.contentTag.createMany({
          data: body.tags.map((tag: { tag: string; category?: string }) => ({
            contentId: id,
            tag: tag.tag || tag,
            category: tag.category || 'topic',
          })),
        });
      }
    }

    console.log(`[Content API] Updated content item ${id} — fields: ${Object.keys(updateData).join(', ')}`);

    // Re-fetch with all relations after updates
    const finalItem = await db.contentItem.findUnique({
      where: { id },
      include: {
        variants: true,
        seoData: true,
        contentTags: true,
      },
    });

    return NextResponse.json({ item: finalItem });
  } catch (error) {
    console.error('[Content API] PUT [id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update content item', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// ─── DELETE: Soft Delete (Archive) ───────────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.contentItem.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Content item not found' },
        { status: 404 }
      );
    }

    if (existing.status === 'archived') {
      return NextResponse.json(
        { error: 'Content item is already archived' },
        { status: 400 }
      );
    }

    await db.contentItem.update({
      where: { id },
      data: { status: 'archived' },
    });

    console.log(`[Content API] Archived content item ${id}`);

    return NextResponse.json({
      success: true,
      message: `Content item ${id} archived`,
    });
  } catch (error) {
    console.error('[Content API] DELETE [id] error:', error);
    return NextResponse.json(
      { error: 'Failed to archive content item', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
