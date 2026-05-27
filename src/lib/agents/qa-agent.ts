// QA Agent — Generates Q&A pairs from content for FAQs, interviews, and engagement
// Creates question-answer pairs that capture key insights

import { type Agent, type AgentResult, registerAgent, type AgentType } from "./index";
import { generateText } from "@/lib/ai";
import { db } from "@/lib/db";

interface ContentDNA {
  coreVoice?: string;
  sentenceRhythm?: string;
  forbiddenPatterns?: string[];
  emotionalTexture?: string;
  structuralBias?: string;
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
    console.error("[QAAgent] Failed to load Content DNA:", error);
  }
  return {};
}

async function runQAAgent(payload: Record<string, unknown>): Promise<AgentResult> {
  const { content, markdown, title, qaType, count, workspaceId } = payload;
  const inputContent = (content || markdown) as string;
  const inputTitle = title as string;
  const inputType = (qaType || "faq") as string;
  const inputCount = Number(count) || 8;
  const startTime = Date.now();

  if (!inputContent) {
    return { success: false, error: "No content provided for Q&A generation" };
  }

  try {
    const dna = await getContentDNA(workspaceId as string | undefined);
    const dnaAudience = dna.audience || "knowledgeable professionals";
    const dnaPerspective = dna.perspective || "industry expert with hands-on experience";
    const forbiddenStr = dna.forbiddenPatterns && dna.forbiddenPatterns.length > 0
      ? `\nFORBIDDEN PATTERNS (never use): ${dna.forbiddenPatterns.join(', ')}`
      : '';

    const qaSpecs: Record<string, string> = {
      faq: `Generate Frequently Asked Questions with clear, concise answers. Questions should be what a reader would naturally ask. Answers should be direct and informative.`,
      interview: `Generate interview-style Q&A pairs. Questions should be probing and thoughtful, as asked by an expert interviewer. Answers should be detailed and showcase expertise.`,
      social_engagement: `Generate engaging question-answer pairs for social media. Questions should be hooky and shareable. Answers should be punchy and conversation-starting.`,
      quiz: `Generate quiz questions with multiple-choice answers. Include the correct answer and brief explanation. Format: question, 4 options, correct answer, explanation.`,
    };

    const spec = qaSpecs[inputType.toLowerCase()] || qaSpecs.faq;

    const systemPrompt = `You are a Q&A generation AI at GhostStudio AI. Create high-quality question-answer pairs from content.

CONTENT DNA ALIGNMENT:
- Target Audience: ${dnaAudience}
- Perspective: ${dnaPerspective}${forbiddenStr}

${spec}

Generate exactly ${inputCount} Q&A pairs.

Rules:
1. Questions must be answerable from the source content
2. Answers must be factually accurate and grounded in the content
3. Cover different aspects of the content
4. Progress from basic to advanced questions
5. Include specific details and data points in answers

Return ONLY valid JSON:
{
  "pairs": [
    {
      "question": "The question",
      "answer": "The answer",
      "category": "topic category",
      "difficulty": "basic|intermediate|advanced"
    }
  ],
  "qaType": "${inputType}",
  "sourceTitle": "${inputTitle || ""}"
}`;

    const result = await generateText({
      prompt: `Generate ${inputCount} ${inputType} Q&A pairs from this content:\n\n${inputTitle ? `Title: ${inputTitle}\n\n` : ""}${inputContent.substring(0, 6000)}`,
      system: systemPrompt,
      temperature: 0.4,
      maxTokens: 3000,
    });

    let parsed: Record<string, unknown>;
    try {
      const text = result.text.trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      parsed = {};
    }

    return {
      success: true,
      data: {
        pairs: parsed.pairs || [],
        qaType: inputType,
        sourceTitle: inputTitle || "",
      },
      metadata: {
        tokensUsed: result.usage?.totalTokens,
        durationMs: Date.now() - startTime,
      },
    };
  } catch (error) {
    console.error("[QAAgent] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Q&A generation failed",
      metadata: { durationMs: Date.now() - startTime },
    };
  }
}

const qaAgent: Agent = {
  type: "qa" as AgentType,
  name: "QA Agent",
  description: "Generates Q&A pairs from content for FAQs, interviews, and social engagement",
  category: "content",
  run: runQAAgent,
  execute: async (payload) => {
    const result = await runQAAgent(payload);
    if (!result.success) throw new Error(result.error || "QA agent failed");
    return result.data ?? {};
  },
};

registerAgent(qaAgent);
export { qaAgent };
