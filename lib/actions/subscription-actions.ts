"use server";

import { db } from "@/lib/db";
import { subscriptions, subscriptionPlans } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import {
  createRazorpayOrder,
  createRazorpayCustomer,
  cancelRazorpaySubscription,
  verifyRazorpayPayment,
} from "@/lib/razorpay";

export async function getUserSubscription() {
  const user = await requireAuth();

  try {
    const subscription = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.userId, user.id),
        eq(subscriptions.status, "active")
      ),
      with: {
        plan: true,
      },
    });

    return subscription;
  } catch (error) {
    console.error("Failed to fetch subscription:", error);
    return null;
  }
}

export async function getSubscriptionPlans() {
  try {
    const plans = await db.query.subscriptionPlans.findMany({
      orderBy: (subscriptionPlans, { asc }) => [asc(subscriptionPlans.price)],
    });

    return plans;
  } catch (error) {
    console.error("Failed to fetch plans:", error);
    return [];
  }
}

/**
 * Create a Razorpay order for subscription payment
 * This initiates the checkout process
 */
export async function createCheckoutSession(planId: string, currency: "INR" | "USD" = "USD") {
  const user = await requireAuth();

  try {
    const plan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.id, planId),
    });

    if (!plan) {
      return { error: "Plan not found" };
    }

    // Get price based on currency
    const price = currency === "INR" ? plan.priceINR : plan.priceUSD;

    if (price === 0) {
      return { error: "Cannot create checkout for free plan" };
    }

    console.log(`💰 Creating checkout session for ${plan.name} plan in ${currency}: ${price / 100} ${currency}`);

    // Note: We allow upgrades even if user has an active subscription
    // The old subscription will be canceled when the new payment is verified

    // Create or get Razorpay customer
    let customerId = "";
    const existingUser = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, user.id),
    });

    if (existingUser?.razorpayCustomerId) {
      customerId = existingUser.razorpayCustomerId;
    } else {
      const customerResult = await createRazorpayCustomer(
        user.email,
        user.name || user.email
      );

      if (!customerResult.success || !customerResult.customer) {
        return { error: "Failed to create customer" };
      }

      customerId = customerResult.customer.id;
    }

    // Create Razorpay order
    // Receipt must be max 40 chars - using timestamp + short user ID
    const shortUserId = user.id.substring(0, 8);
    const receipt = `ord_${Date.now()}_${shortUserId}`;
    const orderResult = await createRazorpayOrder(
      price,
      currency,
      receipt
    );

    if (!orderResult.success || !orderResult.order) {
      return { error: "Failed to create order" };
    }

    console.log(`✅ Razorpay order created: ${orderResult.order.id} for ${currency} ${price / 100}`);

    return {
      success: true,
      orderId: orderResult.order.id,
      amount: price,
      currency,
      planId: plan.id,
      planName: plan.name,
      customerId,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    };
  } catch (error) {
    console.error("Failed to create checkout session:", error);
    return { error: "Failed to create checkout session" };
  }
}

/**
 * Verify payment and activate subscription
 * Called after successful Razorpay payment
 */
export async function verifyPaymentAndActivateSubscription(
  orderId: string,
  paymentId: string,
  signature: string,
  planId: string,
  customerId: string,
  currency: "INR" | "USD" = "USD"
) {
  const user = await requireAuth();

  try {
    console.log(`🔐 Verifying payment for plan ${planId} in ${currency}`);

    // Verify payment signature
    const isValid = verifyRazorpayPayment(orderId, paymentId, signature);

    if (!isValid) {
      console.error("❌ Invalid payment signature");
      return { error: "Invalid payment signature" };
    }

    console.log("✅ Payment signature verified");

    const plan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.id, planId),
    });

    if (!plan) {
      return { error: "Plan not found" };
    }

    // Cancel any existing active subscriptions
    const existingSubscription = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.userId, user.id),
        eq(subscriptions.status, "active")
      ),
    });

    if (existingSubscription) {
      console.log("🔄 Canceling existing subscription:", existingSubscription.id);
      await db
        .update(subscriptions)
        .set({
          status: "cancelled",
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, existingSubscription.id));
    }

    // Create new subscription
    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1); // Monthly subscription

    await db.insert(subscriptions).values({
      userId: user.id,
      planId: plan.id,
      status: "active",
      currency, // Store the currency used for this subscription
      currentPeriodStart,
      currentPeriodEnd,
      razorpayCustomerId: customerId,
      razorpayPaymentId: paymentId,
      conversationsUsed: 0,
      conversationsResetAt: currentPeriodEnd,
    });

    console.log(`✅ Subscription activated for ${plan.name} plan in ${currency}`);

    revalidatePath("/dashboard/billing");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Failed to verify payment:", error);
    return { error: "Failed to verify payment" };
  }
}

/**
 * Cancel subscription
 * Will downgrade to free plan at the end of billing period
 */
