// ────────────────────────────────────────────────────────────────────────────────
// NextAuth Type Extensions
// GhostStudio AI v2.0
// ────────────────────────────────────────────────────────────────────────────────

import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      plan?: string;
      role?: string;
      automationMode?: string;
      stripeCustomerId?: string | null;
    };
  }

  interface User {
    id: string;
    plan?: string;
    role?: string;
    automationMode?: string;
    stripeCustomerId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    plan?: string;
    role?: string;
    automationMode?: string;
    stripeCustomerId?: string | null;
  }
}
