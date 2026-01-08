"use client";

import { useEffect, useState } from "react";
import { getAgentBySlug } from "@/lib/actions/agent-actions";
import { AgentTable } from "@/lib/db/schema";
import { FloatingChatUI } from "@/components/floating-chat-ui";
import { WidgetChatUI } from "@/components/widget-chat-ui";

export default function ChatPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [agent, setAgent] = useState<AgentTable>({} as AgentTable);
  const [welcomeMessage, setWelcomeMessage] = useState("Hello! How can I help you today?");
  const [sessionId, setSessionId] = useState<string>("");
  const [uiStyle, setUiStyle] = useState<string>("floating"); // floating or widget
  const [isLoading, setIsLoading] = useState(true);

  // Generate or retrieve sessionId
  useEffect(() => {
    const storageKey = `chat_session_${slug}`;
    let storedSessionId = localStorage.getItem(storageKey);

    if (!storedSessionId) {
      storedSessionId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(storageKey, storedSessionId);
    }

    setSessionId(storedSessionId);
  }, [slug]);

  // Fetch agent details and UI config
  useEffect(() => {
    const fetchAgentDetails = async () => {
      try {
        const agentData = await getAgentBySlug(slug);
        if (agentData) {
          setAgent(agentData);

          // Fetch UI config
          try {
            const response = await fetch(`/api/agents/${agentData.id}/ui-config`);
            if (response.ok) {
              const config = await response.json();
              setWelcomeMessage(config.welcomeMessage || "Hello! How can I help you today?");
              setUiStyle(config.uiStyle || "floating");
            }
          } catch (err) {
            console.error("Failed to fetch UI config:", err);
          }
        } else {
          setAgent({ name: "AI Assistant" } as AgentTable);
        }
      } catch (err) {
        console.error("Failed to fetch agent details:", err);
        setAgent({ name: "AI Assistant" } as AgentTable);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAgentDetails();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  // Render floating UI or widget UI based on preference
  if (uiStyle === "widget") {
    return (
      <WidgetChatUI
        slug={slug}
        agent={agent}
        welcomeMessage={welcomeMessage}
        sessionId={sessionId}
      />
    );
  }

  return (
    <FloatingChatUI
      slug={slug}
      agent={agent}
      welcomeMessage={welcomeMessage}
      sessionId={sessionId}
    />
  );
}
