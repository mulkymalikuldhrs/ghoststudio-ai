import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email query parameter is required' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { email },
      include: {
        workspaces: {
          include: {
            workspace: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      user,
      workspaces: user.workspaces.map((wm) => ({
        ...wm.workspace,
        role: wm.role,
        alias: wm.alias,
      })),
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json({ error: 'Failed to get user' }, { status: 500 })
  }
}
