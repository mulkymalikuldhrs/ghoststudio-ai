import "@/lib/agents/register-all";
/**
 * AI Orchestrator v2.0 — The central brain of GhostStudio AI
 *
 * Routes tasks to appropriate agents based on type.
 * Manages model tier selection (cheap/mid/premium).
 * Injects Content DNA and Memory context into all agent calls.
 * Coordinates multi-step pipelines:
 *   - Content Pipeline: draft → humanic → SEO → score → repurpose → publish
 *   - Video Pipeline: script → image → voice → compose → publish
 *   - Heatmap Pipeline: detect → clip → subtitle → publish
 *   - TikTok Pipeline: trend → script → tiktok → thumbnail → caption → publish
 * Tracks costs per operation.
 * Logs all operations to SystemLog.
 * Error handling with fallbacks.
 *
 * Uses `z-ai-web-dev-sdk` for LLM calls.
 */

// ZAI imported lazily to avoid initialization issues
import { db } from '@/lib/db';
import { getAgent, listAgents, type ModelTier, type AgentEngine } from '@/lib/agents';

// ─── Model Tier Configuration ────────────────────────────────────────────────

export const MODEL_MAP: Record<ModelTier, string> = {
  cheap: 'openai/gpt-4o-mini',
  mid: 'anthropic/claude-3.5-sonnet',
  premium: 'anthropic/claude-3-opus',
};

// Task-to-tier routing table (expanded for all 24 agents)
export const TASK_MODEL_MAP: Record<string, ModelTier> = {
  // Cheap tier — fast, simple tasks
  tagging: 'cheap',
  formatting: 'cheap',
  metadata: 'cheap',
  image_prompt: 'cheap',
  caption: 'cheap',
  summary: 'cheap',
  qa: 'cheap',
  voice: 'cheap',
  thumbnail: 'cheap',

  // Mid tier — moderate complexity
  seo: 'mid',
  repurpose: 'mid',
  scoring: 'mid',
  script: 'mid',
  strategy: 'mid',
  heatmap: 'mid',
  trend: 'mid',
  review: 'mid',
  format: 'mid',
  tiktok: 'mid',

  // Premium tier — high quality, complex generation
  draft: 'premium',
  master_article: 'premium',
  humanic_rewrite: 'premium',
  editorial: 'premium',
  strategic_writing: 'premium',
};

// Job type to agent name mapping (expanded for all 24 agents)
const JOB_AGENT_MAP: Record<string, string> = {
  draft_job: 'draft-agent',
  rewrite_job: 'humanic-agent',
  seo_job: 'seo-agent',
  publish_job: 'publish-agent',
  memory_update_job: 'memory-agent',
  repurpose_job: 'repurpose-agent',
  scoring_job: 'scoring-agent',
  tagging_job: 'tagging-agent',
  script_job: 'script-agent',
  image_job: 'image-agent',
  voice_job: 'voice-agent',
  video_compose_job: 'video-compose-agent',
  heatmap_job: 'heatmap-agent',
  clip_job: 'clip-agent',
  strategy_job: 'strategy-agent',
  browser_job: 'browser-agent',
  tiktok_job: 'tiktok-agent',
  thumbnail_job: 'thumbnail-agent',
  caption_job: 'caption-agent',
  trend_job: 'trend-agent',
  review_job: 'review-agent',
  format_job: 'format-agent',
  summary_job: 'summary-agent',
  qa_job: 'qa-agent',
};

// ─── Content DNA & Memory Context ───────────────────────────────────────────

export interface ContentDNA {
  voice?: string;
  tone?: string;
  audience?: string;
  perspective?: string;
}

export interface MemoryContext {
  topHooks: string[];
  topTopics: string[];
  fatigueTopics: string[];
  recentPerformance: Array<{ metric: string; value: number }>;
}

/**
 * Load Content DNA from workspace settings
 */
