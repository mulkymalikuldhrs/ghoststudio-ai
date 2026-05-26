import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requireWorkspaceAccess } from "@/lib/auth-guard";
import { GenerateContentSchema, formatZodErrors } from "@/lib/validators";
import { routeToAgent } from "@/lib/ai-orchestrator";

// Action-to-job-type mapping for the AI orchestrator
const ACTION_JOB_MAP: Record<string, string> = {
  draft: "draft_job",
  humanic: "rewrite_job",
  seo: "seo_job",
  repurpose: "repurpose_job",
  tiktok: "tiktok_job",
};

// POST /api/content/[id]/generate - Generate content using AI agents
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    const { id } = await params;

    const body = await request.json();
    const validation = GenerateContentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: formatZodErrors(validation.error) },
        { status: 400 }
      );
    }

    const { action, platform, options } = validation.data;

    const contentItem = await db.contentItem.findUnique({
      where: { id },
      include: { variants: true },
    });

    if (!contentItem) {
      return NextResponse.json(
        { error: "Content item not found" },
        { status: 404 }
      );
    }

    // Verify workspace access
    await requireWorkspaceAccess(request, contentItem.workspaceId);

    // Update status to indicate generation in progress
    await db.contentItem.update({
      where: { id },
      data: { status: "editing" },
    });

    const jobType = ACTION_JOB_MAP[action];
    if (!jobType) {
      return NextResponse.json(
        { error: `Unsupported action: ${action}` },
        { status: 400 }
      );
    }

    // Build payload based on action type
    const payload: Record<string, unknown> = {
      contentId: id,
      workspaceId: contentItem.workspaceId,
      platform,
      ...options,
    };

    // Add action-specific data
    switch (action) {
      case "draft":
        payload.idea = contentItem.title;
        payload.sources = contentItem.sourceNotes ? [contentItem.sourceNotes] : [];
        payload.angle = contentItem.angle;
        payload.workspaceId = contentItem.workspaceId;
        break;
      case "humanic":
        payload.markdown = contentItem.masterMarkdown || "";
        payload.workspaceId = contentItem.workspaceId;
        break;
      case "seo":
        payload.content = contentItem.masterMarkdown || "";
        payload.workspaceId = contentItem.workspaceId;
        break;
      case "repurpose":
        payload.content = contentItem.masterMarkdown || "";
        payload.platform = platform || "wordpress";
        payload.workspaceId = contentItem.workspaceId;
        break;
      case "tiktok":
        payload.topic = contentItem.title;
        payload.content = contentItem.masterMarkdown || "";
        payload.workspaceId = contentItem.workspaceId;
        break;
    }

    // Route to the appropriate agent via the AI orchestrator
    const agentResult = await routeToAgent(jobType, payload, contentItem.workspaceId);

    // Update content item with results
    if (agentResult.status === "agent_completed" && agentResult.result) {
      const result = agentResult.result as Record<string, unknown>;
      const updateData: Record<string, unknown> = {};

      switch (action) {
        case "draft": {
          const markdown = result.markdown as string | undefined;
          if (markdown) {
            updateData.masterMarkdown = markdown;
            updateData.status = "draft";
            updateData.summary = result.summary as string || undefined;
          }
          break;
        }
        case "humanic": {
          const markdown = result.markdown as string | undefined;
          if (markdown) {
            updateData.masterMarkdown = markdown;
            updateData.status = "editing";
          }
          break;
        }
        case "seo": {
          updateData.status = "seo_review";
          // Create/update SEO data if returned
          if (result.metaTitle || result.metaDescription || result.focusKeyword) {
            await db.seoData.upsert({
              where: { contentId: id },
              update: {
                metaTitle: result.metaTitle as string || undefined,
                metaDescription: result.metaDescription as string || undefined,
                focusKeyword: result.focusKeyword as string || undefined,
                secondaryKeywords: result.secondaryKeywords as string || undefined,
                slug: result.slug as string || undefined,
              },
              create: {
                contentId: id,
                metaTitle: result.metaTitle as string || null,
                metaDescription: result.metaDescription as string || null,
                focusKeyword: result.focusKeyword as string || null,
                secondaryKeywords: result.secondaryKeywords as string || null,
                slug: result.slug as string || null,
              },
            });
          }
          break;
        }
        case "repurpose": {
          // Repurpose creates a variant
          if (result.body && platform) {
            await db.contentVariant.upsert({
              where: {
                contentId_platform_variantType: {
                  contentId: id,
                  platform: platform,
                  variantType: "full",
                },
              },
              update: {
                body: result.body as string,
                title: result.title as string || undefined,
                metadataJson: JSON.stringify(result.metadata || {}),
                status: "ready",
              },
              create: {
                contentId: id,
                platform: platform,
                variantType: "full",
                body: result.body as string,
                title: result.title as string || null,
                metadataJson: JSON.stringify(result.metadata || {}),
                status: "ready",
              },
            });
          }
          break;
        }
        case "tiktok": {
          // TikTok creates a tiktok variant
          if (result.content || result.script) {
            await db.contentVariant.upsert({
              where: {
                contentId_platform_variantType: {
                  contentId: id,
                  platform: "tiktok",
                  variantType: "full",
                },
              },
              update: {
                body: (result.content || result.script) as string,
                title: result.title as string || undefined,
                metadataJson: JSON.stringify({
                  hashtags: result.hashtags,
                  sounds: result.sounds,
                  hook: result.hook,
                }),
                status: "ready",
              },
              create: {
                contentId: id,
                platform: "tiktok",
                variantType: "full",
                body: (result.content || result.script) as string,
                title: result.title as string || null,
                metadataJson: JSON.stringify({
                  hashtags: result.hashtags,
                  sounds: result.sounds,
                  hook: result.hook,
                }),
                status: "ready",
              },
            });
          }
          break;
        }
      }

      if (Object.keys(updateData).length > 0) {
        await db.contentItem.update({
          where: { id },
          data: updateData,
        });
      }
    }

    // Log the generation
    await db.systemLog.create({
      data: {
        service: "ai",
        level: agentResult.status === "agent_completed" ? "info" : "error",
        action: "content_generate",
        message: `Content generation ${agentResult.status} for: ${contentItem.title} (action: ${action})`,
        metadataJson: JSON.stringify({
          contentId: id,
          action,
          agentStatus: agentResult.status,
          agentName: agentResult.agentName,
          executionTime: agentResult.executionTime,
        }),
      },
    });

    return NextResponse.json({
      message: agentResult.status === "agent_completed"
        ? "Content generation completed"
        : "Content generation started",
      contentId: id,
      action,
      agentResult,
      status: "editing",
    });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Content generate error:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}
