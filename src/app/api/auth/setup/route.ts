import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { db } from '@/lib/db'

// POST /api/auth/setup - Initialize user workspace after first login
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)

    const body = await request.json()
    const { name } = body

    const user = await db.user.findUnique({
      where: { id: auth.userId },
      include: {
        workspaces: true,
        workspaceMembers: {
          include: {
            workspace: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update name if provided
    if (name && !user.name) {
      await db.user.update({
        where: { id: user.id },
        data: { name },
      })
    }

    // Get all workspaces the user is a member of
    const workspaces = user.workspaceMembers.map((wm) => wm.workspace)

    // If user has no workspace, create a default one
    if (workspaces.length === 0) {
      const slug = `${(name || user.email || 'my').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`
      const trialStart = new Date()
      const trialEnd = new Date()
      trialEnd.setDate(trialEnd.getDate() + 7)

      const workspace = await db.workspace.create({
        data: {
          name: name ? `${name}'s Workspace` : 'My Workspace',
          slug,
          ownerId: user.id,
          type: 'personal',
          trialStart,
          trialEnd,
          members: {
            create: {
              userId: user.id,
              role: 'owner',
              authorityLevel: 5,
            },
          },
        },
      })

      workspaces.push(workspace)
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: name || user.name,
        role: user.role,
        plan: user.plan,
        automationMode: user.automationMode,
      },
      workspaces,
    })
  } catch (error) {
    if (error instanceof NextResponse) return error
    console.error('Auth setup error:', error)
    return NextResponse.json({ error: 'Failed to setup auth' }, { status: 500 })
  }
}
