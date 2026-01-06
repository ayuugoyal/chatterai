"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  agents,
  agentUrls,
  subscriptions,
  subscriptionPlans,
  uiConfigs,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/session";
import {
  scrapeWithCache,
  formatScrapedDataForAI,
  scrapeSitemap,
  processAndEmbedContent,
} from "@/lib/scraper";

const agentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters.")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens."
    ),
  systemPrompt: z
    .string()
    .min(10, "System prompt must be at least 10 characters."),
  modelProvider: z.enum(["gemini", "anthropic", "openai"]),
  urls: z.array(z.string().url("Invalid URL")).optional(),
  saveConversations: z.boolean().default(true),
  // Custom API keys (optional)
  geminiApiKey: z.string().optional(),
  anthropicApiKey: z.string().optional(),
  openaiApiKey: z.string().optional(),
});

export type AgentFormValues = z.infer<typeof agentSchema>;

export async function createAgent(formData: AgentFormValues) {
  const validatedFields = agentSchema.safeParse(formData);
  if (!validatedFields.success) {
    return {
      error: "Invalid form data",
      issues: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, slug, systemPrompt, modelProvider, urls, saveConversations, geminiApiKey, anthropicApiKey, openaiApiKey } =
    validatedFields.data;

  console.log("SERVER ACTION: createAgent called with:", { name, slug, urls });

  try {
    const user = await requireAuth();
    console.log("SERVER ACTION: Auth check passed", user.id);

    // Check agent count limit (Used in both subscription paths)
    const existingAgents = await db.query.agents.findMany({
      where: eq(agents.userId, user.id),
    });
    console.log("SERVER ACTION: Agents defined", existingAgents.length);

    // Check subscription limits
    const userSubscription = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.userId, user.id),
        eq(subscriptions.status, "active")
      ),
      with: {
        plan: true,
      },
    });
    console.log("SERVER ACTION: Subscription check done", userSubscription?.id);

    if (!userSubscription) {
      console.log(
        "SERVER ACTION: No subscription found, attempting to provision Free plan..."
      );
      // Auto-provision Free plan
      const freePlan = await db.query.subscriptionPlans.findFirst({
        where: eq(subscriptionPlans.name, "Free"),
      });

      if (!freePlan) {
        console.log(
          "SERVER ACTION: Free plan not found in DB. Creating it now..."
        );

        const [newFreePlan] = await db
          .insert(subscriptionPlans)
          .values({
            name: "Free",
            price: 0,
            maxAgents: 1,
            maxConversations: 50,
            maxUrlsPerAgent: 5,
            features: ["1 Agent", "50 Conversations/mo", "5 URLs per agent"],
          })
          .returning();

        console.log("SERVER ACTION: Created Free plan", newFreePlan.id);

        // Use this new plan
        console.log(
          "SERVER ACTION: Creating subscription with new plan...",
          newFreePlan.id
        );
        await db.insert(subscriptions).values({
          userId: user.id,
          planId: newFreePlan.id,
          status: "active",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        });

        // Re-check limits with default values since we just created it
        if (existingAgents.length >= 1) {
          // Default maxAgents is 1
          return {
            error: `You've reached your plan limit of 1 agents. Please upgrade your plan.`,
          };
        }

        // Check URL limit
        if (urls && urls.length > 5) {
          // Default maxUrls is 5
          return {
            error: `You can add up to 5 URLs per agent on your current plan.`,
          };
        }
      } else {
        console.log(
          "SERVER ACTION: Found Free plan, creating subscription...",
          freePlan.id
        );
        await db.insert(subscriptions).values({
          userId: user.id,
          planId: freePlan.id,
          status: "active",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        });

        console.log(
          "SERVER ACTION: Subscription created. Checking limits against Free plan defaults."
        );

        // Manual check against free plan limits for this execution
        if (existingAgents.length >= freePlan.maxAgents) {
          return {
            error: `You've reached your plan limit of ${freePlan.maxAgents} agents. Please upgrade your plan.`,
          };
        }

        // Check URL limit
        if (urls && urls.length > freePlan.maxUrlsPerAgent) {
          return {
            error: `You can add up to ${freePlan.maxUrlsPerAgent} URLs per agent on your current plan.`,
          };
        }
      }

      // If we are here, we are good to go for creation
    } else {
      // Normal flow for existing subscription
      // Check agent count limit
      console.log(
        "SERVER ACTION: Agent count check done",
        existingAgents.length
      );

      if (existingAgents.length >= userSubscription.plan.maxAgents) {
        return {
          error: `You've reached your plan limit of ${userSubscription.plan.maxAgents} agents. Please upgrade your plan.`,
        };
      }

      // Check URL limit
      if (urls && urls.length > userSubscription.plan.maxUrlsPerAgent) {
        return {
          error: `You can add up to ${userSubscription.plan.maxUrlsPerAgent} URLs per agent on your current plan.`,
        };
      }
    }

    // Check if slug is taken
    const existingAgent = await db.query.agents.findFirst({
      where: eq(agents.slug, slug),
    });

    if (existingAgent) {
      return { error: "Slug already taken. Please choose a different slug." };
    }

    console.log("SERVER ACTION: Inserting agent...");
    // Create agent
    const [agent] = await db
      .insert(agents)
      .values({
        userId: user.id,
        name,
        slug,
        systemPrompt,
        modelProvider,
        isActive: true,
        saveConversations,
        geminiApiKey: geminiApiKey || null,
        anthropicApiKey: anthropicApiKey || null,
        openaiApiKey: openaiApiKey || null,
      })
      .returning();
    console.log("SERVER ACTION: Agent inserted", agent.id);

    // Create default UI config for the agent
    try {
      await db.insert(uiConfigs).values({
        agentId: agent.id,
        primaryColor: "#0070f3",
        secondaryColor: "#f5f5f5",
        backgroundColor: "#ffffff",
        textColor: "#333333",
        buttonPosition: "bottom-right",
        buttonSize: 60,
        widgetWidth: 380,
        widgetHeight: 600,
        borderRadius: 8,
        welcomeMessage: "Hello! How can I help you today?",
        buttonIcon: "message",
        headerTitle: name, // Use agent name as header title
        showAgentAvatar: true,
        showTimestamp: true,
        showTypingIndicator: true,
        allowAttachments: false,
      });
      console.log("SERVER ACTION: Default UI config created");
    } catch (error) {
      console.error("Error creating default UI config:", error);
      // Continue even if UI config creation fails
    }

    // Add URLs and scrape them
    if (urls && urls.length > 0) {
      console.log("SERVER ACTION: Processing URLs...", urls.length);
      let urlsToProcess = [...urls];

      // Use a set to avoid duplicates from expansion
      const uniqueUrls = new Set<string>();

      for (const url of urls) {
        uniqueUrls.add(url);
      }

      for (const url of uniqueUrls) {
        console.log("SERVER ACTION: Inserting URL", url);
        const [agentUrl] = await db
          .insert(agentUrls)
          .values({
            agentId: agent.id,
            url,
            status: "pending",
          })
          .returning();

        console.log(
          "SERVER ACTION: URL inserted, triggering scrape",
          agentUrl.id
        );
        // Scrape in background
        scrapeUrlForAgent(agentUrl.id, url).catch(console.error);
      }
    }

    revalidatePath("/dashboard/agents");
    console.log("SERVER ACTION: createAgent success:", agent.id);
    return { success: true, agentId: agent.id };
  } catch (error) {
    console.error("Failed to create agent:", error);
    if ((error as Error).message === "Unauthorized") {
      console.log("SERVER ACTION: Unauthorized error");
      return { error: "You must be logged in to create an agent." };
    }
    console.log("SERVER ACTION: General error");
    return { error: "Failed to create agent. Please try again." };
  }
}

