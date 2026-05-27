import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/templates - List all templates (video + content)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

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
