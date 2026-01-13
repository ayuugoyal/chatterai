// lib/scripts/seed.ts
import "dotenv/config";
import { db } from "@/lib/db";
import { subscriptionPlans } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding database...");

  // Seed subscription plans
  const plans = [
    {
      name: "Free",
      price: 0, // Deprecated, kept for backward compatibility
      priceINR: 0, // Free in INR
      priceUSD: 0, // Free in USD
      maxAgents: 1,
      maxConversations: 50,
      maxUrlsPerAgent: 5,
      features: [
        "1 AI Agent",
        "50 conversations/month",
        "5 URLs per agent",
        "Email support",
        "Community access",
      ],
    },
    {
      name: "Pro",
      price: 50000, // Deprecated, kept for backward compatibility
      priceINR: 50000, // ₹500.00 in paise (1 INR = 100 paise)
      priceUSD: 600, // $6.00 in cents (1 USD = 100 cents)
      maxAgents: 5,
      maxConversations: 5000, // 1000 conversations per agent * 5 agents
      maxUrlsPerAgent: 50,
      features: [
        "5 AI Agents",
        "5,000 conversations/month (1,000 per agent)",
        "50 URLs per agent",
        "Priority support",
        "Advanced analytics",
        "Custom branding",
        "API access",
        "Remove 'Powered by Chatter AI' badge",
      ],
    },
    {
      name: "Enterprise",
      price: 200000, // Deprecated, kept for backward compatibility
      priceINR: 200000, // ₹2,000.00 in paise
      priceUSD: 2400, // $24.00 in cents (4x Pro price)
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
        "White-label solution",
      ],
    },
  ];

  for (const plan of plans) {
    const existing = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.name, plan.name),
    });

    if (!existing) {
      await db.insert(subscriptionPlans).values(plan);
      console.log(`✅ Created ${plan.name} plan`);
    } else {
      // Update existing plan with new limits
      await db
        .update(subscriptionPlans)
        .set({
          price: plan.price,
          priceINR: plan.priceINR,
          priceUSD: plan.priceUSD,
          maxAgents: plan.maxAgents,
          maxConversations: plan.maxConversations,
          maxUrlsPerAgent: plan.maxUrlsPerAgent,
          features: plan.features,
        })
        .where(eq(subscriptionPlans.name, plan.name));
      console.log(`🔄 Updated ${plan.name} plan (₹${plan.priceINR / 100} / $${plan.priceUSD / 100})`);
    }
  }

  console.log("✨ Seeding complete!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});
