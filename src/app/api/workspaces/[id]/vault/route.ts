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
    const { title, type, content, priority, scope, visibility, tags, metadata } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const doc = await db.vaultDocument.create({
      data: {
        workspaceId,
        title,
        type: type || 'note',
        content: content || null,
        priority: priority || 'medium',
        scope: scope || 'workspace',
        visibility: visibility ? (typeof visibility === 'object' ? JSON.stringify(visibility) : visibility) : null,
        tags: tags ? (typeof tags === 'object' ? JSON.stringify(tags) : tags) : null,
        metadata: metadata ? (typeof metadata === 'object' ? JSON.stringify(metadata) : metadata) : null,
      },
    })

    return NextResponse.json({ document: doc }, { status: 201 })
  } catch (error) {
    if (error instanceof NextResponse) return error
    console.error('Create vault document error:', error)
    return NextResponse.json({ error: 'Failed to create vault document' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params
    await requireWorkspaceAccess(request, workspaceId)

    const type = request.nextUrl.searchParams.get('type')
    const scope = request.nextUrl.searchParams.get('scope')

    const where: Record<string, unknown> = { workspaceId }
    if (type) where.type = type
    if (scope) where.scope = scope

    const documents = await db.vaultDocument.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ documents })
  } catch (error) {
    if (error instanceof NextResponse) return error
    console.error('List vault documents error:', error)
    return NextResponse.json({ error: 'Failed to list vault documents' }, { status: 500 })
  }
}
