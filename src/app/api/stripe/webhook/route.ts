import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import Stripe from "stripe";

const stripeKey = process.env.STRIPE_SECRET_KEY || "";

// Lazy init to avoid build-time crash when STRIPE_SECRET_KEY is empty
let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not configured");
    _stripe = new Stripe(stripeKey);
  }
  return _stripe;
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

// POST /api/stripe/webhook - Handle Stripe webhook events
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;

        if (userId && plan) {
          // Update user plan
          await db.user.update({
            where: { id: userId },
            data: { plan },
          });

          // Create or update subscription
          if (session.subscription) {
            const subscription = await stripe.subscriptions.retrieve(
              session.subscription as string
            );

            const existingSub = await db.subscription.findFirst({
              where: { stripeSubscriptionId: subscription.id },
            });

            if (existingSub) {
              await db.subscription.update({
                where: { id: existingSub.id },
                data: {
                  plan,
                  status: subscription.status === "active" ? "active" : "cancelled",
                  stripePriceId: subscription.items.data[0]?.price.id,
                },
              });
            } else {
              await db.subscription.create({
                data: {
                  userId,
                  plan,
                  status: subscription.status === "active" ? "active" : "cancelled",
                  stripeSubscriptionId: subscription.id,
                  stripePriceId: subscription.items.data[0]?.price.id,
                },
              });
            }
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await db.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: subscription.status === "active" ? "active" : "cancelled",
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const sub = await db.subscription.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });
        if (sub) {
          await db.subscription.update({
            where: { id: sub.id },
            data: { status: "cancelled" },
          });
          // Downgrade user plan
          await db.user.update({
            where: { id: sub.userId },
            data: { plan: "free" },
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subscriptionId = (invoice as any).subscription as string | null | undefined;
        if (subscriptionId) {
          await db.subscription.updateMany({
            where: { stripeSubscriptionId: subscriptionId },
            data: { status: "past_due" },
          });
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
