// Humanic Agent — Rewrites content to pass AI detection using 10 Humanic Rules
// Breaks repetitive structures, removes generic transitions, adds personality

import { type Agent, type AgentResult, registerAgent, type AgentType } from "./index";
import { generateText } from "@/lib/ai";
import { db } from "@/lib/db";

const HUMANIC_RULES = `
THE 10 HUMANIC RULES — Apply ALL of these when rewriting:

1. BREAK REPETITIVE STRUCTURE: Vary sentence length dramatically. Mix 3-word sentences with 25-word ones. No two consecutive sentences should have the same rhythm.

2. KILL GENERIC TRANSITIONS: Remove "furthermore", "moreover", "additionally", "in addition", "consequently", "therefore", "hence", "thus". Replace with natural flow or just start the next point directly.

3. ADD PERSONALITY MARKERS: Use first-person occasionally ("I've found that...", "In my experience..."). Add opinions, preferences, and subjective takes.

4. ELIMINATE AI SIGNATURES: Remove "delve into", "it's worth noting", "it goes without saying", "at the end of the day", "in today's [X] landscape", "navigating the [X]".

5. USE CONCRETE LANGUAGE: Replace abstract statements with specific examples, numbers, names, and real scenarios. "Many companies" → "3 of the 5 SaaS companies I advised".

6. IMPERFECT FLOW: Add parenthetical thoughts, rhetorical questions, and occasional tangents that a real expert would include. Not everything needs to serve the main argument.

7. CONVERSATIONAL CADENCE: Write like you're explaining to a smart friend over coffee, not delivering a TED talk. Use contractions, informal phrasing, occasional slang.

8. STRONG OPINIONS: Take a stance. Real experts have opinions. "Some might argue X, but I think Y because Z" instead of balanced "both sides" framing.

9. VARY PARAGRAPH LENGTH: Some paragraphs should be 1 sentence. Others 5-6 sentences. Never have 3+ paragraphs of similar length in a row.

10. REMOVE HEDGING LANGUAGE: Delete "arguably", "potentially", "it could be said", "one might consider". Replace with direct assertions or skip entirely.`;

interface ContentDNA {
  // Core DNA fields
  coreVoice?: string;
  sentenceRhythm?: string;
  forbiddenPatterns?: string[];
  emotionalTexture?: string;
  structuralBias?: string;
  // Legacy/shorthand fields
  voice?: string;
  tone?: string;
  audience?: string;
  perspective?: string;
}

async function getContentDNA(workspaceId?: string): Promise<ContentDNA> {
  if (!workspaceId) return {};
  try {
    const workspace = await db.workspace.findUnique({
      where: { id: workspaceId as string },
      select: { settingsJson: true },
    });
    if (workspace?.settingsJson) {
      const settings = JSON.parse(workspace.settingsJson);
      return settings.contentDNA || settings.dna || {};
    }
  } catch (error) {
    console.error("[HumanicAgent] Failed to load Content DNA:", error);
  }
  return {};
}

async function runHumanicAgent(payload: Record<string, unknown>): Promise<AgentResult> {
  const { markdown, content, workspaceId } = payload;
  const inputMarkdown = (markdown || content) as string;
  const startTime = Date.now();

  if (!inputMarkdown) {
    return {
      success: false,
      error: "No content provided for humanization",
    };
  }

  try {
    const dna = await getContentDNA(workspaceId as string | undefined);

    // Build DNA injection with full core DNA support
    const dnaVoice = dna.coreVoice || dna.voice || "professional yet approachable";
    const dnaTone = dna.emotionalTexture || dna.tone || "informative and engaging";
    const dnaAudience = dna.audience || "knowledgeable professionals";
    const dnaPerspective = dna.perspective || "industry expert with hands-on experience";
    const forbiddenStr = dna.forbiddenPatterns && dna.forbiddenPatterns.length > 0
      ? `\nFORBIDDEN PATTERNS (never use these): ${dna.forbiddenPatterns.join(', ')}`
      : '';
    const rhythmStr = dna.sentenceRhythm ? `\nSentence Rhythm: ${dna.sentenceRhythm}` : '';
    const biasStr = dna.structuralBias ? `\nStructural Bias: ${dna.structuralBias}` : '';

    const systemPrompt = `You are a humanization expert at GhostStudio AI. Your job is to rewrite AI-generated content so it reads like a real expert wrote it — someone with opinions, personality, and experience.

${HUMANIC_RULES}

CONTENT DNA ALIGNMENT:
- Voice: ${dnaVoice}
- Emotional Texture: ${dnaTone}
- Target Audience: ${dnaAudience}
- Perspective: ${dnaPerspective}${rhythmStr}${biasStr}${forbiddenStr}

CRITICAL: Preserve ALL factual information, data points, and key arguments. Only change HOW things are expressed, not WHAT is being said. The meaning must remain identical.

Return your response in this exact JSON format:
{
  "markdown": "The humanized content in markdown",
  "changes_made": ["List of specific changes you made, e.g., 'Replaced 5 generic transitions', 'Added personal anecdotes', 'Varied sentence lengths throughout']"
}`;

    const userPrompt = `Humanize the following content. Apply all 10 Humanic Rules while keeping the core message intact:

${inputMarkdown}`;

    const result = await generateText({
      prompt: userPrompt,
      system: systemPrompt,
      temperature: 0.85,
      maxTokens: 4000,
    });

    let parsed: { markdown: string; changes_made: string[] };
    try {
      const text = result.text.trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = {
          markdown: text,
          changes_made: ["Full rewrite applied"],
        };
      }
    } catch {
      parsed = {
        markdown: result.text,
        changes_made: ["Full rewrite applied — could not parse change list"],
      };
    }

    return {
      success: true,
      data: {
        markdown: parsed.markdown,
        changes_made: parsed.changes_made,
      },
      metadata: {
        tokensUsed: result.usage?.totalTokens,
        durationMs: Date.now() - startTime,
      },
    };
  } catch (error) {
    console.error("[HumanicAgent] Error humanizing content:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Humanization failed",
      metadata: { durationMs: Date.now() - startTime },
    };
  }
}

const humanicAgent: Agent = {
  type: "humanic" as AgentType,
  name: "Humanic Agent",
  description: "Removes robotic AI patterns and adds natural, human voice",
  category: "content",
  run: runHumanicAgent,
  execute: async (payload) => {
    const result = await runHumanicAgent(payload);
    if (!result.success) throw new Error(result.error || "Humanic agent failed");
    return result.data ?? {};
  },
};

registerAgent(humanicAgent);
export { humanicAgent };
