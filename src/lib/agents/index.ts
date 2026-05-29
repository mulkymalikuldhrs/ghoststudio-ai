// Agent Registry — Central registry for all AI agents
// 24 agents: Draft, Humanic, SEO, Repurpose, Scoring, Tagging,
// Script, Image, Voice, Video Compose, Heatmap, Clip, Publish,
// Strategy, Browser, Memory, TikTok, Thumbnail, Caption, Trend,
// Review, Format, Summary, QA

export type AgentType =
  | "draft"
  | "humanic"
  | "seo"
  | "repurpose"
  | "scoring"
  | "tagging"
  | "script"
  | "image"
  | "voice"
  | "video_compose"
  | "heatmap"
  | "clip"
  | "publish"
  | "strategy"
  | "browser"
  | "memory"
  | "tiktok"
  | "thumbnail"
  | "caption"
  | "trend"
  | "review"
  | "format"
  | "summary"
  | "qa";

export type ModelTier = "cheap" | "mid" | "premium";

export type AgentEngine = "llm" | "deterministic" | "hybrid";

export interface AgentDefinition {
  name: string;
  description: string;
  modelTier: ModelTier;
  engine: AgentEngine;
}

export interface Agent {
  type: AgentType;
  name: string;
  description: string;
  category: "content" | "video" | "analytics" | "automation";
  run: (payload: Record<string, unknown>) => Promise<AgentResult>;
  execute: (payload: Record<string, unknown>) => Promise<Record<string, unknown>>;
}

export interface AgentResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  metadata?: {
    tokensUsed?: number;
    durationMs?: number;
    model?: string;
    [key: string]: unknown;
  };
}

// Agent registry
const registry = new Map<AgentType, Agent>();

// Also index by hyphenated name (e.g. 'draft-agent') for orchestrator compatibility
const registryByName = new Map<string, Agent>();

export function registerAgent(agent: Agent): void {
  registry.set(agent.type, agent);
  registryByName.set(`${agent.type}-agent`, agent);
}

export function getAgent(typeOrName: string): Agent | undefined {
  // Try direct type key first (e.g. 'draft'), then hyphenated name (e.g. 'draft-agent')
  return registry.get(typeOrName as AgentType) ?? registryByName.get(typeOrName);
}

export function getAllAgents(): Agent[] {
  return Array.from(registry.values());
}

export function listAgents(): Array<AgentDefinition & { name: string; description: string }> {
  return Array.from(registry.values()).map((agent) => ({
    name: agent.name,
    description: agent.description,
    modelTier: getModelTierForAgent(agent.type),
    engine: getEngineForAgent(agent.type),
  }));
}

export function getAgentsByCategory(category: Agent["category"]): Agent[] {
  return Array.from(registry.values()).filter((a) => a.category === category);
}

function getModelTierForAgent(type: AgentType): ModelTier {
  const tierMap: Record<AgentType, ModelTier> = {
    tagging: "cheap",
    scoring: "mid",
    draft: "premium",
    humanic: "premium",
    seo: "mid",
    repurpose: "mid",
    script: "mid",
    image: "cheap",
    voice: "cheap",
    video_compose: "cheap",
    heatmap: "mid",
    clip: "cheap",
    publish: "cheap",
    strategy: "mid",
    browser: "cheap",
    memory: "cheap",
    tiktok: "mid",
    thumbnail: "cheap",
    caption: "cheap",
    trend: "mid",
    review: "mid",
    format: "mid",
    summary: "cheap",
    qa: "cheap",
  };
  return tierMap[type] ?? "mid";
}

function getEngineForAgent(type: AgentType): AgentEngine {
  const engineMap: Record<AgentType, AgentEngine> = {
    draft: "llm",
    humanic: "llm",
    seo: "llm",
    repurpose: "llm",
    scoring: "hybrid",
    tagging: "llm",
    script: "llm",
    image: "llm",
    voice: "hybrid",
    video_compose: "hybrid",
    heatmap: "llm",
    clip: "llm",
    publish: "hybrid",
    strategy: "llm",
    browser: "hybrid",
    memory: "hybrid",
    tiktok: "llm",
    thumbnail: "llm",
    caption: "llm",
    trend: "llm",
    review: "llm",
    format: "llm",
    summary: "llm",
    qa: "llm",
  };
  return engineMap[type] ?? "llm";
}