export async function cancelSubscription() {
  const user = await requireAuth();

  try {
    const subscription = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.userId, user.id),
        eq(subscriptions.status, "active")
      ),
      with: {
        plan: true,
      },
    });

    if (!subscription) {
      return { error: "No active subscription found" };
    }

    if (subscription.plan.name === "Free") {
      return { error: "Cannot cancel free plan" };
    }

    // Cancel with Razorpay if subscription ID exists
    if (subscription.razorpaySubscriptionId) {
      const result = await cancelRazorpaySubscription(
        subscription.razorpaySubscriptionId,
        true
      );

      if (!result.success) {
        console.error("Failed to cancel Razorpay subscription:", result.error);
      }
    }

    await db
      .update(subscriptions)
      .set({
        cancelAtPeriodEnd: true,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscription.id));

    revalidatePath("/dashboard/billing");
    return { success: true };
  } catch (error) {
    console.error("Failed to cancel subscription:", error);
    return { error: "Failed to cancel subscription" };
  }
}

/**
 * Switch to Free plan
 * This is used when user wants to downgrade to Free plan from a paid plan
 */
export async function switchToFreePlan() {
  const user = await requireAuth();

  try {
    console.log("🆓 Switching to Free plan for user:", user.id);

    // Get Free plan
    const freePlan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.name, "Free"),
    });

    if (!freePlan) {
      return { error: "Free plan not found" };
    }

    // Cancel any existing active subscriptions
    const existingSubscription = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.userId, user.id),
        eq(subscriptions.status, "active")
      ),
    });

    if (existingSubscription) {
      console.log("🔄 Canceling existing subscription:", existingSubscription.id);
      await db
        .update(subscriptions)
        .set({
          status: "cancelled",
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, existingSubscription.id));
    }

    // Create new Free plan subscription
    await db.insert(subscriptions).values({
      userId: user.id,
      planId: freePlan.id,
      status: "active",
      currency: "USD", // Default currency for free plan
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      conversationsUsed: 0,
      conversationsResetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    console.log("✅ Successfully switched to Free plan");

    revalidatePath("/dashboard/billing");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Failed to switch to Free plan:", error);
    return { error: "Failed to switch to Free plan" };
  }
}

/**
 * Reactivate cancelled subscription
 */
export async function reactivateSubscription() {
  const user = await requireAuth();

  try {
    const subscription = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.userId, user.id),
        eq(subscriptions.status, "active")
      ),
    });

    if (!subscription) {
      return { error: "No subscription found" };
    }

    if (!subscription.cancelAtPeriodEnd) {
      return { error: "Subscription is not set to cancel" };
    }

    await db
      .update(subscriptions)
      .set({
        cancelAtPeriodEnd: false,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscription.id));

    revalidatePath("/dashboard/billing");
    return { success: true };
  } catch (error) {
    console.error("Failed to reactivate subscription:", error);
    return { error: "Failed to reactivate subscription" };
  }
}

/**
 * Get usage statistics for the current user
 */
export async function getUsageStatistics() {
  const user = await requireAuth();

  try {
    const subscription = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.userId, user.id),
        eq(subscriptions.status, "active")
      ),
      with: {
        plan: true,
      },
    });

    if (!subscription) {
      return {
        conversationsUsed: 0,
        conversationsLimit: 0,
        agentsUsed: 0,
        agentsLimit: 0,
        daysUntilReset: 0,
      };
    }

    // Count agents
    const agentsCount = await db.query.agents.findMany({
      where: eq(subscriptions.userId, user.id),
    });

    // Calculate days until reset
    const resetDate = subscription.conversationsResetAt || subscription.currentPeriodEnd;
    const daysUntilReset = Math.ceil(
      (resetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    return {
      conversationsUsed: subscription.conversationsUsed,
      conversationsLimit: subscription.plan.maxConversations,
      agentsUsed: agentsCount.length,
      agentsLimit: subscription.plan.maxAgents,
      daysUntilReset: Math.max(0, daysUntilReset),
    };
  } catch (error) {
    console.error("Failed to get usage statistics:", error);
    return {
      conversationsUsed: 0,
      conversationsLimit: 0,
      agentsUsed: 0,
      agentsLimit: 0,
      daysUntilReset: 0,
    };
  }
}

/**
 * Increment conversation usage
 * Called when a new conversation session is created
 */
export async function incrementConversationUsage(userId: string) {
  try {
    const subscription = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, "active")
      ),
      with: {
        plan: true,
      },
    });

    if (!subscription) {
      return { error: "No active subscription found" };
    }

    // Check if unlimited
    if (subscription.plan.maxConversations === -1) {
      return { success: true, unlimited: true };
    }

    // Check if limit exceeded
    if (subscription.conversationsUsed >= subscription.plan.maxConversations) {
      return { error: "Conversation limit exceeded. Please upgrade your plan." };
    }

    // Increment usage
    await db
      .update(subscriptions)
      .set({
        conversationsUsed: subscription.conversationsUsed + 1,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscription.id));

    return { success: true };
  } catch (error) {
    console.error("Failed to increment conversation usage:", error);
    return { error: "Failed to track conversation usage" };
  }
}

/**
 * Reset conversation usage at the start of new billing period
 * Called by cron job or webhook
 */
export async function resetConversationUsage(subscriptionId: string) {
  try {
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.id, subscriptionId),
    });

    if (!subscription) {
      return { error: "Subscription not found" };
    }

    // Set new reset date (1 month from now)
    const newResetDate = new Date();
    newResetDate.setMonth(newResetDate.getMonth() + 1);

    await db
      .update(subscriptions)
      .set({
        conversationsUsed: 0,
        conversationsResetAt: newResetDate,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscriptionId));

    return { success: true };
  } catch (error) {
    console.error("Failed to reset conversation usage:", error);
    return { error: "Failed to reset usage" };
  }
}
