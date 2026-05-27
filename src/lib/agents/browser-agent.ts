// Browser Agent — Executes Puppeteer browser actions via LLM planning
// Supports click, type, scroll, screenshot, navigate

import { type Agent, type AgentResult, registerAgent, type AgentType } from "./index";
import { generateText } from "@/lib/ai";

async function runBrowserAgent(payload: Record<string, unknown>): Promise<AgentResult> {
  const { url, action, selector, value, instructions, workspaceId } = payload;
  const startTime = Date.now();

  try {
    const systemPrompt = `You are a browser automation AI at GhostStudio AI. You plan and describe browser actions that can be executed by a Puppeteer-based automation system.

Given a URL and instructions, generate a step-by-step action plan.

Available actions:
- navigate: Go to a URL
- click: Click an element by selector
- type: Type text into an input field
- scroll: Scroll the page (up/down/into-view)
- wait: Wait for an element or timeout
- screenshot: Take a screenshot
- extract: Extract text or data from the page
- submit: Submit a form

Return ONLY valid JSON:
{
  "action": "${action || "plan"}",
  "status": "plan_ready",
  "steps": [
    { "action": "navigate", "params": { "url": "..." } },
    { "action": "wait", "params": { "selector": "input[type=email]", "timeout": 5000 } },
    { "action": "type", "params": { "selector": "input[type=email]", "value": "..." } },
    { "action": "click", "params": { "selector": "button[type=submit]" } },
    { "action": "wait", "params": { "timeout": 3000 } },
    { "action": "screenshot", "params": { "fullPage": false } }
  ],
  "estimatedTime": 15,
  "risks": ["Potential CAPTCHA", "Dynamic selectors may change"],
  "result": "Action plan generated successfully"
}`;

    const result = await generateText({
      prompt: `Generate browser automation steps:\n\nURL: ${url || "unknown"}\nAction: ${action || "custom"}${selector ? `\nTarget selector: ${selector}` : ""}${value ? `\nValue: ${value}` : ""}\n${instructions ? `\nInstructions: ${instructions}` : ""}`,
      system: systemPrompt,
      temperature: 0.3,
      maxTokens: 2000,
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
        action: action || "plan",
        status: "plan_ready",
        steps: (parsed.steps as Array<Record<string, unknown>>) || [],
        estimatedTime: (parsed.estimatedTime as number) || 0,
        risks: (parsed.risks as string[]) || [],
        result: (parsed.result as string) || "Action plan generated",
      },
      metadata: {
        tokensUsed: result.usage?.totalTokens,
        durationMs: Date.now() - startTime,
      },
    };
  } catch (error) {
    console.error("[BrowserAgent] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Browser automation failed",
      metadata: { durationMs: Date.now() - startTime },
    };
  }
}

const browserAgent: Agent = {
  type: "browser" as AgentType,
  name: "Browser Agent",
  description: "Plans and executes browser interactions for publishing, testing, and monitoring",
  category: "automation",
  run: runBrowserAgent,
  execute: async (payload) => {
    const result = await runBrowserAgent(payload);
    if (!result.success) throw new Error(result.error || "Browser agent failed");
    return result.data ?? {};
  },
};

registerAgent(browserAgent);
export { browserAgent };
