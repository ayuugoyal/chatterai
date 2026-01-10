"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Sparkles, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useChat } from "@ai-sdk/react";

export const dynamic = "force-dynamic";

export default function DemoChatPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [sessionId, setSessionId] = useState<string>("");

  // Generate or retrieve session ID from localStorage
  useEffect(() => {
    const STORAGE_KEY = "demo_chat_session_id";
    let storedSessionId = localStorage.getItem(STORAGE_KEY);

    if (!storedSessionId) {
      // Generate new session ID
      storedSessionId = `demo_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem(STORAGE_KEY, storedSessionId);
    }

    setSessionId(storedSessionId);
  }, []);

  // Use AI SDK for chat functionality
  const { messages, input, handleInputChange, handleSubmit, isLoading, append, setMessages } = useChat({
    api: "/api/demo-chat",
    body: {
      sessionId,
    },
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content: "Hi! I'm the Chatter AI assistant. I can help you learn about our AI chatbot platform, answer questions about features, pricing, or how to get started. What would you like to know?",
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

  // If there's an initial query, send it automatically
  useEffect(() => {
    if (initialQuery) {
      setTimeout(() => {
        // Check if it's a greeting
        const isGreeting = isSimpleGreeting(initialQuery);
        if (isGreeting) {
          handleGreeting(initialQuery);
        } else {
          append({
            role: "user",
            content: initialQuery,
          });
        }
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Check if message is a simple greeting
  const isSimpleGreeting = (text: string): boolean => {
    const lowerText = text.toLowerCase().trim();
    const greetings = [
      "hi", "hello", "hey", "hola", "greetings", "good morning",
      "good afternoon", "good evening", "what's up", "whats up",
      "yo", "sup", "howdy"
    ];
    return greetings.some(greeting => lowerText === greeting || lowerText.startsWith(greeting + " "));
  };

  // Handle greeting with predefined response
  const handleGreeting = (text: string) => {
    const greetingResponses = [
      "Hello! 👋 I'm here to help you learn about Chatter AI. What would you like to know?",
      "Hi there! 😊 I can answer any questions about our AI chatbot platform. How can I help?",
      "Hey! Great to see you! Ask me anything about Chatter AI's features, pricing, or how to get started.",
    ];
    const randomResponse = greetingResponses[Math.floor(Math.random() * greetingResponses.length)];

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "user",
        content: text,
      },
      {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: randomResponse,
      },
    ]);
  };

  // Custom submit handler to check for greetings
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    // Check if it's a simple greeting
    if (isSimpleGreeting(trimmedInput)) {
      handleGreeting(trimmedInput);
      handleInputChange({ target: { value: "" } } as React.ChangeEvent<HTMLInputElement>);
    } else {
      // Use AI for non-greeting messages
      handleSubmit(e);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleFormSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-semibold">Chatter AI Demo</h1>
                <p className="text-xs text-muted-foreground">Ask me anything about our platform</p>
              </div>
            </div>
          </div>
          <Link href="/sign-up">
            <Button size="sm">
              Get Started Free
            </Button>
          </Link>
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
            onSubmit={handleFormSubmit}
            className="flex items-end gap-2"
          >
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                placeholder="Ask me anything about Chatter AI..."
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
