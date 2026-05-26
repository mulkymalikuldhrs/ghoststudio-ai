import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Seed templates
  const templates = [
    {
      name: "Dark Horror Stories",
      category: "horror",
      description: "Creepy narrations with dark visuals and atmospheric sounds",
      isPremium: false,
      config: JSON.stringify({ visualStyle: "dark", musicTone: "eerie", pacing: "slow" }),
    },
    {
      name: "Jumpscare Compilation",
      category: "horror",
      description: "Quick cuts with intense jump scares and eerie music",
      isPremium: true,
      config: JSON.stringify({ visualStyle: "intense", musicTone: "horror", pacing: "fast" }),
    },
    {
      name: "Motivational Dark",
      category: "motivation",
      description: "Inspiring quotes over dramatic dark visuals with bass music",
      isPremium: false,
      config: JSON.stringify({ visualStyle: "cinematic", musicTone: "epic", pacing: "medium" }),
    },
    {
      name: "Hustle Grind",
      category: "motivation",
      description: "Fast-paced motivation with urban aesthetics and trap beats",
      isPremium: false,
      config: JSON.stringify({ visualStyle: "urban", musicTone: "trap", pacing: "fast" }),
    },
    {
      name: "Crypto Pulse",
      category: "crypto",
      description: "Market analysis style with charts, alerts, and commentary",
      isPremium: false,
      config: JSON.stringify({ visualStyle: "tech", musicTone: "electronic", pacing: "medium" }),
    },
    {
      name: "DeFi Deep Dive",
      category: "crypto",
      description: "Technical breakdowns with animated diagrams",
      isPremium: true,
      config: JSON.stringify({ visualStyle: "data", musicTone: "ambient", pacing: "slow" }),
    },
    {
      name: "Anime Recap",
      category: "anime",
      description: "Episode recaps with dynamic transitions and dramatic narration",
      isPremium: true,
      config: JSON.stringify({ visualStyle: "anime", musicTone: "dramatic", pacing: "fast" }),
    },
    {
      name: "Anime Power Scaling",
      category: "anime",
      description: "Character comparison with tier lists and battle stats",
      isPremium: false,
      config: JSON.stringify({ visualStyle: "tier-list", musicTone: "battle", pacing: "medium" }),
    },
    {
      name: "Minimal Education",
      category: "education",
      description: "Clean whiteboard style with clear diagrams and explanations",
      isPremium: false,
      config: JSON.stringify({ visualStyle: "minimal", musicTone: "calm", pacing: "slow" }),
    },
    {
      name: "Science Explained",
      category: "education",
      description: "Complex topics broken down with 3D animations",
      isPremium: true,
      config: JSON.stringify({ visualStyle: "3d-science", musicTone: "wonder", pacing: "medium" }),
    },
    {
      name: "True Crime Files",
      category: "horror",
      description: "Documentary style crime stories with evidence overlays",
      isPremium: true,
      config: JSON.stringify({ visualStyle: "documentary", musicTone: "suspense", pacing: "slow" }),
    },
    {
      name: "Success Blueprint",
      category: "motivation",
      description: "Step-by-step success framework with blueprint visuals",
      isPremium: false,
      config: JSON.stringify({ visualStyle: "blueprint", musicTone: "inspiring", pacing: "medium" }),
    },
  ];

  for (const template of templates) {
    await prisma.template.upsert({
      where: { id: template.name.toLowerCase().replace(/\s+/g, "-") },
      update: template,
      create: {
        id: template.name.toLowerCase().replace(/\s+/g, "-"),
        ...template,
      },
    });
  }

  console.log(`Seeded ${templates.length} templates`);
  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
