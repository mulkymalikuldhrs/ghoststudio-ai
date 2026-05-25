import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/templates - List all templates
export async function GET() {
  try {
    const templates = await db.template.findMany({
      orderBy: { usageCount: "desc" },
    });

    // If no templates in DB, seed with defaults
    if (templates.length === 0) {
      const defaultTemplates = [
        { name: "Dark Horror Stories", category: "horror", description: "Creepy narrations with dark visuals and atmospheric sounds", isPremium: false, config: JSON.stringify({ bgStyle: "dark", fontFamily: "horror", transitionStyle: "fade" }), usageCount: 12400 },
        { name: "Jumpscare Compilation", category: "horror", description: "Quick cuts with intense jump scares and eerie music", isPremium: true, config: JSON.stringify({ bgStyle: "dark", fontFamily: "impact", transitionStyle: "cut" }), usageCount: 8900 },
        { name: "Motivational Dark", category: "motivation", description: "Inspiring quotes over dramatic dark visuals with bass music", isPremium: false, config: JSON.stringify({ bgStyle: "dark-gradient", fontFamily: "bold-sans", transitionStyle: "zoom" }), usageCount: 18200 },
        { name: "Hustle Grind", category: "motivation", description: "Fast-paced motivation with urban aesthetics and trap beats", isPremium: false, config: JSON.stringify({ bgStyle: "urban", fontFamily: "modern", transitionStyle: "slide" }), usageCount: 15600 },
        { name: "Crypto Pulse", category: "crypto", description: "Market analysis style with charts, alerts, and commentary", isPremium: false, config: JSON.stringify({ bgStyle: "matrix", fontFamily: "mono", transitionStyle: "data" }), usageCount: 9800 },
        { name: "DeFi Deep Dive", category: "crypto", description: "Technical breakdowns with animated diagrams", isPremium: true, config: JSON.stringify({ bgStyle: "tech", fontFamily: "mono", transitionStyle: "diagram" }), usageCount: 5400 },
        { name: "Anime Recap", category: "anime", description: "Episode recaps with dynamic transitions and dramatic narration", isPremium: true, config: JSON.stringify({ bgStyle: "anime", fontFamily: "dramatic", transitionStyle: "flash" }), usageCount: 22100 },
        { name: "Anime Power Scaling", category: "anime", description: "Character comparison with tier lists and battle stats", isPremium: false, config: JSON.stringify({ bgStyle: "anime", fontFamily: "impact", transitionStyle: "versus" }), usageCount: 11700 },
        { name: "Minimal Education", category: "education", description: "Clean whiteboard style with clear diagrams and explanations", isPremium: false, config: JSON.stringify({ bgStyle: "white", fontFamily: "clean-sans", transitionStyle: "draw" }), usageCount: 14300 },
        { name: "Science Explained", category: "education", description: "Complex topics broken down with 3D animations", isPremium: true, config: JSON.stringify({ bgStyle: "3d", fontFamily: "modern", transitionStyle: "rotate" }), usageCount: 7800 },
      ];

      await db.template.createMany({ data: defaultTemplates });
      const seededTemplates = await db.template.findMany({
        orderBy: { usageCount: "desc" },
      });
      return NextResponse.json({ templates: seededTemplates });
    }

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Failed to fetch templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}
