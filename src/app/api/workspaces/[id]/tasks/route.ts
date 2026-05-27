import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: workspaceId } = await params

    const membership = await db.workspaceMember.findFirst({
      where: { workspaceId, userId: session.user.id, role: { in: ['owner', 'admin'] } },
    })
    if (!membership) {
      return NextResponse.json({ error: 'Forbidden: not a workspace member' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, timeCost, energyCost, moneyCost, priority, assignedTo, dependencies, dueDate } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const task = await db.task.create({
      data: {
        workspaceId,
        title,
        description: description || null,
        timeCost: timeCost || 0,
        energyCost: energyCost || 0,
        moneyCost: moneyCost || 0,
        priority: priority || 'medium',
        assignedTo: assignedTo || null,
        dependencies: dependencies ? (typeof dependencies === 'object' ? JSON.stringify(dependencies) : dependencies) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    })

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error('Create task error:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: workspaceId } = await params

    const membership = await db.workspaceMember.findFirst({
      where: { workspaceId, userId: session.user.id },
    })
    if (!membership) {
      return NextResponse.json({ error: 'Forbidden: not a workspace member' }, { status: 403 })
    }

    const status = request.nextUrl.searchParams.get('status')
    const priority = request.nextUrl.searchParams.get('priority')
    const assignedTo = request.nextUrl.searchParams.get('assignedTo')

    const where: Record<string, unknown> = { workspaceId }
    if (status) where.status = status
    if (priority) where.priority = priority
    if (assignedTo) where.assignedTo = assignedTo

    const tasks = await db.task.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('List tasks error:', error)
    return NextResponse.json({ error: 'Failed to list tasks' }, { status: 500 })
  }
}