export async function getContentDNA(workspaceId?: string): Promise<ContentDNA> {
  if (!workspaceId) return {};
  try {
    const workspace = await db.workspace.findUnique({
      where: { id: workspaceId },
      select: { settingsJson: true },
    });
    if (workspace?.settingsJson) {
      const settings = JSON.parse(workspace.settingsJson);
      return settings.contentDNA || settings.dna || {};
    }
  } catch (error) {
    console.error('[Orchestrator] Failed to load Content DNA:', error);
  }
  return {};
}

/**
 * Load Memory context from workspace memory entries
 */
export async function getMemoryContext(workspaceId?: string): Promise<MemoryContext> {
  const empty: MemoryContext = { topHooks: [], topTopics: [], fatigueTopics: [], recentPerformance: [] };
  if (!workspaceId) return empty;
  try {
    const topHooks = await db.memoryEntry.findMany({
      where: { workspaceId, category: 'hook', isActive: true },
      orderBy: { score: 'desc' },
      take: 5,
    });

    const topTopics = await db.memoryEntry.findMany({
      where: { workspaceId, category: 'topic', isActive: true },
      orderBy: { score: 'desc' },
      take: 5,
    });

    const fatigueEntries = await db.energyEntry.findMany({
      where: { workspaceId, fatigueScore: { gt: 60 } },
      orderBy: { fatigueScore: 'desc' },
      take: 5,
    });

    const recentAnalytics = await db.analyticsEvent.findMany({
      where: { workspaceId },
      orderBy: { capturedAt: 'desc' },
      take: 10,
      select: { metricType: true, metricValue: true },
    });

    return {
      topHooks: topHooks.map((h) => h.value),
      topTopics: topTopics.map((t) => t.value),
      fatigueTopics: fatigueEntries.map((f) => f.topic || f.category),
      recentPerformance: recentAnalytics.map((a) => ({ metric: a.metricType, value: a.metricValue })),
    };
  } catch (error) {
    console.error('[Orchestrator] Failed to load Memory context:', error);
    return empty;
  }
}

/**
 * Build Content DNA injection string for system prompts
 */
export function buildDNAInjection(dna: ContentDNA): string {
  const parts: string[] = [];
  if (dna.voice) parts.push(`Voice: ${dna.voice}`);
  if (dna.tone) parts.push(`Tone: ${dna.tone}`);
  if (dna.audience) parts.push(`Target Audience: ${dna.audience}`);
  if (dna.perspective) parts.push(`Perspective: ${dna.perspective}`);
  return parts.length > 0
    ? `\nCONTENT DNA (your writing identity):\n${parts.join('\n')}`
    : '';
}

/**
 * Build Memory context injection string for system prompts
 */
export function buildMemoryInjection(memory: MemoryContext): string {
  const parts: string[] = [];
  if (memory.topHooks.length > 0) {
    parts.push(`Top-performing hooks: ${memory.topHooks.join(', ')}`);
  }
  if (memory.topTopics.length > 0) {
    parts.push(`Top-performing topics: ${memory.topTopics.join(', ')}`);
  }
  if (memory.fatigueTopics.length > 0) {
    parts.push(`AVOID these fatigued topics: ${memory.fatigueTopics.join(', ')}`);
  }
  return parts.length > 0
    ? `\nMEMORY CONTEXT (learn what works):\n${parts.join('\n')}`
    : '';
}

// ─── Type Definitions ────────────────────────────────────────────────────────

export interface AiCallOptions {
  tier?: ModelTier;
  taskType?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  workspaceId?: string;
  injectDNA?: boolean;
  injectMemory?: boolean;
}

export interface DraftInput {
  idea: string;
  sources?: string[];
  angle?: string;
  workspaceId?: string;
  tone?: string;
  targetLength?: number;
}

export interface PipelineResult {
  draft: unknown;
  humanic: unknown;
  seo: unknown;
  scores: unknown;
}

