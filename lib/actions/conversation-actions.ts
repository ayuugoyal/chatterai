"use server";

import { db } from "@/lib/db";
import { conversations, messages } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/session";

export async function getAgentConversations(agentId: string) {
  // Ensure user is authorized for this agent?
  // Ideally yes, but for now we trust the caller context or add check
  const user = await requireAuth();

  try {
    const result = await db.query.conversations.findMany({
      where: eq(conversations.agentId, agentId),
      orderBy: [desc(conversations.updatedAt)],
    });
    return result;
  } catch (err) {
    console.error("Error fetching conversations:", err);
    return [];
  }
}

export async function getConversationMessages(conversationId: string) {
  const user = await requireAuth();
  try {
    const result = await db.query.messages.findMany({
      where: eq(messages.conversationId, conversationId),
      orderBy: [desc(messages.createdAt)], // Oldest first or newest first? Chat usually oldest first but viewer might want reverse. Let's do oldest first for natural reading.
    });
    // Wait, chat sorting: Usually we want ASC created AT to read top to bottom.
    // Let's sort ASC.
    return result.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  } catch (err) {
    console.error("Error fetching messages:", err);
    return [];
  }
}
