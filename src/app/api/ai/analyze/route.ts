import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { SYSTEM_PROMPT, aiChat } from '@/lib/ai'

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { workspaceId } = body

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 })
    }

    const workspace = await db.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: { include: { user: { select: { name: true, email: true } } } },
        tasks: { take: 20, orderBy: { createdAt: 'desc' } },
        accounts: true,
        transactions: { take: 30, orderBy: { date: 'desc' } },
        budgetRules: { where: { isActive: true } },
        financialGoals: true,
        vaultDocuments: { take: 20, orderBy: { updatedAt: 'desc' } },
        memories: { take: 30, orderBy: { createdAt: 'desc' } },
        suggestions: { where: { status: 'pending' }, take: 10 },
      },
    })

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Workspace membership verification
    if (workspace.ownerId !== session.user.id) {
      const membership = await db.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
      })
      if (!membership) {
        return NextResponse.json({ error: 'Forbidden: You do not have access to this workspace' }, { status: 403 })
      }
    }

    const workspaceData = {
      name: workspace.name,
      type: workspace.type,
      autonomousLevel: workspace.autonomousLevel,
      members: workspace.members.map((m) => ({
        alias: m.alias || m.user.name,
        role: m.role,
        energyLevel: m.energyLevel,
        stressLevel: m.stressLevel,
        authorityLevel: m.authorityLevel,
      })),
      tasks: workspace.tasks.map((t) => ({
        title: t.title,
        status: t.status,
        priority: t.priority,
        timeCost: t.timeCost,
        energyCost: t.energyCost,
        moneyCost: t.moneyCost,
        dueDate: t.dueDate,
      })),
      accounts: workspace.accounts.map((a) => ({
        name: a.name,
        type: a.type,
        balance: a.balance,
        isEmergency: a.isEmergency,
      })),
      recentTransactions: workspace.transactions.map((t) => ({
        amount: t.amount,
        category: t.category,
        type: t.type,
        description: t.description,
        date: t.date,
      })),
      budgetRules: workspace.budgetRules.map((r) => ({
        category: r.category,
        limitAmount: r.limitAmount,
        period: r.period,
        priority: r.priority,
      })),
      goals: workspace.financialGoals.map((g) => ({
        name: g.name,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        deadline: g.deadline,
      })),
      vaultDocuments: workspace.vaultDocuments.map((d) => ({
        title: d.title,
        type: d.type,
        priority: d.priority,
        scope: d.scope,
      })),
      recentMemories: workspace.memories.map((m) => ({
        layer: m.layer,
        category: m.category,
        content: m.content.substring(0, 200),
        importance: m.importance,
      })),
      pendingSuggestions: workspace.suggestions.length,
    }

    const analysisPrompt = `Analyze the following workspace data and provide a comprehensive autonomous analysis. Identify risks, opportunities, and actionable insights.

Workspace Data:
${JSON.stringify(workspaceData, null, 2)}

Please provide your analysis in the following format:
1. **Overall Health Score** (0-100)
2. **Key Risks** (financial, time, energy, relational)
3. **Opportunities** (immediate actions that could improve outcomes)
4. **Resource Allocation Assessment** (time, money, energy distribution)
5. **Recommendations** (prioritized list of actions)
6. **Conflict Warnings** (any potential conflicts between goals, tasks, or members)`

    const analysis = await aiChat([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: analysisPrompt },
    ])

    await db.agentLog.create({
      data: {
        workspaceId,
        agentType: 'executive',
        action: 'autonomous_analysis',
        result: analysis.substring(0, 2000),
        reasoning: 'Full workspace data analysis triggered by user request',
        autonomousLevel: workspace.autonomousLevel,
      },
    })

    await db.memory.create({
      data: {
        workspaceId,
        layer: 'decision',
        category: 'analysis',
        content: `Autonomous analysis completed. Key findings: ${analysis.substring(0, 500)}`,
        importance: 7,
      },
    })

    return NextResponse.json({
      analysis,
      workspaceData: {
        name: workspace.name,
        type: workspace.type,
        memberCount: workspace.members.length,
        taskCount: workspace.tasks.length,
        accountCount: workspace.accounts.length,
        pendingSuggestions: workspace.suggestions.length,
      },
    })
  } catch (error) {
    console.error('AI analyze error:', error)
    return NextResponse.json({ error: 'Failed to run analysis' }, { status: 500 })
  }
}
