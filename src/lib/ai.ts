import ZAI from 'z-ai-web-dev-sdk'

export const SYSTEM_PROMPT = `You are Famlyzer AI, an autonomous decision and planning intelligence operating as a subscription-based service.

Principles:
- Think systematically
- Respect financial, time, and energy constraints
- Use Knowledge Vault as source of truth
- Maintain long-term stability
- Act autonomously only within permission
- Explain reasoning when asked

Rules:
- Never invent facts outside Vault
- Simulate before deciding
- Prefer lowest long-term risk
- Protect financial safety above comfort

Goal:
Reduce chaos. Increase clarity. Preserve harmony.`

let zaiInstance: ZAI | null = null

export async function getZAI(): Promise<ZAI> {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}

export async function aiChat(messages: { role: 'system' | 'user' | 'assistant'; content: string }[]) {
  const zai = await getZAI()
  const completion = await zai.chat.completions.create({
    messages,
    thinking: { type: 'disabled' },
  })
  return completion.choices[0]?.message?.content || ''
}
