"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AgentTable } from "@/lib/db/schema";

interface WidgetChatUIProps {
  slug: string;
  agent: AgentTable;
  welcomeMessage: string;
  sessionId: string;
}

interface UIConfig {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  buttonPosition: string;
  buttonSize: number;
  widgetWidth: number;
  widgetHeight: number;
  borderRadius: number;
  welcomeMessage: string;
  buttonIcon: string;
  headerTitle: string;
  showAgentAvatar: boolean;
  showTimestamp: boolean;
  showTypingIndicator: boolean;
  allowAttachments: boolean;
}

export function WidgetChatUI({
  slug,
  agent,
  welcomeMessage: initialWelcomeMessage,
  sessionId,
}: WidgetChatUIProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [welcomeMessage, setWelcomeMessage] = useState(initialWelcomeMessage);

  const [uiConfig, setUiConfig] = useState<UIConfig>({
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
    headerTitle: "Chat Support",
    showAgentAvatar: true,
    showTimestamp: true,
    showTypingIndicator: true,
    allowAttachments: false,
  });

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: `/api/chat/${slug}`,
    body: {
      sessionId,
      currentPageUrl: typeof window !== "undefined" ? window.location.href : undefined,
    },
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content: welcomeMessage,
      },
    ],
    onError: (error) => {
      console.error("Chat error:", error);
    },
  });

  // Fetch UI config
  useEffect(() => {
    const fetchUIConfig = async () => {
      try {
        const response = await fetch(`/api/agents/${agent.id}/ui-config`);
        if (response.ok) {
          const config = await response.json();
          const mergedConfig = {
            primaryColor: config.primaryColor || "#0070f3",
            secondaryColor: config.secondaryColor || "#f5f5f5",
            backgroundColor: config.backgroundColor || "#ffffff",
            textColor: config.textColor || "#333333",
            buttonPosition: config.buttonPosition || "bottom-right",
            buttonSize: config.buttonSize || 60,
            widgetWidth: config.widgetWidth || 380,
            widgetHeight: config.widgetHeight || 600,
            borderRadius: config.borderRadius || 8,
            welcomeMessage: config.welcomeMessage || "Hello! How can I help you today?",
            buttonIcon: config.buttonIcon || "message",
            headerTitle: config.headerTitle || agent.name || "Chat Support",
            showAgentAvatar: config.showAgentAvatar ?? true,
            showTimestamp: config.showTimestamp ?? true,
            showTypingIndicator: config.showTypingIndicator ?? true,
            allowAttachments: config.allowAttachments ?? false,
          };
          setUiConfig(mergedConfig);

          if (mergedConfig.welcomeMessage) {
            setWelcomeMessage(mergedConfig.welcomeMessage);
            if (messages.length === 1 && messages[0].id === "welcome") {
              setMessages([
                {
                  id: "welcome",
                  role: "assistant",
                  content: mergedConfig.welcomeMessage,
                },
              ]);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch UI config:", err);
      }
    };

    fetchUIConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Group messages by sender for better visual grouping
  const groupedMessages = messages.reduce(
    (groups, message, index) => {
      const prevMessage = messages[index - 1];
      const isSameRole = prevMessage && prevMessage.role === message.role;

      if (isSameRole) {
        groups[groups.length - 1].messages.push(message);
      } else {
        groups.push({
          role: message.role,
          messages: [message],
        });
      }

      return groups;
    },
    [] as { role: string; messages: typeof messages }[]
  );

  return (
    <div className="flex flex-col h-screen font-sans" style={{ backgroundColor: uiConfig.backgroundColor }}>
      {/* Header */}
      <motion.header
        className="px-6 py-4 backdrop-blur-md border-b sticky top-0 z-10 shadow-sm"
        style={{
          backgroundColor: uiConfig.secondaryColor,
          borderColor: uiConfig.primaryColor + "20",
        }}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            {uiConfig.showAgentAvatar && (
              <motion.div whileHover={{ scale: 1.05 }} className="relative group cursor-pointer">
                <div
                  className="absolute -inset-1 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-200"
                  style={{ backgroundColor: uiConfig.primaryColor }}
                ></div>
                <Avatar className="h-12 w-12 border-2 relative" style={{ borderColor: uiConfig.backgroundColor }}>
                  <AvatarFallback
                    className="text-white text-lg font-bold"
                    style={{ backgroundColor: uiConfig.primaryColor }}
                  >
                    {agent?.name?.charAt(0) || "A"}
                  </AvatarFallback>
                </Avatar>
                <motion.div
                  className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-green-500 border-2"
                  style={{ borderColor: uiConfig.backgroundColor }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
                />
              </motion.div>
            )}

            <div className="flex flex-col">
              <h1 className="font-bold text-xl tracking-tight" style={{ color: uiConfig.textColor }}>
                {uiConfig.headerTitle || agent?.name}
              </h1>
              <div
                className="flex items-center gap-2 text-xs font-medium"
                style={{ color: uiConfig.textColor, opacity: 0.7 }}
              >
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  Online
                </span>
                <span>•</span>
                <span>AI Assistant</span>
              </div>
            </div>
          </div>

          <div className="hidden sm:block">
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{
                backgroundColor: uiConfig.primaryColor + "20",
                color: uiConfig.primaryColor,
              }}
            >
              Powered by Chatter AI
            </span>
          </div>
        </div>
      </motion.header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-8 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-neutral-800">
        <div className="max-w-3xl mx-auto space-y-8">
          <AnimatePresence initial={false}>
            {groupedMessages.map((group, groupIndex) => (
              <motion.div
                key={`group-${groupIndex}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex gap-4", group.role === "user" ? "justify-end" : "justify-start max-w-[85%]")}
              >
                {group.role !== "user" && (
                  <div className="flex-shrink-0 mt-1">
                    <Avatar className="h-8 w-8 shadow-sm">
                      <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-neutral-800 dark:to-neutral-900 text-xs">
                        AI
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}

                <div className={cn("flex flex-col gap-1.5", group.role === "user" ? "items-end" : "items-start w-full")}>
                  <span className="text-[10px] text-muted-foreground font-medium px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {group.role === "user" ? "You" : agent?.name}
                  </span>

                  {group.messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, scale: 0.95, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-5 py-3.5 text-sm/relaxed shadow-sm max-w-fit break-words"
                      style={{
                        backgroundColor: group.role === "user" ? uiConfig.primaryColor : uiConfig.secondaryColor,
                        color: group.role === "user" ? "#ffffff" : uiConfig.textColor,
                        borderRadius: uiConfig.borderRadius + "px",
                        border: group.role === "user" ? "none" : `1px solid ${uiConfig.primaryColor}20`,
                        ...(group.role !== "user" && { width: "100%" }),
                      }}
                    >
                      {message.content}
                    </motion.div>
                  ))}
                </div>

                {group.role === "user" && (
                  <Avatar className="h-8 w-8 mt-4 flex-shrink-0 shadow-sm border border-white dark:border-black">
                    <AvatarFallback className="bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-200 text-xs font-bold">
                      You
                    </AvatarFallback>
                  </Avatar>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          <AnimatePresence>
            {isLoading && uiConfig.showTypingIndicator && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-start gap-4 max-w-[85%]"
              >
                <div className="flex-shrink-0 mt-1">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback
                      className="text-xs"
                      style={{ backgroundColor: `${uiConfig.primaryColor}20`, color: uiConfig.textColor }}
                    >
                      AI
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div
                  className="px-5 py-4 shadow-sm"
                  style={{
                    backgroundColor: uiConfig.secondaryColor,
                    border: `1px solid ${uiConfig.primaryColor}20`,
                    borderRadius: `${uiConfig.borderRadius}px`,
                  }}
                >
                  <div className="flex space-x-1.5 items-center h-full">
                    {[0, 1, 2].map((dot) => (
                      <motion.div
                        key={dot}
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: `${uiConfig.primaryColor}60` }}
                        animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY, delay: dot * 0.15 }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Input area */}
      <div className="p-4 md:p-6 bg-transparent">
        <motion.div
          className="max-w-3xl mx-auto"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.2 }}
        >
          <form
            onSubmit={handleSubmit}
            className={cn(
              "relative flex items-center shadow-lg p-1.5 transition-shadow duration-300",
              "focus-within:ring-2 focus-within:shadow-xl"
            )}
            style={{
              backgroundColor: uiConfig.secondaryColor,
              border: `1px solid ${uiConfig.primaryColor}20`,
              borderRadius: `${uiConfig.borderRadius * 3}px`,
            }}
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask me anything..."
              value={input}
              onChange={handleInputChange}
              disabled={isLoading}
              className="flex-1 bg-transparent border-none focus:ring-0 px-6 py-3 text-base outline-none min-w-0"
              style={{
                color: uiConfig.textColor,
              }}
            />

            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="rounded-full h-11 w-11 shrink-0 transition-all duration-300 border-0"
              style={{
                backgroundColor: !input.trim() ? `${uiConfig.primaryColor}40` : uiConfig.primaryColor,
                color: "#ffffff",
              }}
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 ml-0.5" />}
            </Button>
          </form>
          <div className="text-center mt-3">
            <span className="text-[10px] text-muted-foreground font-medium opacity-60">Powered by Chatter AI</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
