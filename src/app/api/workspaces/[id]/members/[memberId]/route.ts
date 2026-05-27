import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: workspaceId, memberId } = await params
    const body = await request.json()
    const { energyLevel, stressLevel, alias, authorityLevel, constraints, preferences, visibilityScope, role } = body

    // Verify workspace access
    const membership = await db.workspaceMember.findFirst({
      where: { workspaceId, userId: session.user.id, role: { in: ['owner', 'admin'] } },
    })
    if (!membership) {
      return NextResponse.json({ error: 'Forbidden: insufficient permissions' }, { status: 403 })
    }

    const member = await db.workspaceMember.findFirst({
      where: { id: memberId, workspaceId },
    })
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    const updated = await db.workspaceMember.update({
      where: { id: memberId },
      data: {
        ...(energyLevel !== undefined && { energyLevel }),
        ...(stressLevel !== undefined && { stressLevel }),
        ...(alias !== undefined && { alias }),
        ...(authorityLevel !== undefined && { authorityLevel }),
        ...(constraints !== undefined && { constraints: JSON.stringify(constraints) }),
        ...(preferences !== undefined && { preferences: JSON.stringify(preferences) }),
        ...(visibilityScope !== undefined && { visibilityScope: JSON.stringify(visibilityScope) }),
        ...(role !== undefined && { role }),
      },
    })

    return NextResponse.json({ member: updated })
  } catch (error) {
    console.error('Update member error:', error)
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: workspaceId, memberId } = await params

    // Verify workspace ownership
    const membership = await db.workspaceMember.findFirst({
      where: { workspaceId, userId: session.user.id, role: 'owner' },
    })
    if (!membership) {
      return NextResponse.json({ error: 'Forbidden: only workspace owner can remove members' }, { status: 403 })
    }

    const member = await db.workspaceMember.findFirst({
      where: { id: memberId, workspaceId },
    })
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Cannot remove the owner
    if (member.role === 'owner') {
      return NextResponse.json({ error: 'Cannot remove workspace owner' }, { status: 400 })
    }

    await db.workspaceMember.delete({ where: { id: memberId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete member error:', error)
    return NextResponse.json({ error: 'Failed to delete member' }, { status: 500 })
  }
}
