import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { db } from "@/lib/db";

// GET /api/user - Get current user profile
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    const user = await db.user.findUnique({
      where: { id: auth.userId },
      include: {
        workspaces: {
          include: {
            _count: {
              select: {
                contentItems: true,
                schedulerJobs: true,
                memoryEntries: true,
              },
            },
          },
        },
        subscriptions: {
          where: { status: "active" },
          take: 1,
        },
        _count: {
          select: {
            videoProjects: true,
            apiCredentials: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      automationMode: user.automationMode,
      plan: user.plan,
      workspaces: user.workspaces,
      subscription: user.subscriptions[0] || null,
      stats: {
        videoProjects: user._count.videoProjects,
        apiCredentials: user._count.apiCredentials,
      },
    });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("User get error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}
