import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, userId } = body

    if (!name || !userId) {
      return NextResponse.json({ error: 'Name and userId are required' }, { status: 400 })
    }

    const trialStart = new Date()
    const trialEnd = new Date()
    trialEnd.setDate(trialEnd.getDate() + 7)

    const workspace = await db.workspace.create({
      data: {
        name,
        type: type || 'personal',
        trialStart,
        trialEnd,
        members: {
          create: {
            userId,
            role: 'owner',
            authorityLevel: 5,
          },
        },
      },
      include: {
        members: true,
      },
    })

    return NextResponse.json({ workspace }, { status: 201 })
  } catch (error) {
    console.error('Create workspace error:', error)
    return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId query parameter is required' }, { status: 400 })
    }

    const memberships = await db.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          include: {
            members: true,
            _count: {
              select: {
                tasks: true,
                accounts: true,
                vaultDocuments: true,
              },
            },
          },
        },
      },
    })

    const workspaces = memberships.map((m) => ({
      ...m.workspace,
      userRole: m.role,
      userAlias: m.alias,
    }))

    return NextResponse.json({ workspaces })
  } catch (error) {
    console.error('List workspaces error:', error)
    return NextResponse.json({ error: 'Failed to list workspaces' }, { status: 500 })
  }
}
