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
      console.log(`✅ Created ${plan.name} plan`);
    } else {
      console.log(`⏭️  ${plan.name} plan already exists`);
    }
  }

  console.log("✨ Seeding complete!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});
