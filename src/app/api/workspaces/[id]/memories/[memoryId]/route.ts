import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; memoryId: string }> }
) {
  try {
    const { id: workspaceId, memoryId } = await params

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