// Agent descriptions for the UI
export const AGENT_DESCRIPTIONS: Record<AgentType, { name: string; description: string; category: Agent["category"] }> = {
  draft: {
    name: "Draft Agent",
    description: "Generates initial content from ideas, prompts, or source notes. Creates the first version of an article.",
    category: "content",
  },
  humanic: {
    name: "Humanic Agent",
    description: "Removes robotic AI patterns and adds natural, human voice. Makes content sound like an expert wrote it.",
    category: "content",
  },
  seo: {
    name: "SEO Agent",
    description: "Optimizes content for search engines. Adds meta data, improves headings, suggests internal links.",
    category: "content",
  },
  repurpose: {
    name: "Repurpose Agent",
    description: "Creates platform-specific variants from master content. Adapts format, tone, and length for each platform.",
    category: "content",
  },
  scoring: {
    name: "Scoring Agent",
    description: "Evaluates content quality across 4 dimensions: Quality, Humanic, SEO, Trust. Determines publish readiness.",
    category: "analytics",
  },
  tagging: {
    name: "Tagging Agent",
    description: "Automatically categorizes and tags content with topics, formats, niches, and tones.",
    category: "content",
  },
  script: {
    name: "Script Agent",
    description: "Writes video narration scripts with scene breakdowns, timing, and visual descriptions.",
    category: "video",
  },
  image: {
    name: "Image Agent",
    description: "Generates visual assets for video scenes using AI image generation or template rendering.",
    category: "video",
  },
  voice: {
    name: "Voice Agent",
    description: "Converts script text to speech using TTS. Manages voice selection and audio generation.",
    category: "video",
  },
  video_compose: {
    name: "Video Compose Agent",
    description: "Assembles scenes, audio, and transitions into a final video. Coordinates the render pipeline.",
    category: "video",
  },
  heatmap: {
    name: "Heatmap Agent",
    description: "Analyzes YouTube audience retention heatmaps to identify engagement peaks and drops.",
    category: "analytics",
  },
  clip: {
    name: "Clip Agent",
    description: "Extracts viral clips from videos based on heatmap analysis and engagement scoring.",
    category: "video",
  },
  publish: {
    name: "Publish Agent",
    description: "Distributes content to publishing platforms via API or browser automation. Handles scheduling.",
    category: "automation",
  },
  strategy: {
    name: "Strategy Agent",
    description: "Recommends content strategy based on memory, energy levels, and analytics. Plans content calendar.",
    category: "analytics",
  },
  browser: {
    name: "Browser Agent",
    description: "Automates browser interactions for publishing, testing, and monitoring. Handles login, form filling, screenshots.",
    category: "automation",
  },
  memory: {
    name: "Memory Agent",
    description: "Updates and manages the memory system. Learns from analytics, reinforces patterns, decays stale entries.",
    category: "analytics",
  },
  tiktok: {
    name: "TikTok Agent",
    description: "Creates TikTok-optimized short-form video content with hooks, scripts, and viral metadata.",
    category: "video",
  },
  thumbnail: {
    name: "Thumbnail Agent",
    description: "Generates thumbnail concepts and AI image prompts for YouTube, TikTok, and other video platforms.",
    category: "video",
  },
  caption: {
    name: "Caption Agent",
    description: "Generates captions and subtitles for video content in SRT, VTT, and other formats.",
    category: "video",
  },
  trend: {
    name: "Trend Agent",
    description: "Detects and analyzes trending topics for content creation opportunities and trend timing.",
    category: "analytics",
  },
  review: {
    name: "Review Agent",
    description: "AI editorial review for content quality, accuracy, voice alignment, and publish readiness.",
    category: "content",
  },
  format: {
    name: "Format Agent",
    description: "Transforms content between formats: article→thread, article→newsletter, long→short, etc.",
    category: "content",
  },
  summary: {
    name: "Summary Agent",
    description: "Generates concise summaries from long-form content in multiple formats: brief, detailed, executive.",
    category: "content",
  },
  qa: {
    name: "QA Agent",
    description: "Generates Q&A pairs from content for FAQs, interviews, quizzes, and social engagement.",
    category: "content",
  },
};

// ─── Auto-register all agents by importing their modules ────────────────────
// Each agent file self-registers when imported via registerAgent()

