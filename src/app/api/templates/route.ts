import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/templates - List all templates (video + content)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // video, content, all
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "50");

    let templates: unknown[] = [];

    if (!type || type === "video" || type === "all") {
      const where: Record<string, unknown> = {};
      if (category) where.category = category;

      const videoTemplates = await db.videoTemplate.findMany({
        where,
        orderBy: { usageCount: "desc" },
        take: limit,
      });
      templates = [...templates, ...videoTemplates.map((t) => ({ ...t, type: "video" }))];
    }

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Templates list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}
