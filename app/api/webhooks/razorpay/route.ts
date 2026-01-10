import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions, subscriptionPlans } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyRazorpayWebhook } from "@/lib/razorpay";

interface RazorpayPayment {
  id: string;
  customer_id?: string;
}

interface RazorpaySubscription {
  id: string;
  current_start: number;
  current_end: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const isValid = verifyRazorpayWebhook(body, signature);
    if (!isValid) {
      console.error("Invalid Razorpay webhook signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const event = JSON.parse(body);
    console.log("Razorpay webhook event:", event.event);

    switch (event.event) {
      case "payment.captured":
        await handlePaymentCaptured(event.payload.payment.entity);
        break;

      case "payment.failed":
        await handlePaymentFailed(event.payload.payment.entity);
        break;

      case "subscription.activated":
        await handleSubscriptionActivated(event.payload.subscription.entity);
        break;

      case "subscription.cancelled":
        await handleSubscriptionCancelled(event.payload.subscription.entity);
        break;

      case "subscription.charged":
        await handleSubscriptionCharged(event.payload.payment.entity);
        break;

      default:
        console.log(`Unhandled event type: ${event.event}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handlePaymentCaptured(payment: RazorpayPayment) {
  console.log("Payment captured:", payment.id);

  try {
    // Find subscription by payment ID or customer ID
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.razorpayPaymentId, payment.id),
    });

    if (subscription) {
      // Update subscription status to active
      await db
        .update(subscriptions)
        .set({
          status: "active",
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, subscription.id));

      console.log(`Subscription ${subscription.id} activated via webhook`);
    }
  } catch (error) {
    console.error("Error handling payment captured:", error);
  }
}

async function handlePaymentFailed(payment: RazorpayPayment) {
  console.log("Payment failed:", payment.id);

  try {
    // Find subscription by payment ID
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.razorpayPaymentId, payment.id),
    });

    if (subscription) {
      // Mark subscription as past_due
      await db
        .update(subscriptions)
        .set({
          status: "past_due",
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, subscription.id));

      console.log(`Subscription ${subscription.id} marked as past_due`);
    }
  } catch (error) {
    console.error("Error handling payment failed:", error);
  }
}

async function handleSubscriptionActivated(razorpaySubscription: RazorpaySubscription) {
  console.log("Subscription activated:", razorpaySubscription.id);

  try {
    // Find subscription by Razorpay subscription ID
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.razorpaySubscriptionId, razorpaySubscription.id),
    });

    if (subscription) {
      await db
        .update(subscriptions)
        .set({
          status: "active",
          currentPeriodStart: new Date(razorpaySubscription.current_start * 1000),
          currentPeriodEnd: new Date(razorpaySubscription.current_end * 1000),
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, subscription.id));

      console.log(`Subscription ${subscription.id} activated`);
    }
  } catch (error) {
    console.error("Error handling subscription activated:", error);
  }
}

async function handleSubscriptionCancelled(razorpaySubscription: RazorpaySubscription) {
  console.log("Subscription cancelled:", razorpaySubscription.id);

  try {
    // Find subscription by Razorpay subscription ID
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.razorpaySubscriptionId, razorpaySubscription.id),
    });

    if (subscription) {
      // Get free plan to downgrade user
      const freePlan = await db.query.subscriptionPlans.findFirst({
        where: eq(subscriptionPlans.name, "Free"),
      });

      if (freePlan) {
        // Update to cancelled status
        await db
          .update(subscriptions)
          .set({
            status: "cancelled",
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, subscription.id));

        // Create new free subscription
        await db.insert(subscriptions).values({
          userId: subscription.userId,
          planId: freePlan.id,
          status: "active",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          conversationsUsed: 0,
          conversationsResetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        });

        console.log(`Subscription ${subscription.id} cancelled, user downgraded to Free plan`);
      }
    }
  } catch (error) {
    console.error("Error handling subscription cancelled:", error);
  }
}

async function handleSubscriptionCharged(payment: RazorpayPayment) {
  console.log("Subscription charged:", payment.id);

  try {
    if (!payment.customer_id) {
      console.error("No customer_id in payment object");
      return;
    }

    // Find subscription by customer ID
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.razorpayCustomerId, payment.customer_id),
    });

    if (subscription) {
      // Reset conversation usage for new billing period
      const newResetDate = new Date();
      newResetDate.setMonth(newResetDate.getMonth() + 1);

      await db
        .update(subscriptions)
        .set({
          conversationsUsed: 0,
          conversationsResetAt: newResetDate,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, subscription.id));

      console.log(`Usage reset for subscription ${subscription.id}`);
    }
  } catch (error) {
    console.error("Error handling subscription charged:", error);
  }
}
