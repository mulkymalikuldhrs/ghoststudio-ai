import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceAccess } from '@/lib/auth-guard'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { auth, workspace: _ws } = await requireWorkspaceAccess(request, id)

    const workspace = await db.workspace.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, name: true, avatar: true },
            },
          },
        },
        _count: {
          select: {
            tasks: true,
            accounts: true,
            transactions: true,
            vaultDocuments: true,
            memories: true,
            suggestions: true,
          },
        },
      },
    })

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    return NextResponse.json({ workspace })
  } catch (error) {
    if (error instanceof NextResponse) return error
    console.error('Get workspace error:', error)
    return NextResponse.json({ error: 'Failed to get workspace' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { auth, workspace, membership } = await requireWorkspaceAccess(request, id)

    // Check admin/owner role
    const isAdmin = workspace.ownerId === auth.userId || (membership?.role && ['owner', 'admin'].includes(membership.role))
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: not a workspace member' }, { status: 403 })
    }

    const body = await request.json()
    const { name, type, autonomousLevel } = body

    const existing = await db.workspace.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const updated = await db.workspace.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(autonomousLevel !== undefined && { autonomousLevel }),
      },
    })

    return NextResponse.json({ workspace: updated })
  } catch (error) {
    if (error instanceof NextResponse) return error
    console.error('Update workspace error:', error)
    return NextResponse.json({ error: 'Failed to update workspace' }, { status: 500 })
  }
}
