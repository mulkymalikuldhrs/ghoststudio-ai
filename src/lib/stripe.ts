import Stripe from "stripe";

export const STRIPE_PLANS = {
  free: {
    name: "Free",
    price: 0,
    priceId: process.env.STRIPE_FREE_PRICE_ID ?? "price_free",
    features: ["3 videos/month", "720p export", "Basic templates", "Watermark"],
  },
  creator: {
    name: "Creator",
    price: 29,
    priceId: process.env.STRIPE_CREATOR_PRICE_ID ?? "price_creator_monthly",
    features: [
      "30 videos/month",
      "1080p export",
      "All templates",
      "No watermark",
      "AI script generation",
      "Priority rendering",
    ],
  },
  pro: {
    name: "Pro",
    price: 49,
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? "price_pro_monthly",
    features: [
      "Unlimited videos",
      "4K export",
      "All templates",
      "No watermark",
      "AI script generation",
      "Priority rendering",
      "Custom branding",
      "API access",
    ],
  },
  agency: {
    name: "Agency",
    price: 199,
    priceId: process.env.STRIPE_AGENCY_PRICE_ID ?? "price_agency_monthly",
    features: [
      "Unlimited videos",
      "4K export",
      "All templates",
      "No watermark",
      "AI script generation",
      "Priority rendering",
      "Custom branding",
      "API access",
      "White label",
      "Team collaboration",
      "Dedicated support",
    ],
  },
} as const;

export type PlanType = keyof typeof STRIPE_PLANS;

export function getPlan(planId: string) {
  return STRIPE_PLANS[planId as PlanType] ?? STRIPE_PLANS.free;
}

// Initialize Stripe only when secret key is available
export function getStripe(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  return new Stripe(secretKey, {
    apiVersion: "2025-02-24.acacia",
    typescript: true,
  });
}

export async function createCheckoutSession(
  userId: string,
  userEmail: string,
  planId: PlanType
): Promise<{ url: string | null; sessionId: string }> {
  const stripe = getStripe();
  const plan = STRIPE_PLANS[planId];

  // If Stripe is not configured, return mock checkout
  if (!stripe) {
    const mockUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard/settings?checkout=success&plan=${planId}`;
    return { url: mockUrl, sessionId: `cs_mock_${Date.now()}` };
  }

  const session = await stripe.checkout.sessions.create({
    customer_email: userEmail,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: plan.priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard/settings?checkout=success&plan=${planId}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard/settings?checkout=cancelled`,
    metadata: {
      userId,
      planId,
    },
  });

  return { url: session.url, sessionId: session.id };
}

export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event | null {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) return null;

  try {
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    return event;
  } catch {
    return null;
  }
}
