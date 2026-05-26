import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/video/templates - List video templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const resolution = searchParams.get("resolution");

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (resolution) where.resolution = resolution;

    const templates = await db.videoTemplate.findMany({
      where,
      orderBy: { usageCount: "desc" },
      take: 50,
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Video templates list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch video templates" },
      { status: 500 }
    );
  }
}
