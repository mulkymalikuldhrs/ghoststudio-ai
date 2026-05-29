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
    const { userId, alias, authorityLevel, role } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const ws = await db.workspace.findUnique({ where: { id: workspaceId } })
    if (!ws) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const existing = await db.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    })
    if (existing) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 409 })
    }

    const member = await db.workspaceMember.create({
      data: {
        workspaceId,
        userId,
        alias: alias || null,
        authorityLevel: authorityLevel || 1,
        role: role || 'member',
      },
      include: {
        user: {
          select: { id: true, email: true, name: true, avatar: true },
        },
      },
    })

    return NextResponse.json({ member }, { status: 201 })
  } catch (error) {
    if (error instanceof NextResponse) return error
    console.error('Add member error:', error)
    return NextResponse.json({ error: 'Failed to add member' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params
    await requireWorkspaceAccess(request, workspaceId)

    const members = await db.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: { id: true, email: true, name: true, avatar: true },
        },
      },
      orderBy: { authorityLevel: 'desc' },
    })

    return NextResponse.json({ members })
  } catch (error) {
    if (error instanceof NextResponse) return error
    console.error('List members error:', error)
    return NextResponse.json({ error: 'Failed to list members' }, { status: 500 })
  }
}
