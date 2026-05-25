import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/analytics - Get user analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get project stats
    const totalProjects = await db.project.count({
      where: { userId: user.id },
    });

    const completedProjects = await db.project.count({
      where: { userId: user.id, status: "completed" },
    });

    const draftProjects = await db.project.count({
      where: { userId: user.id, status: "draft" },
    });

    const renderingProjects = await db.project.count({
      where: {
        userId: user.id,
        status: { in: ["generating", "rendering"] },
      },
    });

    // Get recent projects
    const recentProjects = await db.project.findMany({
      where: { userId: user.id },
      include: { videos: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Get niche distribution
    const nicheDistribution = await db.project.groupBy({
      by: ["niche"],
      where: { userId: user.id },
      _count: { niche: true },
    });

    return NextResponse.json({
      stats: {
        totalProjects,
        completedProjects,
        draftProjects,
        renderingProjects,
      },
      recentProjects,
      nicheDistribution: nicheDistribution.map((n) => ({
        niche: n.niche,
        count: n._count.niche,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
