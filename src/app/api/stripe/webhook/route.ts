import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/stripe/webhook - Handle Stripe webhook events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    switch (type) {
      case "checkout.session.completed": {
        const userId = data?.metadata?.userId;
        const planId = data?.metadata?.planId;

        if (userId && planId) {
          // Update user plan
          await db.user.update({
            where: { id: userId },
            data: { plan: planId },
          });

          // Create or update subscription
          await db.subscription.upsert({
            where: { id: data?.subscription ?? "sub_default" },
            create: {
              userId,
              plan: planId,
              status: "active",
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
              ),
            },
            update: {
              plan: planId,
              status: "active",
            },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subId = data?.id;
        if (subId) {
          await db.subscription.update({
            where: { id: subId },
            data: {
              status: data?.status ?? "active",
              plan: data?.plan?.id ?? "free",
            },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const deletedSubId = data?.id;
        if (deletedSubId) {
          await db.subscription.update({
            where: { id: deletedSubId },
            data: { status: "cancelled" },
          });
        }
        break;
      }

      default:
        console.log(`Unhandled webhook event: ${type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
