import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
        ownerId: session.user.id,
        type: type || 'personal',
        trialStart,
        trialEnd,
        members: {
          create: {
            userId: session.user.id,
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

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const memberships = await db.workspaceMember.findMany({
      where: { userId: session.user.id },
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
