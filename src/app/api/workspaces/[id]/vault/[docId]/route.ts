import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceAccess } from '@/lib/auth-guard'
import { db } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { id: workspaceId, docId } = await params
    const { auth, workspace, membership } = await requireWorkspaceAccess(request, workspaceId)

    // Check admin/owner role
    const isAdmin = workspace.ownerId === auth.userId || (membership?.role && ['owner', 'admin'].includes(membership.role))
    if (!isAdmin) {
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
    if (error instanceof NextResponse) return error
    console.error('Update vault document error:', error)
    return NextResponse.json({ error: 'Failed to update vault document' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { id: workspaceId, docId } = await params
    const { auth, workspace, membership } = await requireWorkspaceAccess(request, workspaceId)

    // Check admin/owner role
    const isAdmin = workspace.ownerId === auth.userId || (membership?.role && ['owner', 'admin'].includes(membership.role))
    if (!isAdmin) {
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
    if (error instanceof NextResponse) return error
    console.error('Delete vault document error:', error)
    return NextResponse.json({ error: 'Failed to delete vault document' }, { status: 500 })
  }
}