async function scrapeUrlForAgent(agentUrlId: string, url: string) {
  try {
    // Check if it's a sitemap first (simple check)
    // Realistically we should probably check headers or try parsing, but for now let's try to scrape as sitemap if it ends in .xml or user says so.
    // Actually, `scrapeSitemap` will return empty array if it fails or finds nothing.

    let sitemapUrls: string[] = [];
    if (
      url.toLowerCase().endsWith("sitemap.xml") ||
      url.toLowerCase().endsWith(".xml")
    ) {
      sitemapUrls = await scrapeSitemap(url);
    }

    if (sitemapUrls.length > 0) {
      // It WAS a sitemap. We should add these new URLs to the agent and scrape them.
      // And mark the sitemap URL itself as "scraped" (or maybe just keep it as a reference).

      // We need to fetch the agentId for this agentUrlId to insert new ones.
      const currentAgentUrl = await db.query.agentUrls.findFirst({
        where: eq(agentUrls.id, agentUrlId),
      });

      if (currentAgentUrl) {
        for (const newUrl of sitemapUrls) {
          // Check if already exists for this agent
          const exists = await db.query.agentUrls.findFirst({
            where: and(
              eq(agentUrls.agentId, currentAgentUrl.agentId),
              eq(agentUrls.url, newUrl)
            ),
          });

          if (!exists) {
            const [newAgentUrl] = await db
              .insert(agentUrls)
              .values({
                agentId: currentAgentUrl.agentId,
                url: newUrl,
                status: "pending",
              })
              .returning();

            // Recursively scrape these new URLs (but standard scrape, not sitemap check again to avoid loops)
            // We can just call scrapeUrlForAgent again, but let's be careful about depth.
            // For now, let's just trigger the scrape.
            scrapeUrlForAgent(newAgentUrl.id, newUrl).catch(console.error);
          }
        }
        await db
          .update(agentUrls)
          .set({
            scrapedContent: `Sitemap processed. Found ${sitemapUrls.length} URLs.`,
            scrapedAt: new Date(),
            status: "scraped",
          })
          .where(eq(agentUrls.id, agentUrlId));
        return;
      }
    }

    // Normal scraping if not a sitemap or sitemap yielded no URLs
    const scrapedData = await scrapeWithCache(url);
    const formattedContent = formatScrapedDataForAI(scrapedData);

    // Get agent ID for this URL
    const agentUrlRecord = await db.query.agentUrls.findFirst({
      where: eq(agentUrls.id, agentUrlId),
    });

    await db
      .update(agentUrls)
      .set({
        scrapedContent: formattedContent,
        scrapedAt: new Date(),
        status: "scraped",
      })
      .where(eq(agentUrls.id, agentUrlId));

    // Generate embeddings for RAG (run in background)
    if (agentUrlRecord) {
      processAndEmbedContent(
        agentUrlRecord.agentId,
        agentUrlId,
        scrapedData
      ).catch((error) => {
        console.error(`Failed to generate embeddings for URL ${url}:`, error);
      });
    }
  } catch (error) {
    console.error(`Failed to scrape URL ${url}:`, error);
    await db
      .update(agentUrls)
      .set({
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      })
      .where(eq(agentUrls.id, agentUrlId));
  }
}

