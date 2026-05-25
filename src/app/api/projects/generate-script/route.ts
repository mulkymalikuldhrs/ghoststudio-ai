import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateScript } from "@/lib/ai";

// POST /api/projects/generate-script - Generate a script from a prompt
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { prompt, niche, duration } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    let script: string;
    try {
      script = await generateScript(
        prompt,
        niche ?? "general",
        duration ?? 30
      );
    } catch {
      // Fallback demo script if AI fails
      script = JSON.stringify(
        {
          title: prompt,
          hook: "This will change everything you thought you knew...",
          scenes: [
            {
              id: 1,
              narration: "In a world where most people sleepwalk through life...",
              visual: "Dark cityscape at night with neon lights",
              duration: 5,
              subtitle: "Most people sleepwalk through life",
            },
            {
              id: 2,
              narration: "Only a few dare to question the system.",
              visual: "Silhouette figure standing before a massive screen",
              duration: 5,
              subtitle: "Only a few dare to question",
            },
            {
              id: 3,
              narration: "The truth is uncomfortable, but it sets you free.",
              visual: "Breaking chains animation with light rays",
              duration: 5,
              subtitle: "The truth sets you free",
            },
          ],
          cta: "Follow for more content that awakens your mind.",
          hashtags: ["#viral", "#trending", "#fyp"],
        },
        null,
        2
      );
    }

    return NextResponse.json({ script });
  } catch (error) {
    console.error("Failed to generate script:", error);
    return NextResponse.json(
      { error: "Failed to generate script" },
      { status: 500 }
    );
  }
}
