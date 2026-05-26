import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { z } from "zod";

const signupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = signupSchema.parse(body);

    // Check if user already exists
    const existing = await db.user.findUnique({
      where: { email: validated.email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password using bcrypt
    const hashedPassword = await hashPassword(validated.password);

    // Create user with all required fields
    const user = await db.user.create({
      data: {
        email: validated.email,
        name: validated.name || null,
        password: hashedPassword,
        role: "operator",
        automationMode: "semi_auto",
        plan: "free",
      },
    });

    // Create default workspace
    const workspace = await db.workspace.create({
      data: {
        name: `${user.name || user.email}'s Studio`,
        slug: `studio-${user.id.slice(-8)}`,
        description: "Default workspace",
        ownerId: user.id,
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

    // Create free subscription
    await db.subscription.create({
      data: {
        userId: user.id,
        plan: "free",
        status: "active",
        currentPeriodStart: new Date(),
      },
    });

    // Create system log
    await db.systemLog.create({
      data: {
        service: "api",
        level: "info",
        action: "user_signup",
        message: `New user signed up: ${user.email}`,
        userId: user.id,
        metadataJson: JSON.stringify({ userId: user.id, workspaceId: workspace.id }),
      },
    });

    return NextResponse.json(
      { message: "Account created successfully", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
