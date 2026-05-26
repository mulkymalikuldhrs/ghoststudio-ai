import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requireWorkspaceAccess } from "@/lib/auth-guard";
import { CreateContentSchema, formatZodErrors } from "@/lib/validators";
import { routeToAgent } from "@/lib/ai-orchestrator";

// GET /api/content - List content items (workspace-scoped)
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required" },
        { status: 400 }
      );
    }

    // Verify workspace access
    const { workspace } = await requireWorkspaceAccess(request, workspaceId);

    const where: Record<string, unknown> = { workspaceId: workspace.id };
    if (status) {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      db.contentItem.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          variants: true,
          seoData: true,
          contentTags: true,
        },
      }),
      db.contentItem.count({ where }),
    ]);

    return NextResponse.json({ items, total, limit, offset });
  } catch (error) {
    // Auth guard throws NextResponse directly
    if (error instanceof NextResponse) return error;
    console.error("Content list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch content items" },
      { status: 500 }
    );
  }
}

// POST /api/content - Create content item with optional AI draft generation
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    const body = await request.json();
    const validation = CreateContentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: formatZodErrors(validation.error) },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verify workspace access
    const { workspace } = await requireWorkspaceAccess(request, data.workspaceId);

    // Create the content item
    const item = await db.contentItem.create({
      data: {
        workspaceId: workspace.id,
        title: data.title,
        subtitle: data.subtitle,
        slug: data.slug,
        angle: data.angle,
        topic: data.topic,
        sourceNotes: data.sourceNotes,
        sourceType: data.sourceType,
        masterMarkdown: data.masterMarkdown,
        status: "idea",
      },
    });

    // If no masterMarkdown provided, auto-generate a draft using the AI orchestrator
    if (!data.masterMarkdown && data.sourceNotes) {
      try {
        const agentResult = await routeToAgent("draft_job", {
          idea: data.title,
          sources: data.sourceNotes ? [data.sourceNotes] : [],
          angle: data.angle,
          workspaceId: workspace.id,
          tone: undefined,
          targetLength: undefined,
        }, workspace.id);

        if (agentResult.status === "agent_completed" && agentResult.result) {
          const result = agentResult.result as Record<string, unknown>;
          const markdown = result.markdown as string | undefined;
          const summary = result.summary as string | undefined;
          if (markdown) {
            await db.contentItem.update({
              where: { id: item.id },
              data: {
                masterMarkdown: markdown,
                summary: summary || undefined,
                status: "draft",
              },
            });
            // Update the returned item
            item.masterMarkdown = markdown;
            item.summary = summary || null;
            item.status = "draft";
          }
        }
      } catch (draftError) {
        // Draft generation failure should not prevent creation
        console.error("Auto-draft generation failed:", draftError);
      }
    }

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Content create error:", error);
    return NextResponse.json(
      { error: "Failed to create content item" },
      { status: 500 }
    );
  }
}
