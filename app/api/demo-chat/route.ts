import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { LangChainAdapter } from "ai";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { demoChatSessions, demoChatMessages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { messages, sessionId } = await req.json();

    if (!sessionId) {
      return new Response(
        JSON.stringify({
          error: "Session ID is required",
        }),
        { status: 400 }
      );
    }

    // Check if session exists and get summary
    let conversationSummary = "";
    const existingSession = await db.query.demoChatSessions.findFirst({
      where: eq(demoChatSessions.sessionId, sessionId),
    });

    if (existingSession) {
      // Update message count
      await db
        .update(demoChatSessions)
        .set({
          messageCount: existingSession.messageCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(demoChatSessions.sessionId, sessionId));

      // Use the last summary if available
      if (existingSession.lastSummary) {
        conversationSummary = existingSession.lastSummary;
      }
    } else {
      // Create new session
      await db.insert(demoChatSessions).values({
        id: `demo_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        sessionId,
        messageCount: 1,
      });
    }

    // Save user message
    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage && lastUserMessage.role === "user") {
      await db.insert(demoChatMessages).values({
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        sessionId,
        role: "user",
        content: lastUserMessage.content,
      });
    }

    // System prompt with information about Chatter AI platform
    let systemPrompt = `You are an AI assistant for Chatter AI, an embeddable chatbot platform for businesses.

## Key Info:
- Create custom AI agents trained on your website content
- Easy one-line code integration
- Supports Gemini, Claude, and GPT models
- Customizable UI with your brand colors

## Pricing:
- **Free**: 5 agents, 250 chats/mo, 5 URLs
- **Pro** (₹500/mo): 30 agents, 30K chats, 50 URLs
- **Enterprise** (₹2K/mo): Unlimited everything

## How it Works:
1. Sign up free (no card needed)
2. Create agent, add your website URLs
3. Get embed code: <script src="..." data-slug="..."></script>
4. Paste on your site
5. Done! Chatbot is live

Be helpful and concise. Encourage free signup to try it.`;

    // If returning user with summary, add context
    if (conversationSummary) {
      systemPrompt += `\n\n## Previous Conversation Summary:\n${conversationSummary}\n\nNote: This user has chatted with you before. Use this context to provide more personalized responses and avoid repeating information they already know.`;
    }

    // Create Gemini model
    const model = new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
      model: "gemini-2.5-flash",
      temperature: 0.7,
      maxOutputTokens: 500,
      callbacks: [
        {
          handleLLMEnd: async (output) => {
            // Save assistant message
            const content = output.generations[0][0].text;
            await db.insert(demoChatMessages).values({
              id: `msg_${Date.now()}_${Math.random()
                .toString(36)
                .substring(7)}`,
              sessionId,
              role: "assistant",
              content,
            });

            // Generate and save summary for returning users
            // Only if message count is > 5 to avoid summaries for very short conversations
            if (existingSession && existingSession.messageCount > 5) {
              try {
                const summarizer = new ChatGoogleGenerativeAI({
                  apiKey: process.env.GOOGLE_API_KEY,
                  model: "gemini-2.5-flash",
                  temperature: 0.3,
                  maxOutputTokens: 100,
                });

                // Only include last 3 message pairs to reduce context
                const recentMessages = messages.slice(-6);
                const summaryPrompt = `Summarize in 1-2 sentences what user asked about Chatter AI:\n${recentMessages
                  .map(
                    (m: { role: string; content: string }) =>
                      `${m.role}: ${m.content}`
                  )
                  .join("\n")}`;

                const summaryResponse = await summarizer.invoke([
                  { role: "user", content: summaryPrompt },
                ]);

                await db
                  .update(demoChatSessions)
                  .set({ lastSummary: summaryResponse.content as string })
                  .where(eq(demoChatSessions.sessionId, sessionId));
              } catch (error) {
                console.error("Error generating summary:", error);
              }
            }
          },
        },
      ],
    });

    // Add system message
    const messagesWithSystem = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...messages,
    ];

    // Create streaming response
    const stream = await model.stream(messagesWithSystem);

    // Return streaming response
    return LangChainAdapter.toDataStreamResponse(stream);
  } catch (error) {
    console.error("Error in demo chat route:", error);
    return new Response(
      JSON.stringify({
        error: "There was an error processing your request",
      }),
      { status: 500 }
    );
  }
}
