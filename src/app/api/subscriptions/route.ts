import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/subscriptions - List user's subscriptions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const subscriptions = await db.subscription.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ subscriptions })
  } catch (error) {
    console.error('List subscriptions error:', error)
    return NextResponse.json({ error: 'Failed to list subscriptions' }, { status: 500 })
  }
}

// POST /api/subscriptions - Create or update subscription
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { plan } = body

    const validPlans = ['free', 'creator', 'pro', 'agency']
    if (!plan || !validPlans.includes(plan)) {
      return NextResponse.json(
        { error: `Invalid plan. Valid: ${validPlans.join(', ')}` },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check for existing active subscription
    const existing = await db.subscription.findFirst({
      where: { userId: user.id, status: 'active' },
    })

    const startDate = new Date()
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 1)

    if (existing) {
      const updated = await db.subscription.update({
        where: { id: existing.id },
        data: {
          plan,
          status: 'active',
          currentPeriodStart: startDate,
          currentPeriodEnd: endDate,
          cancelAtPeriodEnd: false,
        },
      })

      // Also update user plan
      await db.user.update({
        where: { id: user.id },
        data: { plan },
      })

      return NextResponse.json({ subscription: updated })
    }

    const subscription = await db.subscription.create({
      data: {
        userId: user.id,
        plan,
        status: 'active',
        currentPeriodStart: startDate,
        currentPeriodEnd: endDate,
      },
    })

    // Also update user plan
    await db.user.update({
      where: { id: user.id },
      data: { plan },
    })

    return NextResponse.json({ subscription }, { status: 201 })
  } catch (error) {
    console.error('Create subscription error:', error)
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
  }
}
