import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const existingUser = await db.user.findUnique({
      where: { email },
      include: {
        workspaces: {
          include: {
            workspace: true,
          },
        },
      },
    })

    if (existingUser) {
      return NextResponse.json({
        user: existingUser,
        workspaces: existingUser.workspaces.map((wm) => wm.workspace),
      })
    }

    const user = await db.user.create({
      data: {
        email,
        name: name || null,
      },
      include: {
        workspaces: {
          include: {
            workspace: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        user,
        workspaces: [],
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Auth setup error:', error)
    return NextResponse.json({ error: 'Failed to setup auth' }, { status: 500 })
  }
}
