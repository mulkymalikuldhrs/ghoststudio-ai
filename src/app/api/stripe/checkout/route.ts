import { NextRequest, NextResponse } from "next/server";
import { STRIPE_PLANS, type PlanType } from "@/lib/stripe";

// POST /api/stripe/checkout - Create a checkout session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planId, userId } = body;

    if (!planId || !userId) {
      return NextResponse.json(
        { error: "planId and userId are required" },
        { status: 400 }
      );
    }

    const plan = STRIPE_PLANS[planId as PlanType];
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // In production, create a real Stripe checkout session
    // For demo, return a mock checkout URL
    const checkoutUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard/settings?checkout=success&plan=${planId}`;

    return NextResponse.json({
      checkoutUrl,
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
