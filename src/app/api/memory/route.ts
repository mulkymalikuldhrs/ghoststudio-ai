import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requireWorkspaceAccess } from "@/lib/auth-guard";
import { StoreMemorySchema, UpdateMemorySchema, formatZodErrors } from "@/lib/validators";
import { routeToAgent } from "@/lib/ai-orchestrator";
import { getMemorySystem } from "@/lib/memory-system";

// GET /api/memory - List memory entries
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const category = searchParams.get("category");
    const minScore = searchParams.get("minScore");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required" },
        { status: 400 }
      );
    }

    // Verify workspace access
    await requireWorkspaceAccess(request, workspaceId);

    const where: Record<string, unknown> = { workspaceId, isActive: true };
    if (category) where.category = category;
    if (minScore) where.score = { gte: parseFloat(minScore) };

    const [entries, insights] = await Promise.all([
      db.memoryEntry.findMany({
        where,
        orderBy: { score: "desc" },
        take: 100,
      }),
      getMemorySystem(workspaceId).getInsights(),
    ]);

    return NextResponse.json({ entries, insights });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Memory list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch memory entries" },
      { status: 500 }
    );
  }
}

// POST /api/memory - Create or update memory entry (wired to memory-agent)
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    const body = await request.json();
    const validation = StoreMemorySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: formatZodErrors(validation.error) },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verify workspace access
    await requireWorkspaceAccess(request, data.workspaceId);

    // Route to memory-agent for LLM-powered enrichment
    const agentResult = await routeToAgent("memory_update_job", {
      workspaceId: data.workspaceId,
      category: data.category,
      key: data.key,
      value: data.value,
      score: data.score,
      source: data.source,
      contextJson: data.contextJson,
      action: "store",
    }, data.workspaceId);

    // Also store directly via the memory system for immediate availability
    const memorySystem = getMemorySystem(data.workspaceId);
    const entry = await memorySystem.store({
      category: data.category,
      key: data.key,
      value: data.value,
      score: data.score,
      source: data.source,
      contextJson: data.contextJson,
    });

    return NextResponse.json({ entry, agentResult });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Memory create error:", error);
    return NextResponse.json(
      { error: "Failed to create memory entry" },
      { status: 500 }
    );
  }
}

// PUT /api/memory - Update existing memory entry
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    const body = await request.json();
    const { workspaceId, entryId, ...updateData } = body;

    if (!workspaceId || !entryId) {
      return NextResponse.json(
        { error: "workspaceId and entryId are required" },
        { status: 400 }
      );
    }

    // Verify workspace access
    await requireWorkspaceAccess(request, workspaceId);

    const validation = UpdateMemorySchema.safeParse(updateData);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: formatZodErrors(validation.error) },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verify the entry belongs to this workspace
    const existing = await db.memoryEntry.findUnique({ where: { id: entryId } });
    if (!existing || existing.workspaceId !== workspaceId) {
      return NextResponse.json(
        { error: "Memory entry not found" },
        { status: 404 }
      );
    }

    const updatePayload: Record<string, unknown> = {};
    if (data.value !== undefined) updatePayload.value = data.value;
    if (data.score !== undefined) updatePayload.score = data.score;
    if (data.source !== undefined) updatePayload.source = data.source;
    if (data.isActive !== undefined) updatePayload.isActive = data.isActive;
    if (data.contextJson !== undefined) updatePayload.contextJson = JSON.stringify(data.contextJson);

    const entry = await db.memoryEntry.update({
      where: { id: entryId },
      data: updatePayload,
    });

    // Route to memory-agent for potential LLM-powered updates
    const agentResult = await routeToAgent("memory_update_job", {
      workspaceId,
      entryId,
      action: "update",
      ...data,
    }, workspaceId);

    return NextResponse.json({ entry, agentResult });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Memory update error:", error);
    return NextResponse.json(
      { error: "Failed to update memory entry" },
      { status: 500 }
    );
  }
}
