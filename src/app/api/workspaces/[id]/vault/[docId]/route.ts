import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: workspaceId, docId } = await params

    const membership = await db.workspaceMember.findFirst({
      where: { workspaceId, userId: session.user.id, role: { in: ['owner', 'admin'] } },
    })
    if (!membership) {
      return NextResponse.json({ error: 'Forbidden: not a workspace member' }, { status: 403 })
    }

    const body = await request.json()
    const { title, type, content, priority, scope, visibility, tags, metadata } = body

    const doc = await db.vaultDocument.findFirst({
      where: { id: docId, workspaceId },
    })

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const updated = await db.vaultDocument.update({
      where: { id: docId },
      data: {
        ...(title !== undefined && { title }),
        ...(type !== undefined && { type }),
        ...(content !== undefined && { content }),
        ...(priority !== undefined && { priority }),
        ...(scope !== undefined && { scope }),
        ...(visibility !== undefined && {
          visibility: typeof visibility === 'object' ? JSON.stringify(visibility) : visibility,
        }),
        ...(tags !== undefined && {
          tags: typeof tags === 'object' ? JSON.stringify(tags) : tags,
        }),
        ...(metadata !== undefined && {
          metadata: typeof metadata === 'object' ? JSON.stringify(metadata) : metadata,
        }),
      },
    })

    return NextResponse.json({ document: updated })
  } catch (error) {
    console.error('Update vault document error:', error)
    return NextResponse.json({ error: 'Failed to update vault document' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: workspaceId, docId } = await params

    const membership = await db.workspaceMember.findFirst({
      where: { workspaceId, userId: session.user.id, role: { in: ['owner', 'admin'] } },
    })
    if (!membership) {
      return NextResponse.json({ error: 'Forbidden: not a workspace member' }, { status: 403 })
    }

    const doc = await db.vaultDocument.findFirst({
      where: { id: docId, workspaceId },
    })

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    await db.vaultDocument.delete({ where: { id: docId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete vault document error:', error)
    return NextResponse.json({ error: 'Failed to delete vault document' }, { status: 500 })
  }
}
