"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { Send, Bot, User, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { AgentTable } from "@/lib/db/schema";

interface FloatingChatUIProps {
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
  borderRadius: number;
  welcomeMessage: string;
  headerTitle: string;
  showAgentAvatar: boolean;
  showTimestamp: boolean;
  showTypingIndicator: boolean;
}

export function FloatingChatUI({
  slug,
  agent,
  welcomeMessage: initialWelcomeMessage,
  sessionId,
}: FloatingChatUIProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [welcomeMessage, setWelcomeMessage] = useState(initialWelcomeMessage);

  const [uiConfig, setUiConfig] = useState<UIConfig>({
    primaryColor: "#8b5cf6",
    secondaryColor: "#f5f5f5",
    backgroundColor: "#ffffff",
    textColor: "#333333",
    borderRadius: 16,
    welcomeMessage: "Hello! How can I help you today?",
    headerTitle: "Chat Support",
    showAgentAvatar: true,
    showTimestamp: true,
    showTypingIndicator: true,
  });

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: `/api/chat/${slug}`,
    body: {
      sessionId,
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
            primaryColor: config.primaryColor || "#8b5cf6",
            secondaryColor: config.secondaryColor || "#f5f5f5",
            backgroundColor: config.backgroundColor || "#ffffff",
            textColor: config.textColor || "#333333",
            borderRadius: config.borderRadius || 16,
            welcomeMessage: config.welcomeMessage || "Hello! How can I help you today?",
            headerTitle: config.headerTitle || agent.name || "Chat Support",
            showAgentAvatar: config.showAgentAvatar ?? true,
            showTimestamp: config.showTimestamp ?? true,
            showTypingIndicator: config.showTypingIndicator ?? true,
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

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: uiConfig.backgroundColor }}>
      {/* Header */}
      <header
        className="border-b backdrop-blur sticky top-0 z-10 shadow-sm"
        style={{
          backgroundColor: uiConfig.secondaryColor,
          borderColor: uiConfig.primaryColor + "20",
        }}
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {uiConfig.showAgentAvatar && (
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: uiConfig.primaryColor + "20" }}
              >
                <Sparkles className="w-5 h-5" style={{ color: uiConfig.primaryColor }} />
              </div>
            )}
            <div>
              <h1 className="font-semibold" style={{ color: uiConfig.textColor }}>
                {uiConfig.headerTitle || agent?.name || "AI Assistant"}
              </h1>
              <p className="text-xs" style={{ color: uiConfig.textColor, opacity: 0.7 }}>
                Always here to help
              </p>
            </div>
          </div>
          <div className="text-xs hidden sm:block" style={{ color: uiConfig.textColor, opacity: 0.6 }}>
            Powered by Chatter AI
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={`mb-6 flex gap-4 ${
                  message.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {/* Avatar */}
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback
                    style={{
                      backgroundColor: message.role === "assistant" ? uiConfig.primaryColor : uiConfig.secondaryColor,
                      color: message.role === "assistant" ? "#ffffff" : uiConfig.textColor,
                    }}
                  >
                    {message.role === "assistant" ? (
                      <Bot className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </AvatarFallback>
                </Avatar>

                {/* Message Content */}
                <div
                  className={`flex-1 max-w-[80%] ${
                    message.role === "user" ? "text-right" : "text-left"
                  }`}
                >
                  <div
                    className="inline-block px-4 py-3"
                    style={{
                      backgroundColor: message.role === "user" ? uiConfig.primaryColor : uiConfig.secondaryColor,
                      color: message.role === "user" ? "#ffffff" : uiConfig.textColor,
                      borderRadius: `${uiConfig.borderRadius}px`,
                      border: message.role === "user" ? "none" : `1px solid ${uiConfig.primaryColor}20`,
                    }}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading Indicator */}
          {isLoading && uiConfig.showTypingIndicator && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-4 mb-6"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback
                  style={{
                    backgroundColor: uiConfig.primaryColor,
                    color: "#ffffff",
                  }}
                >
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div
                className="flex items-center gap-2 px-4 py-3"
                style={{
                  backgroundColor: uiConfig.secondaryColor,
                  border: `1px solid ${uiConfig.primaryColor}20`,
                  borderRadius: `${uiConfig.borderRadius}px`,
                }}
              >
                <Loader2 className="h-4 w-4 animate-spin" style={{ color: uiConfig.primaryColor }} />
                <span className="text-sm" style={{ color: uiConfig.textColor, opacity: 0.7 }}>
                  Thinking...
                </span>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div
        className="border-t backdrop-blur"
        style={{
          backgroundColor: uiConfig.secondaryColor,
          borderColor: uiConfig.primaryColor + "20",
        }}
      >
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <form
            onSubmit={handleSubmit}
            className="flex items-end gap-2"
          >
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                placeholder={`Ask ${uiConfig.headerTitle || agent?.name || "AI"} anything...`}
                rows={1}
                className="w-full px-4 py-3 pr-12 resize-none outline-none min-h-[52px] max-h-32"
                style={{
                  backgroundColor: uiConfig.backgroundColor,
                  color: uiConfig.textColor,
                  borderRadius: `${uiConfig.borderRadius}px`,
                  border: `1px solid ${uiConfig.primaryColor}20`,
                }}
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              size="icon"
              className="h-[52px] w-[52px] rounded-full shrink-0 border-0"
              style={{
                backgroundColor: !input.trim() ? `${uiConfig.primaryColor}40` : uiConfig.primaryColor,
                color: "#ffffff",
              }}
              disabled={!input.trim() || isLoading}
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
          <p
            className="text-xs text-center mt-2"
            style={{ color: uiConfig.textColor, opacity: 0.6 }}
          >
            Press Enter to send • Shift + Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
