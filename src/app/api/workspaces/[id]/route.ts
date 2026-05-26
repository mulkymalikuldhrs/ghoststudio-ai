import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const workspace = await db.workspace.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, name: true, avatar: true },
            },
          },
        },
        _count: {
          select: {
            tasks: true,
            accounts: true,
            transactions: true,
            vaultDocuments: true,
            memories: true,
            suggestions: true,
          },
        },
      },
    })

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    return NextResponse.json({ workspace })
  } catch (error) {
    console.error('Get workspace error:', error)
    return NextResponse.json({ error: 'Failed to get workspace' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, type, autonomousLevel } = body

    const existing = await db.workspace.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const workspace = await db.workspace.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(autonomousLevel !== undefined && { autonomousLevel }),
      },
    })

    return NextResponse.json({ workspace })
  } catch (error) {
    console.error('Update workspace error:', error)
    return NextResponse.json({ error: 'Failed to update workspace' }, { status: 500 })
  }
}
