import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/user - Get current user profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
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
    console.error("User get error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}
