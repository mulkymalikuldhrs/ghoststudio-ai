import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/stripe";

// POST /api/stripe/webhook - Handle Stripe webhook events
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature") ?? "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let event: any;

    if (process.env.STRIPE_WEBHOOK_SECRET) {
      const verifiedEvent = verifyWebhookSignature(body, signature);
      if (!verifiedEvent) {
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 400 }
        );
      }
      event = verifiedEvent;
    } else {
      try {
        event = JSON.parse(body);
      } catch {
        return NextResponse.json(
          { error: "Invalid payload" },
          { status: 400 }
        );
      }
    }

    const { type } = event;

    switch (type) {
      case "checkout.session.completed": {
        const metadata = event.data?.object?.metadata;
        const userId = metadata?.userId;
        const planId = metadata?.planId;

        if (userId && planId) {
          await db.user.update({
            where: { id: userId },
            data: {
              plan: planId,
              stripeCustomerId: event.data.object.customer ?? null,
            },
          });

          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + 1);

          // Find existing subscription or create one
          const existingSub = await db.subscription.findFirst({
            where: { userId, status: "active" },
          });

          if (existingSub) {
            await db.subscription.update({
              where: { id: existingSub.id },
              data: {
                plan: planId,
                status: "active",
                stripeSubscriptionId: event.data.object.subscription ?? null,
                currentPeriodStart: new Date(),
                currentPeriodEnd: endDate,
              },
            });
          } else {
            await db.subscription.create({
              data: {
                userId,
                plan: planId,
                status: "active",
                stripeSubscriptionId: event.data.object.subscription ?? null,
                currentPeriodStart: new Date(),
                currentPeriodEnd: endDate,
              },
            });
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subId = event.data?.object?.id as string | undefined;
        if (subId) {
          const sub = await db.subscription.findFirst({
            where: { stripeSubscriptionId: subId },
          });
          if (sub) {
            await db.subscription.update({
              where: { id: sub.id },
              data: {
                status: event.data?.object?.status ?? "active",
                currentPeriodEnd: event.data?.object?.current_period_end
                  ? new Date(event.data.object.current_period_end * 1000)
                  : undefined,
              },
            });
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const deletedSubId = event.data?.object?.id as string | undefined;
        if (deletedSubId) {
          const sub = await db.subscription.findFirst({
            where: { stripeSubscriptionId: deletedSubId },
          });
          if (sub) {
            await db.subscription.update({
              where: { id: sub.id },
              data: { status: "cancelled", cancelAtPeriodEnd: true },
            });
          }
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
