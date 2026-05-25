import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { SYSTEM_PROMPT, aiChat } from '@/lib/ai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspaceId } = body

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 })
    }

    const workspace = await db.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        accounts: true,
        transactions: { take: 50, orderBy: { date: 'desc' } },
        budgetRules: { where: { isActive: true } },
        financialGoals: true,
      },
    })

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const financeData = {
      accounts: workspace.accounts.map((a) => ({
        name: a.name,
        type: a.type,
        balance: a.balance,
        currency: a.currency,
        isEmergency: a.isEmergency,
      })),
      transactions: workspace.transactions.map((t) => ({
        amount: t.amount,
        category: t.category,
        type: t.type,
        description: t.description,
        date: t.date,
        isRecurring: t.isRecurring,
      })),
      budgetRules: workspace.budgetRules.map((r) => ({
        category: r.category,
        limit: r.limitAmount,
        period: r.period,
        priority: r.priority,
      })),
      goals: workspace.financialGoals.map((g) => ({
        name: g.name,
        target: g.targetAmount,
        current: g.currentAmount,
        deadline: g.deadline,
      })),
    }

    const totalBalance = workspace.accounts.reduce((sum, a) => sum + a.balance, 0)
    const emergencyFunds = workspace.accounts.filter((a) => a.isEmergency).reduce((sum, a) => sum + a.balance, 0)
    const totalExpenses = workspace.transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
    const totalIncome = workspace.transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)

    const auditPrompt = `Perform a comprehensive financial audit for this workspace.

Financial Summary:
- Total Balance: ${totalBalance}
- Emergency Funds: ${emergencyFunds}
- Recent Income: ${totalIncome}
- Recent Expenses: ${totalExpenses}

Detailed Data:
${JSON.stringify(financeData, null, 2)}

Analyze and provide:
1. **Financial Health Score** (0-100)
2. **Spending Analysis** (by category, patterns, anomalies)
3. **Budget Compliance** (are budget rules being followed?)
4. **Emergency Fund Assessment** (is it adequate?)
5. **Goal Progress** (are financial goals on track?)
6. **Risk Assessment** (financial risks identified)
7. **Recommendations** (specific, actionable financial advice)
8. **Veto Decisions** (any pending expenses that should be blocked?)

Format your response as structured analysis with clear sections.`

    const audit = await aiChat([
      { role: 'system', content: SYSTEM_PROMPT + '\n\nYou are operating as the Finance Agent. Your role includes financial analysis, budget enforcement, and financial safety protection. You have veto power over dangerous financial decisions.' },
      { role: 'user', content: auditPrompt },
    ])

    await db.agentLog.create({
      data: {
        workspaceId,
        agentType: 'finance',
        action: 'financial_audit',
        result: `Financial audit completed. Balance: ${totalBalance}, Emergency: ${emergencyFunds}, Income: ${totalIncome}, Expenses: ${totalExpenses}`,
        reasoning: 'Periodic financial audit based on workspace data',
        autonomousLevel: workspace.autonomousLevel,
      },
    })

    await db.memory.create({
      data: {
        workspaceId,
        layer: 'long_term',
        category: 'finance_audit',
        content: `Financial audit: Balance ${totalBalance}, Emergency ${emergencyFunds}. Key finding: ${audit.substring(0, 300)}`,
        importance: 7,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    })

    return NextResponse.json({
      audit,
      summary: {
        totalBalance,
        emergencyFunds,
        totalIncome,
        totalExpenses,
        netCashFlow: totalIncome - totalExpenses,
        accountCount: workspace.accounts.length,
        goalCount: workspace.financialGoals.length,
      },
    })
  } catch (error) {
    console.error('AI audit finances error:', error)
    return NextResponse.json({ error: 'Failed to audit finances' }, { status: 500 })
  }
}
