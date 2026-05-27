import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; memoryId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: workspaceId, memoryId } = await params

    // Verify workspace access
    const membership = await db.workspaceMember.findFirst({
      where: { workspaceId, userId: session.user.id },
    })
    if (!membership) {
      return NextResponse.json({ error: 'Forbidden: not a workspace member' }, { status: 403 })
    }

    const memory = await db.memory.findFirst({
      where: { id: memoryId, workspaceId },
    })
    if (!memory) {
      return NextResponse.json({ error: 'Memory not found' }, { status: 404 })
    }

    await db.memory.delete({ where: { id: memoryId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete memory error:', error)
    return NextResponse.json({ error: 'Failed to delete memory' }, { status: 500 })
  }
}
