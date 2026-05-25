// Stripe client initialization
// In production, use actual Stripe SDK. For demo, we provide a mock interface.

export const STRIPE_PLANS = {
  free: {
    name: "Free",
    price: 0,
    priceId: "price_free",
    features: ["3 videos/month", "720p export", "Basic templates", "Watermark"],
  },
  creator: {
    name: "Creator",
    price: 29,
    priceId: "price_creator_monthly",
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
    priceId: "price_pro_monthly",
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
    priceId: "price_agency_monthly",
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

// Mock checkout URL creation
export function createCheckoutUrl(planId: string): string {
  return `/api/stripe/checkout?plan=${planId}`;
}
