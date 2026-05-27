// Review Agent — AI editorial review for content quality, accuracy, and alignment
// Provides detailed feedback and revision suggestions

import { type Agent, type AgentResult, registerAgent, type AgentType } from "./index";
import { generateText } from "@/lib/ai";
import { db } from "@/lib/db";

interface ContentDNA {
  voice?: string;
  tone?: string;
  audience?: string;
  perspective?: string;
}

async function runReviewAgent(payload: Record<string, unknown>): Promise<AgentResult> {
  const { content, markdown, title, workspaceId, reviewType } = payload;
  const inputContent = (content || markdown) as string;
  const inputTitle = title as string;
  const inputReviewType = (reviewType || "comprehensive") as string;
  const startTime = Date.now();

  if (!inputContent) {
    return { success: false, error: "No content provided for review" };
  }

  try {
    let dna: ContentDNA = {};
    if (workspaceId) {
      try {
        const workspace = await db.workspace.findUnique({
          where: { id: workspaceId as string },
          select: { settingsJson: true },
        });
        if (workspace?.settingsJson) {
          const settings = JSON.parse(workspace.settingsJson);
          dna = settings.contentDNA || settings.dna || {};
        }
      } catch {
        // DNA not available
      }
    }

    const systemPrompt = `You are an expert editorial reviewer at GhostStudio AI. Conduct a thorough review of the given content.

${inputReviewType === "comprehensive" ? `Review dimensions:
1. CONTENT QUALITY: Accuracy, depth, originality, value
2. STRUCTURE: Flow, organization, heading hierarchy, transitions
3. VOICE ALIGNMENT: Does it match the Content DNA?
4. AI DETECTION RISK: Could this be flagged as AI-generated?
5. AUDIENCE FIT: Will the target audience find this valuable?
6. PUBLISH READINESS: Is this ready to publish, or does it need revision?` : `Focus review on: ${inputReviewType}`}

CONTENT DNA:
- Voice: ${dna.voice || "professional yet approachable"}
- Tone: ${dna.tone || "informative and engaging"}
- Target Audience: ${dna.audience || "knowledgeable professionals"}
- Perspective: ${dna.perspective || "industry expert"}

Return ONLY valid JSON:
{
  "overallVerdict": "publish_as_is|minor_revisions|major_revisions|rewrite_needed",
  "scores": {
    "contentQuality": 85,
    "structure": 80,
    "voiceAlignment": 90,
    "aiDetectionRisk": 30,
    "audienceFit": 88,
    "publishReadiness": 82
  },
  "issues": [
    { "type": "critical|warning|suggestion", "location": "paragraph 3", "description": "Issue description", "suggestion": "How to fix it" }
  ],
  "highlights": [
    { "location": "opening hook", "description": "What works well" }
  ],
  "revisionSummary": "Brief summary of what needs to change before publishing",
  "estimatedRevisionTime": "30 minutes"
}`;

    const result = await generateText({
      prompt: `Review this content:\n\n${inputTitle ? `Title: ${inputTitle}\n\n` : ""}${inputContent.substring(0, 6000)}`,
      system: systemPrompt,
      temperature: 0.3,
      maxTokens: 2500,
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
        overallVerdict: parsed.overallVerdict || "minor_revisions",
        scores: parsed.scores || {},
        issues: parsed.issues || [],
        highlights: parsed.highlights || [],
        revisionSummary: parsed.revisionSummary || "",
        estimatedRevisionTime: parsed.estimatedRevisionTime || "",
      },
      metadata: {
        tokensUsed: result.usage?.totalTokens,
        durationMs: Date.now() - startTime,
      },
    };
  } catch (error) {
    console.error("[ReviewAgent] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Content review failed",
      metadata: { durationMs: Date.now() - startTime },
    };
  }
}

const reviewAgent: Agent = {
  type: "review" as AgentType,
  name: "Review Agent",
  description: "AI editorial review for content quality, accuracy, and alignment with Content DNA",
  category: "content",
  run: runReviewAgent,
  execute: async (payload) => {
    const result = await runReviewAgent(payload);
    if (!result.success) throw new Error(result.error || "Review agent failed");
    return result.data ?? {};
  },
};

registerAgent(reviewAgent);
export { reviewAgent };
