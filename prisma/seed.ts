import { db } from '../src/lib/db';

async function main() {
  console.log('🌱 Seeding AI Media Intelligence OS...');

  // Create default user
  const user = await db.user.upsert({
    where: { email: 'operator@media-os.local' },
    update: {},
    create: {
      email: 'operator@media-os.local',
      name: 'Media Operator',
      role: 'operator',
      automationMode: 'semi_auto',
    },
  });

  console.log(`✅ User created: ${user.email}`);

  // Create default workspace
  const workspace = await db.workspace.upsert({
    where: { slug: 'main-studio' },
    update: {},
    create: {
      name: 'Main Studio',
      slug: 'main-studio',
      description: 'Primary media workspace',
      ownerId: user.id,
      settingsJson: JSON.stringify({
        dna: {
          coreVoice: 'Direct, grounded, authoritative',
          sentenceRhythm: 'varied',
          forbiddenPatterns: ['In conclusion', 'It goes without saying', 'At the end of the day'],
          emotionalTexture: 'confident but approachable',
          structuralBias: 'actionable insights over theory',
        },
        scheduling: {
          timezone: 'Asia/Jakarta',
          preferredPublishTimes: ['08:00', '12:00', '18:00'],
          maxDailyPosts: 3,
          cooldownMinutes: 120,
        },
        automation: {
          mode: 'semi_auto',
          autoScheduleThreshold: 80,
          requireHumanReview: true,
        },
      }),
    },
  });

  console.log(`✅ Workspace created: ${workspace.name}`);

  // Create sample memory entries
  const memoryEntries = [
    { category: 'hook', key: 'question-opening', value: 'Opening with a provocative question increases engagement by 23%', score: 85, source: 'analytics' },
    { category: 'hook', key: 'number-title', value: 'Numbered list titles (7 Ways, 5 Reasons) consistently outperform other formats', score: 92, source: 'analytics' },
    { category: 'topic', key: 'ai-tools-review', value: 'AI tool reviews and comparisons generate 3x more traffic than generic AI content', score: 88, source: 'analytics' },
    { category: 'topic', key: 'automation-tutorial', value: 'Step-by-step automation tutorials have highest save rate on Dev.to', score: 79, source: 'analytics' },
    { category: 'tone', key: 'direct-confident', value: 'Direct, confident tone without hedging performs better across all platforms', score: 81, source: 'manual' },
    { category: 'timing', key: 'morning-publish', value: '8:00 AM WIB publishing gets 40% more initial views', score: 76, source: 'analytics' },
    { category: 'platform', key: 'wordpress-seo', value: 'WordPress posts with 1500+ words rank 2x better in search', score: 84, source: 'analytics' },
    { category: 'platform', key: 'devto-code', value: 'Dev.to posts with code blocks get 5x more reactions', score: 91, source: 'analytics' },
    { category: 'cta', key: 'soft-subscribe', value: 'Soft CTA ("subscribe if you found this useful") converts 15% better than aggressive CTA', score: 73, source: 'experiment' },
    { category: 'format', key: 'tutorial-structure', value: 'Problem → Solution → Steps → Results structure has best completion rate', score: 87, source: 'analytics' },
    { category: 'audience', key: 'practical-over-theory', value: 'Audience strongly prefers practical implementation over theoretical explanations', score: 90, source: 'analytics' },
    { category: 'style', key: 'avoid-robotic', value: 'Phrases like "leverage", "synergy", "delve" trigger bounce — use plain language', score: 95, source: 'ai' },
  ];

  for (const entry of memoryEntries) {
    await db.memoryEntry.upsert({
      where: {
        workspaceId_category_key: {
          workspaceId: workspace.id,
          category: entry.category,
          key: entry.key,
        },
      },
      update: {},
      create: {
        workspaceId: workspace.id,
        ...entry,
      },
    });
  }

  console.log(`✅ ${memoryEntries.length} memory entries seeded`);

  // Create sample content items
  const sampleContent = [
    {
      title: 'How to Build an AI-Powered Content Pipeline',
      subtitle: 'From idea to published in under 10 minutes',
      slug: 'build-ai-content-pipeline',
      angle: 'Practical implementation guide using open-source tools',
      topic: 'ai-automation',
      status: 'published',
      masterMarkdown: `# How to Build an AI-Powered Content Pipeline

Most content creators spend 80% of their time on production and only 20% on strategy. An AI-powered pipeline flips that ratio.

## The Problem

Manual content creation is slow. You write, edit, format, optimize, schedule, and publish — each step eats time. And when you finally hit publish, you move to the next piece without learning from what worked.

## The Solution: An Orchestrated Pipeline

Instead of treating each piece as a one-off, build a system that:

1. **Captures signals** — trends, ideas, audience questions
2. **Generates drafts** — AI creates the first version
3. **Humanizes** — removes robotic patterns, adds your voice
4. **Optimizes** — SEO, readability, platform adaptation
5. **Distributes** — publishes to multiple platforms
6. **Learns** — analytics feed back into the system

The key insight: **Memory is the moat, not the model.** Your competitive advantage isn't which LLM you use — it's the accumulated knowledge of what works for your audience.

## Getting Started

Start small. One platform. One content type. One scheduling cadence. Get the loop working before adding complexity.`,
      summary: 'A practical guide to building an AI-powered content pipeline that flips the 80/20 ratio from production to strategy.',
      sourceType: 'idea',
      qualityScore: 87,
      humanicScore: 82,
      seoScore: 85,
      trustScore: 90,
      humanReviewRequired: false,
      publishedAt: new Date('2024-01-15T08:00:00Z'),
    },
    {
      title: 'Why Memory-Driven AI Writing Beats Pure Generation',
      subtitle: 'The difference between spam and authority',
      slug: 'memory-driven-ai-writing',
      angle: 'Authority compounding vs. content spam — why context matters',
      topic: 'ai-writing',
      status: 'ready',
      masterMarkdown: `# Why Memory-Driven AI Writing Beats Pure Generation

Anyone can prompt an LLM to write an article. The result? Generic, forgettable content that adds nothing to the internet.

## The Spam Problem

Pure AI generation without context produces content that:
- Sounds the same as everything else
- Misses what your specific audience cares about
- Repeats patterns that already failed
- Has no institutional knowledge

## Memory-Driven Writing

A memory-driven system works differently. Before generating, it:
1. Retrieves your best-performing hooks
2. Checks what topics are saturated
3. Adapts tone based on audience response
4. Avoids patterns that previously flopped

The result? Content that compounds authority instead of diluting it.

## The Architecture

Memory → Context → Generation → Scoring → Publishing → Analytics → Memory Update

Each cycle makes the next one better. That's the flywheel.`,
      summary: 'Why pure AI generation creates spam and memory-driven systems create authority.',
      sourceType: 'idea',
      qualityScore: 78,
      humanicScore: 80,
      seoScore: 72,
      trustScore: 85,
      humanReviewRequired: true,
    },
    {
      title: 'The Anti-Burnout Content Strategy',
      subtitle: 'How energy systems prevent audience and creator fatigue',
      slug: 'anti-burnout-content-strategy',
      angle: 'Energy-aware publishing that prevents content decay',
      topic: 'content-strategy',
      status: 'draft',
      masterMarkdown: `# The Anti-Burnout Content Strategy

Publishing every day sounds great until you burn out — and your audience burns out too.`,
      summary: 'How energy-aware systems prevent creator and audience burnout.',
      sourceType: 'manual',
      qualityScore: 45,
      humanicScore: 50,
      seoScore: 40,
      trustScore: 60,
      humanReviewRequired: true,
    },
  ];

  for (const content of sampleContent) {
    const existing = await db.contentItem.findFirst({
      where: { slug: content.slug, workspaceId: workspace.id },
    });
    if (!existing) {
      await db.contentItem.create({
        data: {
          ...content,
          workspaceId: workspace.id,
        },
      });
    }
  }

  console.log(`✅ ${sampleContent.length} sample content items seeded`);

  // Create energy entries
  const energyEntries = [
    { workspaceId: workspace.id, category: 'topic_fatigue', topic: 'ai-automation', fatigueScore: 35, publishCount: 3 },
    { workspaceId: workspace.id, category: 'tone_fatigue', topic: 'direct-confident', fatigueScore: 20, publishCount: 8 },
    { workspaceId: workspace.id, category: 'publish_saturation', fatigueScore: 40, publishCount: 5 },
    { workspaceId: workspace.id, category: 'hook_repetition', topic: 'number-title', fatigueScore: 55, publishCount: 6 },
    { workspaceId: workspace.id, category: 'audience_exhaustion', fatigueScore: 15, publishCount: 2 },
  ];

  for (const entry of energyEntries) {
    await db.energyEntry.create({ data: entry });
  }

  console.log(`✅ ${energyEntries.length} energy entries seeded`);

  // Create system log
  await db.systemLog.create({
    data: {
      service: 'system',
      level: 'info',
      action: 'seed',
      message: 'Database seeded with initial data',
    },
  });

  console.log('\n🎉 Seed complete! AI Media Intelligence OS is ready.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
