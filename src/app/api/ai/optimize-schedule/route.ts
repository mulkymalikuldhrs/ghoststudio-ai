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
    const { workspaceId, tasks } = body

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 })
    }

    const workspace = await db.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: { include: { user: { select: { name: true } } } },
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

    const taskList = tasks || (await db.task.findMany({
      where: { workspaceId, status: { in: ['pending', 'approved'] } },
      orderBy: { priority: 'desc' },
    }))

    const memberContext = workspace.members.map((m) => ({
      alias: m.alias || m.user.name,
      energy: m.energyLevel,
      stress: m.stressLevel,
      authority: m.authorityLevel,
      constraints: m.constraints ? JSON.parse(m.constraints) : null,
    }))

    const optimizePrompt = `Optimize the following task schedule based on member energy, stress levels, and constraints.

Members:
${JSON.stringify(memberContext, null, 2)}

Tasks:
${JSON.stringify(taskList.map((t: { id?: string; title?: string; timeCost?: number; energyCost?: number; moneyCost?: number; priority?: string; assignedTo?: string | null; dependencies?: string | null; dueDate?: Date | null }) => ({
      id: t.id,
      title: t.title,
      timeCost: t.timeCost,
      energyCost: t.energyCost,
      moneyCost: t.moneyCost,
      priority: t.priority,
      assignedTo: t.assignedTo,
      dependencies: t.dependencies,
      dueDate: t.dueDate,
    })), null, 2)}

Provide an optimized schedule in this exact JSON format:
{
  "schedule": [
    {
      "taskId": "task_id",
      "assignedTo": "member_alias",
      "suggestedTime": "suggested time slot",
      "reasoning": "why this assignment"
    }
  ],
  "warnings": ["any potential issues"],
  "energyImpact": {"member_alias": "impact description"},
  "totalTimeEstimate": "estimated completion time"
}

Return ONLY the JSON, no other text.`

    const rawResponse = await aiChat([
      { role: 'system', content: SYSTEM_PROMPT + '\n\nYou are operating as the Planner Agent. Optimize schedules considering energy levels, stress, and constraints.' },
      { role: 'user', content: optimizePrompt },
    ])

    let optimizedSchedule
    try {
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/)
      optimizedSchedule = jsonMatch ? JSON.parse(jsonMatch[0]) : { schedule: [], warnings: ['Could not parse AI response'], energyImpact: {}, totalTimeEstimate: 'Unknown' }
    } catch {
      optimizedSchedule = { schedule: [], warnings: ['Could not parse AI response'], energyImpact: {}, totalTimeEstimate: 'Unknown' }
    }

    await db.agentLog.create({
      data: {
        workspaceId,
        agentType: 'planner',
        action: 'optimize_schedule',
        result: `Optimized ${taskList.length} tasks for ${workspace.members.length} members`,
        reasoning: 'AI-based schedule optimization considering energy, stress, and constraints',
        autonomousLevel: workspace.autonomousLevel,
      },
    })

    return NextResponse.json({
      schedule: optimizedSchedule,
      taskCount: taskList.length,
      memberCount: workspace.members.length,
    })
  } catch (error) {
    console.error('AI optimize schedule error:', error)
    return NextResponse.json({ error: 'Failed to optimize schedule' }, { status: 500 })
  }
}
