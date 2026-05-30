import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceAccess } from '@/lib/auth-guard'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params
    const { auth, workspace, membership } = await requireWorkspaceAccess(request, workspaceId)

    // Check admin/owner role
    const isAdmin = workspace.ownerId === auth.userId || (membership?.role && ['owner', 'admin'].includes(membership.role))
    if (!isAdmin) {
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
        moneyCost: new Prisma.Decimal(moneyCost || 0),
        priority: priority || 'medium',
        assignedTo: assignedTo || null,
        dependencies: dependencies ? (typeof dependencies === 'object' ? JSON.stringify(dependencies) : dependencies) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    })

    return NextResponse.json({ task: { ...task, moneyCost: task.moneyCost.toString() } }, { status: 201 })
  } catch (error) {
    if (error instanceof NextResponse) return error
    console.error('Create task error:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params
    await requireWorkspaceAccess(request, workspaceId)

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
    if (error instanceof NextResponse) return error
    console.error('List tasks error:', error)
    return NextResponse.json({ error: 'Failed to list tasks' }, { status: 500 })
  }
}
