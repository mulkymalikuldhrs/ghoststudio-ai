import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { db } from "@/lib/db";

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

        if (!user) return null;

        // In production, verify hashed password. For demo, accept any password
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
          await db.user.create({
            data: {
              email: user.email,
              name: user.name ?? null,
              avatar: user.image ?? null,
              plan: "free",
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
          (session.user as Record<string, unknown>).plan = dbUser.plan;
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
        }
      }
      return token;
    },
  },
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET ?? "ghoststudio-secret-dev",
};
