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
    const { userId, alias, authorityLevel, role } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const workspace = await db.workspace.findUnique({ where: { id: workspaceId } })
    if (!workspace) {
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
    console.error('Add member error:', error)
    return NextResponse.json({ error: 'Failed to add member' }, { status: 500 })
  }
}

export async function GET(
  _request: NextRequest,
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
    console.error('List members error:', error)
    return NextResponse.json({ error: 'Failed to list members' }, { status: 500 })
  }
}
