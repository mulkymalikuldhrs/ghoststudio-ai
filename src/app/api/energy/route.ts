import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireWorkspaceAccess } from "@/lib/auth-guard";
import { TrackEnergySchema, formatZodErrors } from "@/lib/validators";
import { getEnergySystem } from "@/lib/energy-system";

// GET /api/energy - List energy entries (fatigue tracking)
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required" },
        { status: 400 }
      );
    }

    // Verify workspace access
    await requireWorkspaceAccess(request, workspaceId);

    // Use the EnergySystem class which properly handles decay and recommendations
    const energySystem = getEnergySystem(workspaceId);
    const status = await energySystem.getStatus();

    return NextResponse.json({
      entries: status.categories,
      summary: {
        overall: status.overall,
        status: status.status,
        totalCategories: status.categories.length,
        criticalAreas: status.categories
          .filter((c) => c.fatigueScore > 70)
          .map((c) => c.topic || c.category),
        recommendations: status.recommendations,
      },
    });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Energy list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch energy entries" },
      { status: 500 }
    );
  }
}

// POST /api/energy - Track energy / check publishability
// BUG FIX: audience_exhaustion now properly calls trackAudienceExhaustion
// instead of the incorrect trackPublishSaturation
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    const body = await request.json();
    const validation = TrackEnergySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: formatZodErrors(validation.error) },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verify workspace access
    await requireWorkspaceAccess(request, data.workspaceId);

    const energySystem = getEnergySystem(data.workspaceId);

    switch (data.action) {
      case "track": {
        // Record a publish event — increases fatigue for the category
        // BUG FIX: Each category now correctly tracks its own fatigue
        // Previously audience_exhaustion was incorrectly calling trackPublishSaturation
        await energySystem.recordPublish(data.category, data.topic);

        const status = await energySystem.getStatus();
        return NextResponse.json({
          tracked: true,
          category: data.category,
          topic: data.topic,
          status: status.status,
          overallFatigue: status.overall,
        });
      }

      case "check": {
        // Check if publishing is advisable for this category
        const canPublishResult = await energySystem.canPublish(data.category, data.topic);
        return NextResponse.json({
          canPublish: canPublishResult,
          category: data.category,
          topic: data.topic,
        });
      }

      case "status": {
        // Get full energy status
        const status = await energySystem.getStatus();
        return NextResponse.json(status);
      }

      case "schedule": {
        // Get optimal publishing schedule
        const schedule = await energySystem.getOptimalSchedule();
        return NextResponse.json(schedule);
      }

      default:
        return NextResponse.json(
          { error: `Unsupported action: ${data.action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Energy update error:", error);
    return NextResponse.json(
      { error: "Failed to update energy entry" },
      { status: 500 }
    );
  }
}
