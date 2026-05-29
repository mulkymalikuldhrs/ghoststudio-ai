import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { db } from "@/lib/db";

// GET /api/subscriptions - Get user subscriptions
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    const user = await db.user.findUnique({
      where: { id: auth.userId },
      include: {
        subscriptions: {
          orderBy: { createdAt: "desc" },
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
      plan: user.plan,
      subscriptions: user.subscriptions,
    });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Subscriptions list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}
