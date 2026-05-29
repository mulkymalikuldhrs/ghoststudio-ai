import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceAccess } from '@/lib/auth-guard'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params
    await requireWorkspaceAccess(request, workspaceId)

    const agentType = request.nextUrl.searchParams.get('agentType')

    const where: Record<string, unknown> = { workspaceId }
    if (agentType) where.agentType = agentType

    const logs = await db.agentLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ logs })
  } catch (error) {
    if (error instanceof NextResponse) return error
    console.error('List agent logs error:', error)
    return NextResponse.json({ error: 'Failed to list agent logs' }, { status: 500 })
  }
}
