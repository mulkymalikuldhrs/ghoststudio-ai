import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { SYSTEM_PROMPT, aiChat } from '@/lib/ai'

const AGENT_CONFIGS: Record<string, { name: string; description: string; focus: string }> = {
  planner: {
    name: 'Planner Agent',
    description: 'Manages schedules, tasks, and resource allocation',
    focus: 'Optimize task scheduling, detect time conflicts, balance workloads across members, ensure deadlines are met.',
  },
  finance: {
    name: 'Finance Agent',
    description: 'Manages budgets, spending, and financial safety',
    focus: 'Monitor spending patterns, enforce budget rules, protect emergency funds, track goal progress, veto unsafe expenses.',
  },
  mediator: {
    name: 'Mediator Agent',
    description: 'Manages interpersonal dynamics and conflicts',
    focus: 'Detect conflicts between members, suggest compromises, balance competing priorities, ensure fair resource distribution.',
  },
  health: {
    name: 'Health Agent',
    description: 'Monitors energy, stress, and well-being',
    focus: 'Track member energy and stress levels, suggest rest periods, prevent burnout, balance workload with capacity.',
  },
  education: {
    name: 'Education Agent',
    description: 'Manages skill development and learning',
    focus: 'Identify skill gaps, suggest learning paths, allocate education resources, track progress.',
  },
  memory: {
    name: 'Memory Agent',
    description: 'Manages consistency and long-term patterns',
    focus: 'Maintain consistency across decisions, detect pattern changes, ensure decisions align with past commitments and values.',
  },
  executive: {
    name: 'Executive Agent',
    description: 'Makes final decisions and coordinates other agents',
    focus: 'Synthesize inputs from all agents, make final decisions within autonomous level, coordinate agent activities, manage escalation.',
  },
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspaceId, agentType, input } = body

    if (!workspaceId || !agentType) {
      return NextResponse.json({ error: 'workspaceId and agentType are required' }, { status: 400 })
    }

    const config = AGENT_CONFIGS[agentType]
    if (!config) {
      return NextResponse.json(
        { error: `Invalid agentType. Supported: ${Object.keys(AGENT_CONFIGS).join(', ')}` },
        { status: 400 }
      )
    }

    const workspace = await db.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: { include: { user: { select: { name: true, email: true } } } },
        tasks: { take: 20, orderBy: { createdAt: 'desc' } },
        accounts: true,
        transactions: { take: 20, orderBy: { date: 'desc' } },
        budgetRules: { where: { isActive: true } },
        financialGoals: true,
        vaultDocuments: { take: 10, orderBy: { updatedAt: 'desc' } },
        memories: { take: 20, orderBy: { createdAt: 'desc' } },
        suggestions: { where: { status: 'pending' }, take: 10 },
      },
    })

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const workspaceContext = {
      name: workspace.name,
      type: workspace.type,
      autonomousLevel: workspace.autonomousLevel,
      members: workspace.members.map((m) => ({
        alias: m.alias || m.user.name,
        role: m.role,
        energy: m.energyLevel,
        stress: m.stressLevel,
        authority: m.authorityLevel,
      })),
      recentTasks: workspace.tasks.map((t) => ({ title: t.title, status: t.status, priority: t.priority })),
      accounts: workspace.accounts.map((a) => ({ name: a.name, balance: a.balance, isEmergency: a.isEmergency })),
      budgetRules: workspace.budgetRules.map((r) => ({ category: r.category, limit: r.limitAmount })),
      pendingSuggestions: workspace.suggestions.map((s) => ({ type: s.type, title: s.title, status: s.status })),
    }

    const agentPrompt = `You are now operating as the ${config.name}.
Role: ${config.description}
Focus: ${config.focus}

Current Workspace Context:
${JSON.stringify(workspaceContext, null, 2)}

${input ? `Specific Input/Task: ${input}` : 'Perform a general assessment of your focus area and provide actionable insights.'}

Provide your response with:
1. **Assessment** (current state of your focus area)
2. **Actions** (specific actions you recommend or are taking)
3. **Warnings** (any risks or issues detected)
4. **Memory Updates** (any patterns or decisions to record for future reference)`

    const response = await aiChat([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: agentPrompt },
    ])

    await db.agentLog.create({
      data: {
        workspaceId,
        agentType,
        action: input ? `custom_run: ${input.substring(0, 100)}` : 'general_assessment',
        result: response.substring(0, 2000),
        reasoning: `${config.name} ran assessment based on workspace data`,
        autonomousLevel: workspace.autonomousLevel,
      },
    })

    await db.memory.create({
      data: {
        workspaceId,
        layer: 'short_term',
        category: `agent_${agentType}`,
        content: `${config.name} run: ${response.substring(0, 300)}`,
        importance: 6,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    })

    return NextResponse.json({
      agentType,
      agentName: config.name,
      response,
      autonomousLevel: workspace.autonomousLevel,
    })
  } catch (error) {
    console.error('AI agent run error:', error)
    return NextResponse.json({ error: 'Failed to run agent' }, { status: 500 })
  }
}
