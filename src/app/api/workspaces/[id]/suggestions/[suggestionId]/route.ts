import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; suggestionId: string }> }
) {
  try {
    const { id: workspaceId, suggestionId } = await params
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    const validStatuses = ['pending', 'accepted', 'simulated', 'ignored']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Valid: ${validStatuses.join(', ')}` }, { status: 400 })
    }

    const suggestion = await db.suggestion.findFirst({
      where: { id: suggestionId, workspaceId },
    })

    if (!suggestion) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 })
    }

    const updated = await db.suggestion.update({
      where: { id: suggestionId },
      data: { status },
    })

    if (status === 'accepted' || status === 'simulated') {
      await db.memory.create({
        data: {
          workspaceId,
          layer: 'decision',
          category: 'suggestion_response',
          content: `Suggestion "${suggestion.title}" was ${status}. Reason: ${suggestion.reason}`,
          importance: 6,
        },
      })
    }

    return NextResponse.json({ suggestion: updated })
  } catch (error) {
    console.error('Update suggestion error:', error)
    return NextResponse.json({ error: 'Failed to update suggestion' }, { status: 500 })
  }
}
