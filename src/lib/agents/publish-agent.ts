// Publish Agent — Executes publishing through Publisher Factory
// Handles dry-run mode and real publishing via API

import { type Agent, type AgentResult, registerAgent, type AgentType } from "./index";
import { generateText } from "@/lib/ai";
import { db } from "@/lib/db";

async function runPublishAgent(payload: Record<string, unknown>): Promise<AgentResult> {
  const { contentId, platform, variantId, isDryRun, workspaceId, scheduledTime } = payload;
  const startTime = Date.now();

  try {
    // Look up content and variant if available
    let contentData: Record<string, unknown> | null = null;
    let variantData: Record<string, unknown> | null = null;

    if (contentId) {
      const content = await db.contentItem.findUnique({
        where: { id: contentId as string },
        include: { seoData: true, contentTags: true },
      });
      if (content) {
        contentData = {
          title: content.title,
          markdown: content.masterMarkdown,
          summary: content.summary,
          slug: content.slug,
          seo: content.seoData,
          tags: content.contentTags.map((t) => ({ tag: t.tag, category: t.category })),
        };
      }
    }

    if (variantId) {
      const variant = await db.contentVariant.findUnique({
        where: { id: variantId as string },
      });
      if (variant) {
        variantData = {
          platform: variant.platform,
          body: variant.body,
          title: variant.title,
          metadata: variant.metadataJson,
        };
      }
    }

    const targetPlatform = (platform || (variantData?.platform as string) || "wordpress") as string;

    if (isDryRun) {
      // Dry-run: simulate publishing and return what WOULD happen
      const systemPrompt = `You are a publishing simulation AI at GhostStudio AI. Simulate what would happen when publishing the given content to the specified platform.

Platform: ${targetPlatform}

Return ONLY valid JSON:
{
  "platform": "${targetPlatform}",
  "status": "dry_run_completed",
  "url": "simulated_url",
  "response": {
    "wouldSucceed": true,
    "warnings": ["any warnings about the content for this platform"],
    "requiredFields": ["list of required fields that were present/missing"],
    "platformSpecificNotes": "any platform-specific considerations"
  }
}`;

      const result = await generateText({
        prompt: `Simulate publishing to ${targetPlatform}:\n\nContent: ${JSON.stringify(contentData || { message: "No content data available" }).substring(0, 3000)}\n\nVariant: ${JSON.stringify(variantData || { message: "No variant data available" }).substring(0, 2000)}`,
        system: systemPrompt,
        temperature: 0.2,
        maxTokens: 1500,
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
          platform: targetPlatform,
          status: "dry_run_completed",
          url: `https://${targetPlatform}.example.com/dry-run/${Date.now()}`,
          response: parsed.response || { wouldSucceed: true, warnings: [], requiredFields: [], platformSpecificNotes: "" },
        },
        metadata: {
          tokensUsed: result.usage?.totalTokens,
          durationMs: Date.now() - startTime,
        },
      };
    }

    // Real publishing: Create a publish job record
    const publishJob = await db.publishJob.create({
      data: {
        workspaceId: (workspaceId as string) || "default",
        contentId: (contentId as string) || "unknown",
        contentVariantId: (variantId as string) || null,
        platform: targetPlatform,
        status: "queued",
        scheduledTime: scheduledTime ? new Date(scheduledTime as string) : null,
        isDryRun: false,
      },
    });

    return {
      success: true,
      data: {
        platform: targetPlatform,
        status: "queued",
        jobId: publishJob.id,
        url: null,
        response: {
          message: "Publish job queued successfully",
          jobId: publishJob.id,
          scheduledTime: publishJob.scheduledTime,
        },
      },
      metadata: { durationMs: Date.now() - startTime },
    };
  } catch (error) {
    console.error("[PublishAgent] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Publishing failed",
      metadata: { durationMs: Date.now() - startTime },
    };
  }
}

const publishAgent: Agent = {
  type: "publish" as AgentType,
  name: "Publish Agent",
  description: "Distributes content to publishing platforms via API or browser automation",
  category: "automation",
  run: runPublishAgent,
  execute: async (payload) => {
    const result = await runPublishAgent(payload);
    if (!result.success) throw new Error(result.error || "Publish agent failed");
    return result.data ?? {};
  },
};

registerAgent(publishAgent);
export { publishAgent };
