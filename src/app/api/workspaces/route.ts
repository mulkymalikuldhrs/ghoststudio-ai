import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)

    const body = await request.json()
    const { name, type } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const trialStart = new Date()
    const trialEnd = new Date()
    trialEnd.setDate(trialEnd.getDate() + 7)

    const workspace = await db.workspace.create({
      data: {
        name,
        slug: `${slug}-${Date.now().toString(36)}`,
        ownerId: auth.userId,
        type: type || 'personal',
        trialStart,
        trialEnd,
        members: {
          create: {
            userId: auth.userId,
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
    if (error instanceof NextResponse) return error
    console.error('Create workspace error:', error)
    return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)

    const memberships = await db.workspaceMember.findMany({
      where: { userId: auth.userId },
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
    if (error instanceof NextResponse) return error
    console.error('List workspaces error:', error)
    return NextResponse.json({ error: 'Failed to list workspaces' }, { status: 500 })
  }
}
