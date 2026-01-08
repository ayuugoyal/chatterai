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

export function FloatingChatUI({
  slug,
  agent,
  welcomeMessage,
  sessionId,
}: FloatingChatUIProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
      handleSubmit(e as any);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold">{agent?.name || "AI Assistant"}</h1>
              <p className="text-xs text-muted-foreground">Always here to help</p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground hidden sm:block">
            Powered by Chatter AI
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <AnimatePresence initial={false}>
            {messages.map((message, index) => (
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
                    className={
                      message.role === "assistant"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }
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
                    className={`inline-block px-4 py-3 rounded-2xl ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
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
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-4 mb-6"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2 px-4 py-3 bg-muted rounded-2xl">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
                placeholder={`Ask ${agent?.name || "AI"} anything...`}
                rows={1}
                className="w-full px-4 py-3 pr-12 bg-muted rounded-2xl resize-none outline-none focus:ring-2 focus:ring-primary/20 min-h-[52px] max-h-32"
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              size="icon"
              className="h-[52px] w-[52px] rounded-full shrink-0"
              disabled={!input.trim() || isLoading}
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
          <p className="text-xs text-center text-muted-foreground mt-2">
            Press Enter to send • Shift + Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
