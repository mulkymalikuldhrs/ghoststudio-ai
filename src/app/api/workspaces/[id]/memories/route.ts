import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params
    const body = await request.json()
    const { layer, category, content, importance, expiresAt } = body

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const memory = await db.memory.create({
      data: {
        workspaceId,
        layer: layer || 'short_term',
        category: category || null,
        content,
        importance: importance || 5,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })

    return NextResponse.json({ memory }, { status: 201 })
  } catch (error) {
    console.error('Create memory error:', error)
    return NextResponse.json({ error: 'Failed to create memory' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params
    const layer = request.nextUrl.searchParams.get('layer')

    const where: Record<string, unknown> = { workspaceId }
    if (layer) where.layer = layer

    const memories = await db.memory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    return NextResponse.json({ memories })
  } catch (error) {
    console.error('List memories error:', error)
    return NextResponse.json({ error: 'Failed to list memories' }, { status: 500 })
  }
}
