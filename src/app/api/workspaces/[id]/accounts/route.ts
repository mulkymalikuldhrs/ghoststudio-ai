import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceAccess } from '@/lib/auth-guard'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params
    const { auth, workspace, membership } = await requireWorkspaceAccess(request, workspaceId)

    // Check admin/owner role
    const isAdmin = workspace.ownerId === auth.userId || (membership?.role && ['owner', 'admin'].includes(membership.role))
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: not a workspace member' }, { status: 403 })
    }

    const body = await request.json()
    const { name, type, balance, currency, isEmergency } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const account = await db.financeAccount.create({
      data: {
        workspaceId,
        name,
        type: type || 'checking',
        balance: new Prisma.Decimal(balance || 0),
        currency: currency || 'USD',
        isEmergency: isEmergency || false,
      },
    })

    return NextResponse.json({ account: { ...account, balance: account.balance.toString() } }, { status: 201 })
  } catch (error) {
    if (error instanceof NextResponse) return error
    console.error('Create account error:', error)
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params
    await requireWorkspaceAccess(request, workspaceId)

    const accounts = await db.financeAccount.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ accounts })
  } catch (error) {
    if (error instanceof NextResponse) return error
    console.error('List accounts error:', error)
    return NextResponse.json({ error: 'Failed to list accounts' }, { status: 500 })
  }
}