export interface VideoPipelineResult {
  script: unknown;
  images: unknown;
  voice: unknown;
  video: unknown;
}

export interface HeatmapPipelineResult {
  heatmap: unknown;
  clips: unknown[];
}

export interface TikTokPipelineResult {
  trend: unknown;
  script: unknown;
  tiktok: unknown;
  thumbnail: unknown;
  caption: unknown;
}

export interface CostEntry {
  agent: string;
  tier: ModelTier;
  tokensEstimate: number;
  costEstimate: number;
  timestamp: Date;
}

// ─── ZAI Singleton ───────────────────────────────────────────────────────────

let zaiInstance: any = null;

export async function getZAI(): Promise<any> {
  if (!zaiInstance) {
    const ZAIModule = await import('z-ai-web-dev-sdk');
    const ZAI = ZAIModule.default;
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

// ─── Core AI Call Router ─────────────────────────────────────────────────────

export async function aiCall(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options: AiCallOptions = {}
): Promise<string> {
  const { tier, taskType, systemPrompt, temperature = 0.7, workspaceId, injectDNA = false, injectMemory = false } = options;

  const resolvedTier = tier || (taskType ? TASK_MODEL_MAP[taskType] : 'mid');
  const model = MODEL_MAP[resolvedTier];

  const zai = await getZAI();

  // Build context injections
  let injectedSystemPrompt = systemPrompt || '';

  if (injectDNA || injectMemory) {
    const dna = await getContentDNA(workspaceId);
    const memory = await getMemoryContext(workspaceId);

    if (injectDNA) {
      injectedSystemPrompt += buildDNAInjection(dna);
    }
    if (injectMemory) {
      injectedSystemPrompt += buildMemoryInjection(memory);
    }
  }

  const finalMessages = injectedSystemPrompt
    ? [{ role: 'system' as const, content: injectedSystemPrompt }, ...messages]
    : messages;

  try {
    const completion = await zai.chat.completions.create({
      messages: finalMessages,
      thinking: { type: 'disabled' },
    });

    const content = completion.choices[0]?.message?.content || '';

    await logAiAction(resolvedTier, model, taskType || 'unknown', content.length);

    return content;
  } catch (error) {
    await logAiError(resolvedTier, model, taskType || 'unknown', error);
    throw new Error(
      `AI call failed [tier=${resolvedTier}, model=${model}]: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ─── Route to Agent ──────────────────────────────────────────────────────────

export async function routeToAgent(
  jobType: string,
  payload: Record<string, unknown>,
  workspaceId?: string
): Promise<Record<string, unknown>> {
  const agentName = JOB_AGENT_MAP[jobType];

  if (!agentName) {
    return {
      status: 'no_agent_found',
      jobType,
      message: `No agent mapped for job type: ${jobType}. Available: ${Object.keys(JOB_AGENT_MAP).join(', ')}`,
    };
  }

  const agent = getAgent(agentName);

  if (!agent) {
    return {
      status: 'agent_not_available',
      jobType,
      agentName,
      message: `Agent "${agentName}" is not registered`,
    };
  }

  const startTime = Date.now();

  try {
    // Add workspaceId to payload if not present
    if (workspaceId && !payload.workspaceId) {
      payload.workspaceId = workspaceId;
    }

    // Inject Content DNA and Memory context into payload for agents that use them
    if (workspaceId) {
      const dna = await getContentDNA(workspaceId);
      const memory = await getMemoryContext(workspaceId);
      if (Object.keys(dna).length > 0) {
        payload._contentDNA = dna;
      }
      if (memory.topHooks.length > 0 || memory.topTopics.length > 0) {
        payload._memoryContext = memory;
      }
    }

    const result = await agent.execute(payload as Record<string, unknown>);
    const executionTime = Date.now() - startTime;

    await logAgentExecution(agentName, jobType, executionTime, true);

    return {
      status: 'agent_completed',
      jobType,
      agentName,
      executionTime,
      result: result as Record<string, unknown>,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    await logAgentExecution(agentName, jobType, executionTime, false, error);

    return {
      status: 'agent_failed',
      jobType,
      agentName,
      executionTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ─── Content Pipeline ────────────────────────────────────────────────────────

export async function runContentPipeline(input: DraftInput): Promise<PipelineResult> {
  const { workspaceId } = input;

  // Step 1: Generate master draft
  const draftAgent = getAgent('draft-agent');
  if (!draftAgent) throw new Error('Draft agent not available');
  const draft = await draftAgent.execute(input as unknown as Record<string, unknown>);

  const draftOutput = draft as { markdown?: string; title?: string };

  // Step 2: Humanic rewrite
  const humanicAgent = getAgent('humanic-agent');
  if (!humanicAgent) throw new Error('Humanic agent not available');
  const humanic = await humanicAgent.execute({
    markdown: draftOutput.markdown || '',
    workspaceId,
  });

  const humanicOutput = humanic as { markdown?: string };

  // Step 3: SEO pack
  const seoAgent = getAgent('seo-agent');
  if (!seoAgent) throw new Error('SEO agent not available');
  const seo = await seoAgent.execute({
    content: humanicOutput.markdown || '',
    workspaceId,
  });

  // Step 4: Score the content
  const scoringAgent = getAgent('scoring-agent');
  if (!scoringAgent) throw new Error('Scoring agent not available');
  const scores = await scoringAgent.execute({
    content: humanicOutput.markdown || '',
    seoData: seo,
    workspaceId,
  });

  return { draft, humanic, seo, scores };
}

// ─── Video Pipeline ──────────────────────────────────────────────────────────

export async function runVideoPipeline(input: {
  topic: string;
  duration: number;
  style: 'educational' | 'entertainment' | 'motivational' | 'horror' | 'documentary' | 'storytelling';
  imageStyle?: 'cinematic' | 'anime' | 'realistic' | 'abstract' | 'dark_fantasy' | 'minimalist' | 'vintage' | 'neon_cyberpunk';
  voice?: string;
  language?: string;
  aspectRatio?: '9:16' | '1:1' | '16:9';
  workspaceId?: string;
}): Promise<VideoPipelineResult> {
  const { topic, duration, style, imageStyle = 'cinematic', voice, language = 'en-US', aspectRatio = '9:16', workspaceId } = input;

  // Step 1: Generate script
  const scriptAgent = getAgent('script-agent');
  if (!scriptAgent) throw new Error('Script agent not available');
  const script = await scriptAgent.execute({
    topic,
    duration,
    style,
    workspaceId,
  });

  const scriptOutput = script as { scenes?: Array<{ narration: string; visual?: string; duration: number }>; title?: string };

  // Step 2: Generate image prompts for each scene
  const imageAgent = getAgent('image-agent');
  if (!imageAgent) throw new Error('Image agent not available');
  const images = await (async () => {
    if (Array.isArray(scriptOutput.scenes) && scriptOutput.scenes.length > 0) {
      const imagePrompts: Record<string, unknown>[] = [];
      for (const scene of scriptOutput.scenes) {
        const prompt = await imageAgent.execute({
          narration: scene.narration,
          style: imageStyle,
          aspectRatio,
          sceneContext: scene.visual,
          workspaceId,
        });
        imagePrompts.push(prompt);
      }
      return imagePrompts;
    }
    return [];
  })();

  // Step 3: Generate voiceover for each scene
  const voiceAgent = getAgent('voice-agent');
  if (!voiceAgent) throw new Error('Voice agent not available');
  const voiceResults: Record<string, unknown>[] = [];
  if (Array.isArray(scriptOutput.scenes)) {
    for (const scene of scriptOutput.scenes) {
      const voiceResult = await voiceAgent.execute({
        text: scene.narration,
        voice,
        language: language as 'en-US' | 'en-GB' | 'es-ES' | 'fr-FR' | 'de-DE' | 'pt-BR' | 'ja-JP' | 'ko-KR' | 'zh-CN' | 'hi-IN' | 'ar-SA',
        workspaceId,
      });
      voiceResults.push(voiceResult);
    }
  }

  // Step 4: Compose video
  const videoComposeAgent = getAgent('video-compose-agent');
  const video = videoComposeAgent ? await videoComposeAgent.execute({
    scenes: scriptOutput.scenes,
    aspectRatio,
    style,
    voiceId: voice,
    workspaceId,
  }) : null;

  return { script, images, voice: voiceResults, video };
}

// ─── Heatmap Pipeline ────────────────────────────────────────────────────────

export async function runHeatmapPipeline(input: {
  videoUrl: string;
  intensityThreshold?: number;
  minSegmentDuration?: number;
  maxSegmentDuration?: number;
  cropMode?: 'center' | 'split_left' | 'split_right';
  outputRatio?: '9:16' | '1:1' | '16:9';
  workspaceId?: string;
}): Promise<HeatmapPipelineResult> {
  const {
    videoUrl,
    intensityThreshold = 0.7,
    minSegmentDuration = 5,
    maxSegmentDuration = 60,
    cropMode = 'center',
    outputRatio = '9:16',
    workspaceId,
  } = input;

  // Step 1: Detect heatmap
  const heatmapAgent = getAgent('heatmap-agent');
  if (!heatmapAgent) throw new Error('Heatmap agent not available');
  const heatmap = await heatmapAgent.execute({
    videoUrl,
    intensityThreshold,
    minSegmentDuration,
    maxSegmentDuration,
    workspaceId,
  });

  const heatmapOutput = heatmap as { viralSegments?: Array<{ startTime: number; endTime: number }>; peakMoment?: { startTime: number; endTime: number } };

  // Step 2: Generate clips from viral segments
  const clipAgent = getAgent('clip-agent');
  const clips: unknown[] = [];

  if (clipAgent) {
    const segments = heatmapOutput.viralSegments || [];
    const segmentsToClip = segments.slice(0, 5); // Max 5 clips

    for (const segment of segmentsToClip) {
      try {
        const clip = await clipAgent.execute({
          videoPath: videoUrl,
          startTime: segment.startTime,
          endTime: segment.endTime,
          cropMode,
          outputRatio,
          generateSubtitles: true,
          workspaceId,
        });
        clips.push(clip);
      } catch {
        // Clip generation failure should not break the pipeline
      }
    }
  }

  return { heatmap, clips };
}

// ─── TikTok Pipeline ────────────────────────────────────────────────────────

export async function runTikTokPipeline(input: {
  topic: string;
  niche?: string;
  duration?: number;
  workspaceId?: string;
}): Promise<TikTokPipelineResult> {
  const { topic, niche, duration = 60, workspaceId } = input;

  // Step 1: Find trending opportunities
  const trendAgent = getAgent('trend-agent');
  const trend = trendAgent ? await trendAgent.execute({ niche: niche || topic, platform: 'tiktok', workspaceId }) : null;

  // Step 2: Generate script
  const scriptAgent = getAgent('script-agent');
  if (!scriptAgent) throw new Error('Script agent not available');
  const script = await scriptAgent.execute({
    topic,
    duration,
    style: 'entertainment',
    workspaceId,
  });

  // Step 3: Create TikTok variant
  const tiktokAgent = getAgent('tiktok-agent');
  const tiktok = tiktokAgent ? await tiktokAgent.execute({ topic, content: script, duration, workspaceId }) : null;

  // Step 4: Generate thumbnail
  const thumbnailAgent = getAgent('thumbnail-agent');
  const thumbnail = thumbnailAgent ? await thumbnailAgent.execute({ title: topic, platform: 'tiktok', workspaceId }) : null;

  // Step 5: Generate captions
  const captionAgent = getAgent('caption-agent');
  const caption = captionAgent ? await captionAgent.execute({
    narration: (script as Record<string, unknown>)?.scenes
      ? ((script as { scenes: Array<{ narration: string }> }).scenes.map((s) => s.narration).join(' '))
      : '',
    format: 'srt',
    workspaceId,
  }) : null;

  return { trend, script, tiktok, thumbnail, caption };
}

// ─── Quick Agent Execution ───────────────────────────────────────────────────

export async function executeAgent(
  agentName: string,
  input: Record<string, unknown>
): Promise<unknown> {
  const agent = getAgent(agentName);

  if (!agent) {
    throw new Error(`Agent not found: ${agentName}. Available agents: ${listAgents().map((a) => a.name).join(', ')}`);
  }

  return agent.execute(input);
}

// ─── Get Available Agents ────────────────────────────────────────────────────

export function getAvailableAgents(): Array<{
  name: string;
  description: string;
  modelTier: ModelTier;
  engine: AgentEngine;
}> {
  return listAgents();
}

// ─── Get Pipeline Status ─────────────────────────────────────────────────────

export function getPipelineDefinitions(): Array<{
  name: string;
  description: string;
  steps: string[];
}> {
  return [
    {
      name: 'content',
      description: 'Content creation pipeline',
      steps: ['draft', 'humanic', 'seo', 'scoring', 'repurpose', 'publish'],
    },
    {
      name: 'video',
      description: 'Video creation pipeline',
      steps: ['script', 'image', 'voice', 'video-compose', 'caption', 'publish'],
    },
    {
      name: 'heatmap',
      description: 'Viral clip extraction pipeline',
      steps: ['heatmap', 'clip', 'caption', 'publish'],
    },
    {
      name: 'tiktok',
      description: 'TikTok content pipeline',
      steps: ['trend', 'script', 'tiktok', 'thumbnail', 'caption', 'publish'],
    },
    {
      name: 'review',
      description: 'Content review pipeline',
      steps: ['review', 'scoring', 'humanic', 'seo', 'tagging'],
    },
  ];
}

// ─── Logging ─────────────────────────────────────────────────────────────────

async function logAiAction(
  tier: ModelTier,
  model: string,
  taskType: string,
  responseLength: number
): Promise<void> {
  try {
    await db.systemLog.create({
      data: {
        service: 'ai',
        level: 'info',
        action: 'ai_call_completed',
        message: `AI call completed: tier=${tier}, model=${model}, task=${taskType}`,
        metadataJson: JSON.stringify({ tier, model, taskType, responseLength }),
      },
    });
  } catch {
    // Logging failure should not break the pipeline
  }
}

async function logAiError(
  tier: ModelTier,
  model: string,
  taskType: string,
  error: unknown
): Promise<void> {
  try {
    await db.systemLog.create({
      data: {
        service: 'ai',
        level: 'error',
        action: 'ai_call_failed',
        message: `AI call failed: tier=${tier}, model=${model}, task=${taskType}`,
        metadataJson: JSON.stringify({
          tier,
          model,
          taskType,
          error: error instanceof Error ? error.message : String(error),
        }),
      },
    });
  } catch {
    // Logging failure should not break the pipeline
  }
}

async function logAgentExecution(
  agentName: string,
  jobType: string,
  executionTime: number,
  success: boolean,
  error?: unknown
): Promise<void> {
  try {
    await db.systemLog.create({
      data: {
        service: 'orchestrator',
        level: success ? 'info' : 'error',
        action: success ? 'agent_execution_completed' : 'agent_execution_failed',
        message: `Agent ${agentName} ${success ? 'completed' : 'failed'} for ${jobType} in ${executionTime}ms`,
        metadataJson: JSON.stringify({
          agentName,
          jobType,
          executionTime,
          success,
          error: error instanceof Error ? error.message : undefined,
        }),
      },
    });
  } catch {
    // Logging failure should not break the orchestrator
  }
}
