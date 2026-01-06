import { getAgentBySlug } from "@/lib/actions/agent-actions";
import { db } from "@/lib/db";
import { conversations, messages as drizzleMessages } from "@/lib/db/schema";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI } from "@langchain/openai";
import { LangChainAdapter } from "ai";
import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { scrapeWithCache } from "@/lib/scraper";

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { messages, sessionId, currentPageUrl } = await req.json();
    const slug = params.slug;
    console.time("CHAT API: Fetch Agent");
    const agent = await getAgentBySlug(slug);
    console.timeEnd("CHAT API: Fetch Agent");

    if (!agent) {
      return new Response(
        JSON.stringify({
          error: "Agent not found",
        }),
        { status: 404 }
      );
    }

    // Track conversation (only if saveConversations is enabled)
    let conversationId = "";
    if (sessionId && agent.saveConversations) {
      const existingConversation = await db.query.conversations.findFirst({
        where: eq(conversations.sessionId, sessionId),
      });

      if (existingConversation) {
        conversationId = existingConversation.id;
        await db
          .update(conversations)
          .set({
            messageCount: existingConversation.messageCount + 1,
            updatedAt: new Date(),
          })
          .where(eq(conversations.id, existingConversation.id));
      } else {
        const [newConv] = await db
          .insert(conversations)
          .values({
            agentId: agent.id,
            sessionId,
            messageCount: 1,
          })
          .returning();
        conversationId = newConv.id;
      }
    }

    // Save User Message (only if saveConversations is enabled)
    const lastUserMessage = messages[messages.length - 1];
    if (conversationId && lastUserMessage.role === "user" && agent.saveConversations) {
      await db.insert(drizzleMessages).values({
        conversationId,
        role: "user",
        content: lastUserMessage.content,
      });
    }

    // Build enhanced system prompt with scraped content
    let enhancedSystemPrompt =
      agent.systemPrompt || "You are a helpful AI assistant.";

    if (agent.urls && agent.urls.length > 0) {
      // Limit context to prevent timeouts and rate limits (approx 15k chars ~3-4k tokens)
      const MAX_CONTEXT_LENGTH = 15000;
      let currentLength = 0;
      const validUrls = agent.urls.filter((u) => u.scrapedContent);
      const selectedContents: string[] = [];

      for (const url of validUrls) {
        if (currentLength >= MAX_CONTEXT_LENGTH) break;

        const content = (url.scrapedContent || "").trim();
        if (!content) continue;

        // If adding this entirely exceeds limit, truncate it
        if (currentLength + content.length > MAX_CONTEXT_LENGTH) {
          const remaining = MAX_CONTEXT_LENGTH - currentLength;
          if (remaining > 0) {
            selectedContents.push(
              content.substring(0, remaining) + "\n... (truncated)"
            );
            currentLength += remaining;
          }
          break;
        } else {
          selectedContents.push(content);
          currentLength += content.length;
        }
      }

      const scrapedContents = selectedContents.join("\n\n---\n\n");

      if (scrapedContents) {
        enhancedSystemPrompt += `\n\n## Knowledge Base\n\nYou have access to the following information from the company's website(s). Use this information to answer user questions accurately:\n\n${scrapedContents}\n\n## Instructions\n\n- Always prioritize information from the knowledge base above when answering questions\n- If you're unsure or the information isn't in the knowledge base, be honest about it\n- Be conversational and helpful\n- If asked about products, services, or company information, refer to the knowledge base first`;
      }
    }

    // Add current page context if provided
    if (currentPageUrl) {
      try {
        console.log("CHAT API: Scraping current page:", currentPageUrl);
        const pageData = await scrapeWithCache(currentPageUrl);

        if (pageData) {
          const pageContext = `# Current Page Context\n\n**Title:** ${pageData.title || 'N/A'}\n**URL:** ${currentPageUrl}\n\n${pageData.content || ''}`;

          // Add to beginning of knowledge base with higher priority
          enhancedSystemPrompt += `\n\n## Current Page Information\n\nThe user is currently viewing this page. Use this context to provide more relevant answers:\n\n${pageContext.substring(0, 5000)}\n\n`;
        }
      } catch (error) {
        console.error("Error scraping current page:", error);
        // Continue without page context if scraping fails
      }
    }

    // Select the appropriate model
    let model;
    switch (agent.modelProvider) {
      case "anthropic":
        model = new ChatAnthropic({
          apiKey: agent.anthropicApiKey || process.env.ANTHROPIC_API_KEY,
          model: "claude-3-5-sonnet-20241022",
          temperature: 0.7,
        });
        break;
      case "openai":
        model = new ChatOpenAI({
          apiKey: agent.openaiApiKey || process.env.OPENAI_API_KEY,
          model: "gpt-4o-mini",
          temperature: 0.7,
        });
        break;
      case "google":
      case "gemini":
      default:
        model = new ChatGoogleGenerativeAI({
          apiKey: agent.geminiApiKey || process.env.GOOGLE_API_KEY,
          model: "gemini-2.5-flash-lite",
          temperature: 0.7,
          maxOutputTokens: 2048,
          callbacks: [
            {
              handleLLMEnd: async (output) => {
                if (conversationId && agent.saveConversations) {
                  const content = output.generations[0][0].text;
                  await db.insert(drizzleMessages).values({
                    conversationId,
                    role: "assistant",
                    content,
                  });
                }
              },
            },
          ],
        });
        break;
    }

    // Add system message
    const messagesWithSystem = [
      {
        role: "system",
        content: enhancedSystemPrompt,
      },
      ...messages,
    ];

    console.log("CHAT API: Context size:", enhancedSystemPrompt.length);

    // Create streaming chain
    const stream = await model.stream(messagesWithSystem);

    // Langchain Adapter (ai/rsc) handling
    return LangChainAdapter.toDataStreamResponse(stream);
  } catch (error) {
    console.error("Error in chat route:", error);
    return new Response(
      JSON.stringify({
        error: "There was an error processing your request",
      }),
      { status: 500 }
    );
  }
}
