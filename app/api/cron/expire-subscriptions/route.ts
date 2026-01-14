// app/api/cron/expire-subscriptions/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions, subscriptionPlans } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Cron endpoint to automatically expire subscriptions and downgrade users to Free plan
 * This can be called by external cron services like Vercel Cron, or Cron-job.org
 *
 * Recommended schedule: Every hour or every 6 hours
 *
 * Vercel Cron setup in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/expire-subscriptions",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 *
 * Or use Authorization header for security:
 * Authorization: Bearer YOUR_SECRET_TOKEN
 */
export async function GET(request: Request) {
  try {
    // Optional: Add authorization check
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET;

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🕐 Running subscription expiry check...");

    // Find all active subscriptions
    const activeSubscriptions = await db.query.subscriptions.findMany({
      where: eq(subscriptions.status, "active"),
      with: {
        plan: true,
      },
    });

    const now = new Date();
    let expiredCount = 0;

    // Get Free plan once
    const freePlan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.name, "Free"),
    });

    if (!freePlan) {
      console.error("❌ Free plan not found in database!");
      return NextResponse.json({ error: "Free plan not found" }, { status: 500 });
    }

    for (const subscription of activeSubscriptions) {
      // Check if subscription has expired and is a paid plan
      if (subscription.currentPeriodEnd < now && subscription.plan.name !== "Free") {
        console.log(`⏰ Expiring subscription ${subscription.id} for user ${subscription.userId}`);

        // Mark current subscription as expired
        await db
          .update(subscriptions)
          .set({
            status: "expired",
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, subscription.id));

        // Create new Free plan subscription
        await db.insert(subscriptions).values({
          userId: subscription.userId,
          planId: freePlan.id,
          status: "active",
          currency: "USD",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          conversationsUsed: 0,
          conversationsResetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          // Preserve Razorpay customer ID if it exists
          razorpayCustomerId: subscription.razorpayCustomerId,
        });

        console.log(`✅ User ${subscription.userId} downgraded to Free plan`);
        expiredCount++;
      }
    }

    console.log(`✅ Subscription expiry check complete. Expired: ${expiredCount}`);

    return NextResponse.json({
      success: true,
      expiredCount,
      checkedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("Failed to expire subscriptions:", error);
    return NextResponse.json(
      { error: "Failed to expire subscriptions" },
      { status: 500 }
    );
  }
}

// Allow POST as well (some cron services prefer POST)
export async function POST(request: Request) {
  return GET(request);
}
