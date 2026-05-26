import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { SYSTEM_PROMPT, aiChat } from '@/lib/ai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspaceId, type } = body

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 })
    }

    const validTypes = ['preventive', 'corrective', 'strategic', 'behavioral']
    const suggestionType = validTypes.includes(type) ? type : 'preventive'

    const workspace = await db.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: { include: { user: { select: { name: true } } } },
        tasks: { where: { status: { in: ['pending', 'approved'] } }, take: 15, orderBy: { priority: 'desc' } },
        accounts: true,
        transactions: { take: 20, orderBy: { date: 'desc' } },
        budgetRules: { where: { isActive: true } },
        memories: { where: { layer: 'long_term' }, take: 10, orderBy: { importance: 'desc' } },
      },
    })

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const contextData = {
      members: workspace.members.map((m) => ({
        alias: m.alias || m.user.name,
        energy: m.energyLevel,
        stress: m.stressLevel,
      })),
      pendingTasks: workspace.tasks.map((t) => ({
        title: t.title,
        priority: t.priority,
        timeCost: t.timeCost,
        energyCost: t.energyCost,
        moneyCost: t.moneyCost,
      })),
      accounts: workspace.accounts.map((a) => ({
        name: a.name,
        balance: a.balance,
        isEmergency: a.isEmergency,
      })),
      recentSpending: workspace.transactions
        .filter((t) => t.type === 'expense')
        .map((t) => ({ category: t.category, amount: t.amount })),
      budgetRules: workspace.budgetRules.map((r) => ({
        category: r.category,
        limit: r.limitAmount,
        priority: r.priority,
      })),
      longTermPatterns: workspace.memories.map((m) => m.content.substring(0, 150)),
    }

    const suggestPrompt = `Generate ${suggestionType} suggestions for this workspace. Type definition:
- preventive: anticipate problems before they happen
- corrective: address issues that are starting to develop
- strategic: long-term planning and optimization
- behavioral: patterns and habits to adopt or change

Context:
${JSON.stringify(contextData, null, 2)}

For each suggestion, provide EXACTLY this JSON format (array of 3-5 suggestions):
[
  {
    "title": "Brief title",
    "reason": "Why this suggestion is needed",
    "consequence": "What happens if not acted upon",
    "actionData": {}
  }
]

Return ONLY the JSON array, no other text.`

    const rawResponse = await aiChat([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: suggestPrompt },
    ])

    let suggestions = []
    try {
      const jsonMatch = rawResponse.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0])
      }
    } catch {
      suggestions = [{
        title: `AI ${suggestionType} suggestion`,
        reason: rawResponse.substring(0, 500),
        consequence: 'No specific consequence identified',
        actionData: {},
      }]
    }

    const createdSuggestions = await Promise.all(
      suggestions.slice(0, 5).map((s: { title?: string; reason?: string; consequence?: string; actionData?: unknown }) =>
        db.suggestion.create({
          data: {
            workspaceId,
            type: suggestionType,
            agentSource: 'executive',
            title: s.title || 'Untitled suggestion',
            reason: s.reason || '',
            consequence: s.consequence || null,
            actionData: s.actionData ? JSON.stringify(s.actionData) : null,
          },
        })
      )
    )

    await db.agentLog.create({
      data: {
        workspaceId,
        agentType: 'executive',
        action: `generate_${suggestionType}_suggestions`,
        result: `Generated ${createdSuggestions.length} suggestions`,
        reasoning: `Analyzed workspace data for ${suggestionType} insights`,
        autonomousLevel: workspace.autonomousLevel,
      },
    })

    return NextResponse.json({
      type: suggestionType,
      suggestions: createdSuggestions,
    })
  } catch (error) {
    console.error('AI suggest error:', error)
    return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 })
  }
}
