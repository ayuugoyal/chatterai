"use server";

import { db } from "@/lib/db";
import { subscriptions, subscriptionPlans } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

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

export async function createCheckoutSession(planId: string) {
  const user = await requireAuth();

  try {
    const plan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.id, planId),
    });

    if (!plan) {
      return { error: "Plan not found" };
    }

    if (plan.price === 0) {
      return { error: "Cannot create checkout for free plan" };
    }

    // TODO: Integrate with Stripe
    // const session = await stripe.checkout.sessions.create({
    //   customer_email: user.email,
    //   line_items: [
    //     {
    //       price_data: {
    //         currency: 'usd',
    //         product_data: {
    //           name: plan.name,
    //         },
    //         unit_amount: plan.price,
    //         recurring: {
    //           interval: 'month',
    //         },
    //       },
    //       quantity: 1,
    //     },
    //   ],
    //   mode: 'subscription',
    //   success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/billing?success=true`,
    //   cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/billing?canceled=true`,
    //   metadata: {
    //     userId: user.id,
    //     planId: plan.id,
    //   },
    // });

    // For now, return a mock URL

    const addplan = await db.insert(subscriptions).values({
      userId: user.id,
      planId: plan.id,
      status: "active",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    console.log("Added plan:", addplan);

    return {
      success: true,
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/billing?mock=true`,
    };
  } catch (error) {
    console.error("Failed to create checkout session:", error);
    return { error: "Failed to create checkout session" };
  }
}

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

    // TODO: Cancel with Stripe
    // if (subscription.stripeSubscriptionId) {
    //   await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
    //     cancel_at_period_end: true,
    //   });
    // }

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

    // TODO: Reactivate with Stripe
    // if (subscription.stripeSubscriptionId) {
    //   await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
    //     cancel_at_period_end: false,
    //   });
    // }

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

// Seed function to create default plans
export async function seedSubscriptionPlans() {
  const plans = [
    {
      name: "Free",
      price: 0,
      maxAgents: 1,
      maxConversations: 100,
      maxUrlsPerAgent: 3,
      features: [
        "1 AI Agent",
        "100 conversations/month",
        "3 URLs per agent",
        "Basic support",
        "Community access",
      ],
    },
    {
      name: "Pro",
      price: 4900, // $49.00
      maxAgents: 10,
      maxConversations: 5000,
      maxUrlsPerAgent: 20,
      features: [
        "10 AI Agents",
        "5,000 conversations/month",
        "20 URLs per agent",
        "Priority support",
        "Advanced analytics",
        "Custom branding",
        "API access",
      ],
    },
    {
      name: "Enterprise",
      price: 19900, // $199.00
      maxAgents: -1, // unlimited
      maxConversations: -1, // unlimited
      maxUrlsPerAgent: -1, // unlimited
      features: [
        "Unlimited AI Agents",
        "Unlimited conversations",
        "Unlimited URLs",
        "24/7 Priority support",
        "Advanced analytics",
        "Custom branding",
        "API access",
        "Dedicated account manager",
        "Custom integrations",
        "SLA guarantee",
      ],
    },
  ];

  for (const plan of plans) {
    const existing = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.name, plan.name),
    });

    if (!existing) {
      await db.insert(subscriptionPlans).values(plan);
    }
  }

  return { success: true };
}
