import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceAccess } from '@/lib/auth-guard'
import { db } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { id: workspaceId, taskId } = await params
    const { auth, workspace, membership } = await requireWorkspaceAccess(request, workspaceId)

    // Check admin/owner role
    const isAdmin = workspace.ownerId === auth.userId || (membership?.role && ['owner', 'admin'].includes(membership.role))
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: not a workspace member' }, { status: 403 })
    }

    const body = await request.json()
    const { status, title, description, timeCost, energyCost, moneyCost, priority, assignedTo, dependencies, dueDate, aiRejected, aiRejectionReason } = body

    const task = await db.task.findFirst({
      where: { id: taskId, workspaceId },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const updated = await db.task.update({
      where: { id: taskId },
      data: {
        ...(status !== undefined && {
          status,
          ...(status === 'done' && { completedAt: new Date() }),
        }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(timeCost !== undefined && { timeCost }),
        ...(energyCost !== undefined && { energyCost }),
        ...(moneyCost !== undefined && { moneyCost }),
        ...(priority !== undefined && { priority }),
        ...(assignedTo !== undefined && { assignedTo }),
        ...(dependencies !== undefined && {
          dependencies: typeof dependencies === 'object' ? JSON.stringify(dependencies) : dependencies,
        }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(aiRejected !== undefined && { aiRejected }),
        ...(aiRejectionReason !== undefined && { aiRejectionReason }),
      },
    })

    return NextResponse.json({ task: updated })
  } catch (error) {
    if (error instanceof NextResponse) return error
    console.error('Update task error:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { id: workspaceId, taskId } = await params
    const { auth, workspace, membership } = await requireWorkspaceAccess(request, workspaceId)

    // Check admin/owner role
    const isAdmin = workspace.ownerId === auth.userId || (membership?.role && ['owner', 'admin'].includes(membership.role))
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: not a workspace member' }, { status: 403 })
    }

    const task = await db.task.findFirst({
      where: { id: taskId, workspaceId },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    await db.task.delete({ where: { id: taskId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof NextResponse) return error
    console.error('Delete task error:', error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
