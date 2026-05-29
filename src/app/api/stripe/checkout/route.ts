import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import Stripe from "stripe";

const stripeKey = process.env.STRIPE_SECRET_KEY || "";

let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not configured");
    _stripe = new Stripe(stripeKey);
  }
  return _stripe;
}

const PLAN_PRICES: Record<string, string> = {
  creator: process.env.STRIPE_CREATOR_PRICE_ID || "",
  pro: process.env.STRIPE_PRO_PRICE_ID || "",
  agency: process.env.STRIPE_AGENCY_PRICE_ID || "",
};

// POST /api/stripe/checkout - Create a Stripe checkout session
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    const body = await request.json();
    const { plan } = body;

    if (!plan || !PLAN_PRICES[plan]) {
      return NextResponse.json(
        { error: "Invalid plan. Available: creator, pro, agency" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: auth.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const stripe = getStripe();

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: user.stripeCustomerId || undefined,
      customer_email: user.stripeCustomerId ? undefined : user.email,
      line_items: [
        {
          price: PLAN_PRICES[plan],
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/os?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/os?checkout=cancel`,
      metadata: {
        userId: user.id,
        plan,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
