/**
 * AI Content Generation API
 * POST /api/content/[id]/generate — Generate content using ai-orchestrator
 * Body: { action: 'draft' | 'humanic' | 'seo' | 'repurpose', platform?, angle? }
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  generateDraft,
  humanicRewrite,
  generateSeoPack,
  generateRepurpose,
  generateTags,
  generateSummary,
} from '@/lib/ai-orchestrator';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, platform, angle, tone, targetLength } = body;

    // Validate action
    const validActions = ['draft', 'humanic', 'seo', 'repurpose'];
    if (!action || !validActions.includes(action)) {
      return NextResponse.json(
        { error: `action is required and must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    // Fetch content item
    const contentItem = await db.contentItem.findUnique({
      where: { id },
      include: { seoData: true, contentTags: true },
    });

    if (!contentItem || contentItem.status === 'archived') {
      return NextResponse.json(
        { error: 'Content item not found' },
        { status: 404 }
      );
    }

    console.log(`[Generate API] Starting ${action} generation for content ${id}`);

    let result: Record<string, unknown> = {};

    switch (action) {
      // ─── Draft Generation ─────────────────────────────────────────────
      case 'draft': {
        const idea = contentItem.sourceNotes || contentItem.title;
        const sources = contentItem.sourceNotes
          ? [contentItem.sourceNotes]
          : [];

        const draft = await generateDraft({
          idea,
          sources,
          angle: angle || contentItem.angle || undefined,
          workspaceId: contentItem.workspaceId,
          tone,
          targetLength,
        });

        // Update content item with draft
        await db.contentItem.update({
          where: { id },
          data: {
            title: draft.title || contentItem.title,
            subtitle: draft.subtitle || null,
            slug: draft.slug || contentItem.slug,
            masterMarkdown: draft.markdown,
            summary: draft.summary || null,
            angle: draft.suggestedAngle || contentItem.angle,
            status: 'draft',
            version: { increment: 1 },
          },
        });

        // Create tags
        if (draft.tags && draft.tags.length > 0) {
          await db.contentTag.deleteMany({ where: { contentId: id } });
          await db.contentTag.createMany({
            data: draft.tags.map((tag) => ({
              contentId: id,
              tag,
              category: 'topic',
            })),
            skipDuplicates: true,
          });
        }

        result = {
          action: 'draft',
          title: draft.title,
          subtitle: draft.subtitle,
          slug: draft.slug,
          summary: draft.summary,
          tags: draft.tags,
          suggestedAngle: draft.suggestedAngle,
          contentLength: draft.markdown.length,
        };
        break;
      }

      // ─── Humanic Rewrite ──────────────────────────────────────────────
      case 'humanic': {
        if (!contentItem.masterMarkdown) {
          return NextResponse.json(
            { error: 'Content must have a draft before humanic rewrite. Generate a draft first.' },
            { status: 400 }
          );
        }

        const humanic = await humanicRewrite(contentItem.masterMarkdown);

        await db.contentItem.update({
          where: { id },
          data: {
            masterMarkdown: humanic.markdown,
            humanicScore: humanic.humanicScore,
            status: 'editing',
            version: { increment: 1 },
          },
        });

        result = {
          action: 'humanic',
          changesApplied: humanic.changesApplied,
          humanicScore: humanic.humanicScore,
          contentLength: humanic.markdown.length,
        };
        break;
      }

      // ─── SEO Pack Generation ──────────────────────────────────────────
      case 'seo': {
        if (!contentItem.masterMarkdown) {
          return NextResponse.json(
            { error: 'Content must have a draft before SEO generation. Generate a draft first.' },
            { status: 400 }
          );
        }

        const seo = await generateSeoPack(contentItem.masterMarkdown);

        // Upsert SEO data
        await db.seoData.upsert({
          where: { contentId: id },
          create: {
            contentId: id,
            metaTitle: seo.metaTitle,
            metaDescription: seo.metaDescription,
            focusKeyword: seo.focusKeyword,
            secondaryKeywords: seo.secondaryKeywords?.join(',') || null,
            slug: seo.slug,
            headingStructure: seo.headingStructure,
            schemaMarkup: seo.schemaMarkup,
            readabilityScore: seo.readabilityScore,
          },
          update: {
            metaTitle: seo.metaTitle,
            metaDescription: seo.metaDescription,
            focusKeyword: seo.focusKeyword,
            secondaryKeywords: seo.secondaryKeywords?.join(',') || null,
            slug: seo.slug,
            headingStructure: seo.headingStructure,
            schemaMarkup: seo.schemaMarkup,
            readabilityScore: seo.readabilityScore,
          },
        });

        await db.contentItem.update({
          where: { id },
          data: {
            status: 'seo_review',
            seoScore: seo.readabilityScore,
          },
        });

        result = {
          action: 'seo',
          metaTitle: seo.metaTitle,
          metaDescription: seo.metaDescription,
          focusKeyword: seo.focusKeyword,
          secondaryKeywords: seo.secondaryKeywords,
          slug: seo.slug,
          readabilityScore: seo.readabilityScore,
        };
        break;
      }

      // ─── Repurpose for Platform ───────────────────────────────────────
      case 'repurpose': {
        if (!contentItem.masterMarkdown) {
          return NextResponse.json(
            { error: 'Content must have a draft before repurposing. Generate a draft first.' },
            { status: 400 }
          );
        }

        const targetPlatform = platform || 'wordpress';

        const repurposed = await generateRepurpose(
          contentItem.masterMarkdown,
          targetPlatform
        );

        // Create or update content variant
        const variant = await db.contentVariant.upsert({
          where: {
            contentId_platform_variantType: {
              contentId: id,
              platform: targetPlatform,
              variantType: repurposed.variantType,
            },
          },
          create: {
            contentId: id,
            platform: targetPlatform,
            variantType: repurposed.variantType,
            title: repurposed.title,
            body: repurposed.body,
            metadataJson: JSON.stringify(repurposed.metadataJson),
            status: 'ready',
          },
          update: {
            title: repurposed.title,
            body: repurposed.body,
            metadataJson: JSON.stringify(repurposed.metadataJson),
            status: 'ready',
          },
        });

        result = {
          action: 'repurpose',
          platform: targetPlatform,
          variantId: variant.id,
          title: repurposed.title,
          variantType: repurposed.variantType,
          bodyLength: repurposed.body.length,
        };
        break;
      }
    }

    console.log(`[Generate API] ${action} generation completed for content ${id}`);

    return NextResponse.json({
      success: true,
      contentId: id,
      ...result,
    });
  } catch (error) {
    console.error('[Generate API] POST error:', error);
    return NextResponse.json(
      { error: 'Content generation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