export async function getUserAgents() {
  const user = await requireAuth();

  try {
    const userAgents = await db.query.agents.findMany({
      where: eq(agents.userId, user.id),
      orderBy: (agents, { desc }) => [desc(agents.createdAt)],
      with: {
        urls: true,
      },
    });

    return userAgents;
  } catch (error) {
    console.error("Failed to fetch agents:", error);
    return [];
  }
}

export async function getAgentById(id: string) {
  const user = await requireAuth();

  try {
    const agent = await db.query.agents.findFirst({
      where: and(eq(agents.id, id), eq(agents.userId, user.id)),
      with: {
        urls: true,
      },
    });

    return agent;
  } catch (error) {
    console.error("Failed to fetch agent:", error);
    return null;
  }
}

export async function getAgentBySlug(slug: string) {
  try {
    const agent = await db.query.agents.findFirst({
      where: and(eq(agents.slug, slug), eq(agents.isActive, true)),
      with: {
        urls: {
          where: eq(agentUrls.status, "scraped"),
        },
      },
    });

    return agent;
  } catch (error) {
    console.error("Failed to fetch agent by slug:", error);
    return null;
  }
}

export async function updateAgent(id: string, formData: AgentFormValues) {
  const user = await requireAuth();

  const validatedFields = agentSchema.safeParse(formData);
  if (!validatedFields.success) {
    return {
      error: "Invalid form data",
      issues: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, slug, systemPrompt, modelProvider, urls, saveConversations, geminiApiKey, anthropicApiKey, openaiApiKey } =
    validatedFields.data;

  try {
    const existingAgent = await db.query.agents.findFirst({
      where: and(eq(agents.id, id), eq(agents.userId, user.id)),
    });

    if (!existingAgent) {
      return {
        error: "Agent not found or you don't have permission to edit it.",
      };
    }

    if (slug !== existingAgent.slug) {
      const slugExists = await db.query.agents.findFirst({
        where: eq(agents.slug, slug),
      });

      if (slugExists) {
        return { error: "Slug already taken. Please choose a different slug." };
      }
    }

    await db
      .update(agents)
      .set({
        name,
        slug,
        systemPrompt,
        modelProvider,
        saveConversations,
        geminiApiKey: geminiApiKey || null,
        anthropicApiKey: anthropicApiKey || null,
        openaiApiKey: openaiApiKey || null,
        updatedAt: new Date(),
      })
      .where(eq(agents.id, id));

    // Update URLs if provided
    if (urls) {
      // Get current URLs
      const currentUrls = await db.query.agentUrls.findMany({
        where: eq(agentUrls.agentId, id),
      });

      const currentUrlStrings = currentUrls.map((u) => u.url);
      const newUrls = urls.filter((url) => !currentUrlStrings.includes(url));
      const removedUrls = currentUrlStrings.filter(
        (url) => !urls.includes(url)
      );

      // Remove old URLs
      if (removedUrls.length > 0) {
        await db.delete(agentUrls).where(
          and(
            eq(agentUrls.agentId, id),
            // @ts-ignore
            sql`url = ANY(${removedUrls})`
          )
        );
      }

      // Add new URLs
      for (const url of newUrls) {
        const [agentUrl] = await db
          .insert(agentUrls)
          .values({
            agentId: id,
            url,
            status: "pending",
          })
          .returning();

        scrapeUrlForAgent(agentUrl.id, url).catch(console.error);
      }
    }

    revalidatePath("/dashboard/agents");
    return { success: true };
  } catch (error) {
    console.error("Failed to update agent:", error);
    return { error: "Failed to update agent. Please try again." };
  }
}

export async function deleteAgent(id: string) {
  const user = await requireAuth();

  try {
    const existingAgent = await db.query.agents.findFirst({
      where: and(eq(agents.id, id), eq(agents.userId, user.id)),
    });

    if (!existingAgent) {
      return {
        error: "Agent not found or you don't have permission to delete it.",
      };
    }

    await db.delete(agents).where(eq(agents.id, id));

    revalidatePath("/dashboard/agents");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete agent:", error);
    return { error: "Failed to delete agent. Please try again." };
  }
}

export async function addUrlToAgent(agentId: string, url: string) {
  const user = await requireAuth();

  try {
    const agent = await db.query.agents.findFirst({
      where: and(eq(agents.id, agentId), eq(agents.userId, user.id)),
      with: {
        urls: true,
      },
    });

    if (!agent) {
      return { error: "Agent not found" };
    }

    // Check subscription limits
    const userSubscription = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.userId, user.id),
        eq(subscriptions.status, "active")
      ),
      with: { plan: true },
    });

    if (!userSubscription) {
      return { error: "No active subscription" };
    }

    if (agent.urls.length >= userSubscription.plan.maxUrlsPerAgent) {
      return {
        error: `URL limit reached. Your plan allows ${userSubscription.plan.maxUrlsPerAgent} URLs per agent.`,
      };
    }

    const [agentUrl] = await db
      .insert(agentUrls)
      .values({
        agentId,
        url,
        status: "pending",
      })
      .returning();

    scrapeUrlForAgent(agentUrl.id, url).catch(console.error);

    revalidatePath(`/dashboard/agents/${agentId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to add URL:", error);
    return { error: "Failed to add URL" };
  }
}

export async function removeUrlFromAgent(agentUrlId: string) {
  const user = await requireAuth();

  try {
    const agentUrl = await db.query.agentUrls.findFirst({
      where: eq(agentUrls.id, agentUrlId),
      with: {
        agent: true,
      },
    });

    if (!agentUrl || agentUrl.agent.userId !== user.id) {
      return { error: "URL not found or unauthorized" };
    }

    await db.delete(agentUrls).where(eq(agentUrls.id, agentUrlId));

    revalidatePath(`/dashboard/agents/${agentUrl.agentId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to remove URL:", error);
    return { error: "Failed to remove URL" };
  }
}

export async function rescrapeUrl(agentUrlId: string) {
  const user = await requireAuth();

  try {
    const agentUrl = await db.query.agentUrls.findFirst({
      where: eq(agentUrls.id, agentUrlId),
      with: {
        agent: true,
      },
    });

    if (!agentUrl || agentUrl.agent.userId !== user.id) {
      return { error: "URL not found or unauthorized" };
    }

    await db
      .update(agentUrls)
      .set({
        status: "pending",
        errorMessage: null,
      })
      .where(eq(agentUrls.id, agentUrlId));

    scrapeUrlForAgent(agentUrlId, agentUrl.url).catch(console.error);

    revalidatePath(`/dashboard/agents/${agentUrl.agentId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to rescrape URL:", error);
    return { error: "Failed to rescrape URL" };
  }
}
