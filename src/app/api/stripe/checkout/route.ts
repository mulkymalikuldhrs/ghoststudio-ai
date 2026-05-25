import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { createCheckoutSession, STRIPE_PLANS, type PlanType } from "@/lib/stripe";

// POST /api/stripe/checkout - Create a Stripe checkout session
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { planId } = body;

    if (!planId) {
      return NextResponse.json(
        { error: "planId is required" },
        { status: 400 }
      );
    }

    const plan = STRIPE_PLANS[planId as PlanType];
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Free plan doesn't need checkout
    if (planId === "free") {
      const user = await db.user.findUnique({
        where: { email: session.user.email },
      });
      if (user) {
        await db.user.update({
          where: { id: user.id },
          data: { plan: "free" },
        });
      }
      return NextResponse.json({
        checkoutUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard/settings?plan=free`,
        planId,
      });
    }

    const userId = (session.user as Record<string, unknown>).id as string;
    const { url, sessionId } = await createCheckoutSession(
      userId,
      session.user.email,
      planId as PlanType
    );

    return NextResponse.json({
      checkoutUrl: url,
      sessionId,
      planId,
      amount: plan.price,
    });
  } catch (error) {
    console.error("Failed to create checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
