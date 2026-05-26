/**
 * Publishing API
 * POST /api/publish — Publish content to platform
 * Body: { contentId, platform, action: 'draft' | 'publish' | 'schedule', scheduledTime? }
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getPublisher, validateCredentials, type SupportedPlatform } from '@/lib/publishers';
import { scheduleContent } from '@/lib/scheduler';
import { checkBeforePublish } from '@/lib/energy-system';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contentId, platform, action, scheduledTime } = body;

    // Validate required fields
    if (!contentId || !platform || !action) {
      return NextResponse.json(
        { error: 'contentId, platform, and action are required' },
        { status: 400 }
      );
    }

    const validActions = ['draft', 'publish', 'schedule'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `action must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    // Fetch content item with variant
    const contentItem = await db.contentItem.findUnique({
      where: { id: contentId },
      include: {
        variants: {
          where: { platform },
        },
        seoData: true,
      },
    });

    if (!contentItem || contentItem.status === 'archived') {
      return NextResponse.json(
        { error: 'Content item not found' },
        { status: 404 }
      );
    }

    // Get the content to publish (variant or master)
    const variant = contentItem.variants[0];
    const publishContent = variant?.body || contentItem.masterMarkdown;
    const publishTitle = variant?.title || contentItem.title;

    if (!publishContent) {
      return NextResponse.json(
        { error: 'No content available to publish. Generate a draft first.' },
        { status: 400 }
      );
    }

    // Check energy levels before publishing
    const energyCheck = await checkBeforePublish(
      contentItem.workspaceId,
      contentItem.topic || undefined,
      undefined,
      undefined
    );

    if (!energyCheck.allowed && action === 'publish') {
      console.warn(`[Publish API] Energy check blocked publishing for ${contentId}: ${energyCheck.warnings.join('; ')}`);
      return NextResponse.json(
        {
          error: 'Energy levels too low for publishing',
          warnings: energyCheck.warnings,
          fatigueLevels: energyCheck.fatigueLevels,
        },
        { status: 429 }
      );
    }

    // Get workspace credentials for the platform
    const credentials = await db.apiCredential.findFirst({
      where: {
        workspaceId: contentItem.workspaceId,
        platform,
        isActive: true,
      },
    });

    if (!credentials) {
      return NextResponse.json(
        { error: `No ${platform} credentials found for this workspace. Configure credentials first.` },
        { status: 400 }
      );
    }

    // Build credentials object
    const publisherCredentials = {
      platform: platform as SupportedPlatform,
      endpointUrl: credentials.endpointUrl || undefined,
      username: undefined as string | undefined,
      password: undefined as string | undefined,
      apiKey: undefined as string | undefined,
    };

    // Parse credential data (in production, decrypt encryptedToken)
    try {
      const credData = JSON.parse(credentials.encryptedToken);
      publisherCredentials.username = credData.username;
      publisherCredentials.password = credData.password;
      publisherCredentials.apiKey = credData.apiKey;
    } catch {
      // If not JSON, treat as a single token/apiKey
      publisherCredentials.apiKey = credentials.encryptedToken;
    }

    // Validate credentials
    const credValidation = validateCredentials(platform as SupportedPlatform, publisherCredentials);
    if (!credValidation.valid) {
      return NextResponse.json(
        { error: `Missing ${platform} credentials: ${credValidation.missing.join(', ')}` },
        { status: 400 }
      );
    }

    // ─── Schedule action ──────────────────────────────────────────────────
    if (action === 'schedule') {
      if (!scheduledTime) {
        return NextResponse.json(
          { error: 'scheduledTime is required for schedule action' },
          { status: 400 }
        );
      }

      const scheduledDate = new Date(scheduledTime);
      if (scheduledDate <= new Date()) {
        return NextResponse.json(
          { error: 'scheduledTime must be in the future' },
          { status: 400 }
        );
      }

      const scheduleResult = await scheduleContent({
        workspaceId: contentItem.workspaceId,
        contentId,
        platform,
        scheduledTime: scheduledDate,
        contentVariantId: variant?.id,
      });

      console.log(`[Publish API] Content ${contentId} scheduled for ${scheduledDate.toISOString()}`);

      return NextResponse.json({
        success: true,
        action: 'schedule',
        contentId,
        platform,
        scheduledTime: scheduledDate.toISOString(),
        schedulerJobId: scheduleResult.schedulerJobId,
        publishJobId: scheduleResult.publishJobId,
      });
    }

    // ─── Draft / Publish actions (immediate) ──────────────────────────────
    const publisher = getPublisher(platform as SupportedPlatform, publisherCredentials);

    // Build the post data
    const postData = {
      title: publishTitle,
      content: publishContent,
      slug: contentItem.slug,
      excerpt: contentItem.summary || undefined,
      metaTitle: contentItem.seoData?.metaTitle || undefined,
    };

    let publishResult: unknown;

    if (action === 'draft') {
      publishResult = await publisher.createDraft(postData);
    } else {
      publishResult = await publisher.publish({
        ...postData,
        status: 'publish',
      });
    }

    // Record the publish job
    const publishJob = await db.publishJob.create({
      data: {
        workspaceId: contentItem.workspaceId,
        contentId,
        contentVariantId: variant?.id || null,
        platform,
        status: action === 'draft' ? 'published' : 'published',
        publishedTime: new Date(),
        responsePayload: JSON.stringify(publishResult),
      },
    });

    // Update content item status
    await db.contentItem.update({
      where: { id: contentId },
      data: {
        status: action === 'draft' ? 'draft' : 'published',
        publishedAt: action === 'publish' ? new Date() : undefined,
      },
    });

    console.log(`[Publish API] Content ${contentId} ${action}ed to ${platform}`);

    return NextResponse.json({
      success: true,
      action,
      contentId,
      platform,
      publishJobId: publishJob.id,
      result: publishResult,
      energyWarnings: energyCheck.warnings,
    });
  } catch (error) {
    console.error('[Publish API] POST error:', error);
    return NextResponse.json(
      { error: 'Publishing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
