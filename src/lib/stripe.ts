import Stripe from "stripe";

const stripeKey = process.env.STRIPE_SECRET_KEY || "";

let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (!_stripe) {
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not configured");
    _stripe = new Stripe(stripeKey);
  }
  return _stripe;
}

// Backward compat
export const stripe = stripeKey ? new Stripe(stripeKey) : null;

export const PLAN_CONFIG = {
  free: {
    name: "Free",
    price: 0,
    features: {
      videoProjects: 3,
      contentItems: 10,
      publishJobs: 5,
      schedulerJobs: 10,
      videoTemplates: 5,
      heatmapClips: 2,
      browserSessions: 1,
      apiKeys: 1,
    },
  },
  creator: {
    name: "Creator",
    price: 19,
    features: {
      videoProjects: 25,
      contentItems: 100,
      publishJobs: 50,
      schedulerJobs: 100,
      videoTemplates: 25,
      heatmapClips: 20,
      browserSessions: 5,
      apiKeys: 5,
    },
  },
  pro: {
    name: "Pro",
    price: 49,
    features: {
      videoProjects: -1, // unlimited
      contentItems: -1,
      publishJobs: -1,
      schedulerJobs: -1,
      videoTemplates: -1,
      heatmapClips: 100,
      browserSessions: 20,
      apiKeys: 20,
    },
  },
  agency: {
    name: "Agency",
    price: 149,
    features: {
      videoProjects: -1,
      contentItems: -1,
      publishJobs: -1,
      schedulerJobs: -1,
      videoTemplates: -1,
      heatmapClips: -1,
      browserSessions: -1,
      apiKeys: -1,
    },
  },
} as const;

export type PlanType = keyof typeof PLAN_CONFIG;
