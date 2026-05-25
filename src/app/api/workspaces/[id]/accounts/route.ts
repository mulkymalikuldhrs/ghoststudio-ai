import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params
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
        balance: balance || 0,
        currency: currency || 'USD',
        isEmergency: isEmergency || false,
      },
    })

    return NextResponse.json({ account }, { status: 201 })
  } catch (error) {
    console.error('Create account error:', error)
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params

    const accounts = await db.financeAccount.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ accounts })
  } catch (error) {
    console.error('List accounts error:', error)
    return NextResponse.json({ error: 'Failed to list accounts' }, { status: 500 })
  }
}
