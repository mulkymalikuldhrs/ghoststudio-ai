import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params
    const body = await request.json()
    const { accountId, amount, category, type, description, date, isRecurring } = body

    if (amount === undefined || amount === null) {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 })
    }

    const transaction = await db.transaction.create({
      data: {
        workspaceId,
        accountId: accountId || null,
        amount: parseFloat(amount),
        category: category || 'other',
        type: type || 'expense',
        description: description || null,
        date: date ? new Date(date) : new Date(),
        isRecurring: isRecurring || false,
      },
    })

    if (accountId) {
      const increment = type === 'income' ? parseFloat(amount) : -parseFloat(amount)
      await db.financeAccount.update({
        where: { id: accountId },
        data: { balance: { increment } },
      })
    }

    return NextResponse.json({ transaction }, { status: 201 })
  } catch (error) {
    console.error('Create transaction error:', error)
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params
    const startDate = request.nextUrl.searchParams.get('startDate')
    const endDate = request.nextUrl.searchParams.get('endDate')
    const category = request.nextUrl.searchParams.get('category')
    const type = request.nextUrl.searchParams.get('type')

    const where: Record<string, unknown> = { workspaceId }
    if (startDate || endDate) {
      where.date = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      }
    }
    if (category) where.category = category
    if (type) where.type = type

    const transactions = await db.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 100,
    })

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error('List transactions error:', error)
    return NextResponse.json({ error: 'Failed to list transactions' }, { status: 500 })
  }
}
