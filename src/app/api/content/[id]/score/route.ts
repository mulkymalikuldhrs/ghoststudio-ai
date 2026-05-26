/**
 * Content Scoring API
 * POST /api/content/[id]/score — Score content using content-scoring module
 * Returns writing, humanic, SEO, trust, composite scores with action recommendation
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { scoreContentFull, saveContentScores, type SeoDataInput, type SourceData } from '@/lib/content-scoring';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch content item with SEO data
    const contentItem = await db.contentItem.findUnique({
      where: { id },
      include: {
        seoData: true,
        contentTags: true,
      },
    });

    if (!contentItem || contentItem.status === 'archived') {
      return NextResponse.json(
        { error: 'Content item not found' },
        { status: 404 }
      );
    }

    if (!contentItem.masterMarkdown) {
      return NextResponse.json(
        { error: 'Content must have a draft before scoring. Generate a draft first.' },
        { status: 400 }
      );
    }

    console.log(`[Score API] Scoring content ${id}`);

    // Prepare SEO data input
    const seoInput: SeoDataInput = {
      metaTitle: contentItem.seoData?.metaTitle || undefined,
      metaDescription: contentItem.seoData?.metaDescription || undefined,
      focusKeyword: contentItem.seoData?.focusKeyword || undefined,
      secondaryKeywords: contentItem.seoData?.secondaryKeywords
        ? contentItem.seoData.secondaryKeywords.split(',')
        : undefined,
      slug: contentItem.seoData?.slug || undefined,
      headingStructure: contentItem.seoData?.headingStructure || undefined,
      content: contentItem.masterMarkdown,
      readabilityScore: contentItem.seoData?.readabilityScore || undefined,
    };

    // Prepare source data input
    const sourceInput: SourceData = {
      content: contentItem.masterMarkdown,
      topic: contentItem.topic || undefined,
      sources: contentItem.sourceNotes ? [contentItem.sourceNotes] : undefined,
    };

    // Run full scoring pipeline
    const scores = await scoreContentFull(
      contentItem.masterMarkdown,
      seoInput,
      sourceInput
    );

    // Save scores to content item
    await saveContentScores(id, scores.composite);

    // Update content status based on action recommendation
    const statusUpdate: Record<string, unknown> = {};
    if (scores.composite.action === 'auto_schedule') {
      statusUpdate.status = 'ready';
      statusUpdate.humanReviewRequired = false;
    } else if (scores.composite.action === 'human_review') {
      statusUpdate.humanReviewRequired = true;
    } else if (scores.composite.action === 'reject_rewrite') {
      statusUpdate.humanReviewRequired = true;
      statusUpdate.status = 'editing';
    }

    if (Object.keys(statusUpdate).length > 0) {
      await db.contentItem.update({
        where: { id },
        data: statusUpdate,
      });
    }

    console.log(`[Score API] Content ${id} scored: composite=${scores.composite.score}, action=${scores.composite.action}`);

    return NextResponse.json({
      contentId: id,
      scores: {
        writing: scores.writing,
        humanic: scores.humanic,
        seo: scores.seo,
        trust: scores.trust,
        composite: scores.composite,
      },
      recommendation: scores.composite.action,
      message: getActionMessage(scores.composite.action, scores.composite.score),
    });
  } catch (error) {
    console.error('[Score API] POST error:', error);
    return NextResponse.json(
      { error: 'Content scoring failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function getActionMessage(
  action: 'auto_schedule' | 'human_review' | 'reject_rewrite',
  score: number
): string {
  switch (action) {
    case 'auto_schedule':
      return `Content scored ${score}/100 — quality is high enough for auto-scheduling.`;
    case 'human_review':
      return `Content scored ${score}/100 — human review is recommended before publishing.`;
    case 'reject_rewrite':
      return `Content scored ${score}/100 — score is too low. Rewrite is recommended.`;
  }
}
