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
    const { category, limitAmount, period, priority, isActive } = body

    if (!category || limitAmount === undefined) {
      return NextResponse.json({ error: 'Category and limitAmount are required' }, { status: 400 })
    }

    const rule = await db.budgetRule.create({
      data: {
        workspaceId,
        category,
        limitAmount: parseFloat(limitAmount),
        period: period || 'monthly',
        priority: priority || 'medium',
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    return NextResponse.json({ rule }, { status: 201 })
  } catch (error) {
    if (error instanceof NextResponse) return error
    console.error('Create budget rule error:', error)
    return NextResponse.json({ error: 'Failed to create budget rule' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params
    await requireWorkspaceAccess(request, workspaceId)

    const rules = await db.budgetRule.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ rules })
  } catch (error) {
    if (error instanceof NextResponse) return error
    console.error('List budget rules error:', error)
    return NextResponse.json({ error: 'Failed to list budget rules' }, { status: 500 })
  }
}
