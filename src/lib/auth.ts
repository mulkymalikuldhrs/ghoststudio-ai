import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const SALT_ROUNDS = 12;

// Secure password hashing using bcrypt
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) return null;

        const isValid = await verifyPassword(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
        };
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID ?? "",
      clientSecret: process.env.GOOGLE_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (user.email) {
        const existingUser = await db.user.findUnique({
          where: { email: user.email },
        });
        if (!existingUser) {
          // Create user with default plan and role for OAuth sign-ups
          const newUser = await db.user.create({
            data: {
              email: user.email,
              name: user.name ?? null,
              avatar: user.image ?? null,
              plan: "free",
              role: "operator",
              automationMode: "semi_auto",
            },
          });

          // Create free subscription for new OAuth users
          await db.subscription.create({
            data: {
              userId: newUser.id,
              plan: "free",
              status: "active",
              currentPeriodStart: new Date(),
            },
          });

          // Create default workspace for new OAuth users
          await db.workspace.create({
            data: {
              name: `${newUser.name || newUser.email}'s Studio`,
              slug: `studio-${newUser.id.slice(-8)}`,
              description: "Default workspace",
              ownerId: newUser.id,
              settingsJson: JSON.stringify({
                dna: {
                  coreVoice: "Direct, grounded, authoritative",
                  sentenceRhythm: "varied",
                  forbiddenPatterns: [
                    "In conclusion",
                    "It goes without saying",
                    "At the end of the day",
                  ],
                  emotionalTexture: "confident but approachable",
                  structuralBias: "actionable insights over theory",
                },
                scheduling: {
                  timezone: "UTC",
                  preferredPublishTimes: ["08:00", "12:00", "18:00"],
                  maxDailyPosts: 3,
                  cooldownMinutes: 120,
                },
                automation: {
                  mode: "semi_auto",
                  autoScheduleThreshold: 80,
                  requireHumanReview: true,
                },
              }),
            },
          });

          // Log the OAuth sign-up
          await db.systemLog.create({
            data: {
              service: "api",
              level: "info",
              action: "oauth_signup",
              message: `New OAuth user signed up: ${newUser.email}`,
              userId: newUser.id,
              metadataJson: JSON.stringify({ provider: "oauth" }),
            },
          });
        }
      }
      return true;
    },
    async session({ session }) {
      if (session.user?.email) {
        const dbUser = await db.user.findUnique({
          where: { email: session.user.email },
        });
        if (dbUser) {
          session.user.id = dbUser.id;
          session.user.plan = dbUser.plan;
          session.user.role = dbUser.role;
          session.user.automationMode = dbUser.automationMode;
          session.user.stripeCustomerId = dbUser.stripeCustomerId;
        }
      }
      return session;
    },
    async jwt({ token }) {
      if (token.email) {
        const dbUser = await db.user.findUnique({
          where: { email: token.email as string },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.plan = dbUser.plan;
          token.role = dbUser.role;
          token.automationMode = dbUser.automationMode;
          token.stripeCustomerId = dbUser.stripeCustomerId;
        }
      }
      return token;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
