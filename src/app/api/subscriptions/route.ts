import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const TIER_PRICES: Record<string, Record<string, number>> = {
  free: { monthly: 0, yearly: 0 },
  professional: { monthly: 19, yearly: 190 },
  business: { monthly: 49, yearly: 490 },
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId query parameter is required' }, { status: 400 })
    }

    const subscriptions = await db.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ subscriptions })
  } catch (error) {
    console.error('List subscriptions error:', error)
    return NextResponse.json({ error: 'Failed to list subscriptions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, tier, period } = body

    if (!userId || !tier) {
      return NextResponse.json({ error: 'userId and tier are required' }, { status: 400 })
    }

    const validTiers = ['free', 'professional', 'business']
    if (!validTiers.includes(tier)) {
      return NextResponse.json({ error: `Invalid tier. Valid: ${validTiers.join(', ')}` }, { status: 400 })
    }

    const subPeriod = period || 'monthly'
    const price = TIER_PRICES[tier]?.[subPeriod] || 0

    const startDate = new Date()
    const endDate = new Date()
    if (subPeriod === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1)
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1)
    }

    const existing = await db.subscription.findFirst({
      where: { userId, status: 'active' },
    })

    if (existing) {
      const updated = await db.subscription.update({
        where: { id: existing.id },
        data: {
          tier,
          period: subPeriod,
          price,
          startDate,
          endDate,
          status: 'active',
        },
      })
      return NextResponse.json({ subscription: updated })
    }

    const subscription = await db.subscription.create({
      data: {
        userId,
        tier,
        period: subPeriod,
        price,
        startDate,
        endDate,
        status: 'active',
      },
    })

    return NextResponse.json({ subscription }, { status: 201 })
  } catch (error) {
    console.error('Create subscription error:', error)
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
  }
}
