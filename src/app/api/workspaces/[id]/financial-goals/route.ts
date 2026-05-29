import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceAccess } from '@/lib/auth-guard'
import { db } from '@/lib/db'

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
    const { name, targetAmount, currentAmount, deadline, priority } = body

    if (!name || targetAmount === undefined) {
      return NextResponse.json({ error: 'Name and targetAmount are required' }, { status: 400 })
    }

    const goal = await db.financialGoal.create({
      data: {
        workspaceId,
        name,
        targetAmount: parseFloat(targetAmount),
        currentAmount: currentAmount ? parseFloat(currentAmount) : 0,
        deadline: deadline ? new Date(deadline) : null,
        priority: priority || 'medium',
      },
    })

    return NextResponse.json({ goal }, { status: 201 })
  } catch (error) {
    if (error instanceof NextResponse) return error
    console.error('Create financial goal error:', error)
    return NextResponse.json({ error: 'Failed to create financial goal' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params
    await requireWorkspaceAccess(request, workspaceId)

    const goals = await db.financialGoal.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ goals })
  } catch (error) {
    if (error instanceof NextResponse) return error
    console.error('List financial goals error:', error)
    return NextResponse.json({ error: 'Failed to list financial goals' }, { status: 500 })
  }
}
