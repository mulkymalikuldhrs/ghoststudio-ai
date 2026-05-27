import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
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
      where: { workspaceId, userId: session.user.id },
    })
    if (!membership) {
      return NextResponse.json({ error: 'Forbidden: not a workspace member' }, { status: 403 })
    }

    const status = request.nextUrl.searchParams.get('status')
    const type = request.nextUrl.searchParams.get('type')

    const where: Record<string, unknown> = { workspaceId }
    if (status) where.status = status
    if (type) where.type = type

    const suggestions = await db.suggestion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('List suggestions error:', error)
    return NextResponse.json({ error: 'Failed to list suggestions' }, { status: 500 })
  }
}
