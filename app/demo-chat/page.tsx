"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Sparkles, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function DemoChatPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add initial welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: "welcome",
      role: "assistant",
      content: `Hi! I'm the Chatter AI assistant. I can help you learn about our AI chatbot platform, answer questions about features, pricing, or how to get started. What would you like to know?`,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);

    // If there's an initial query, send it automatically
    if (initialQuery) {
      setTimeout(() => {
        handleSendMessage(initialQuery);
      }, 500);
    }
  }, [initialQuery]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response (you can replace this with actual API call)
    setTimeout(() => {
      const response = generateResponse(text);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000 + Math.random() * 1000);
  };

  // Simple response generator (replace with actual AI API)
  const generateResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes("price") || lowerQuery.includes("cost") || lowerQuery.includes("plan")) {
      return "Chatter AI offers three plans:\n\n**Free Plan** - ₹0/month\n• 5 AI Agents\n• 250 conversations/month\n• 5 URLs per agent\n• Perfect for testing!\n\n**Pro Plan** - ₹500/month\n• 30 AI Agents\n• 30,000 conversations/month\n• 50 URLs per agent\n• Priority support\n\n**Enterprise** - ₹2,000/month\n• Unlimited agents & conversations\n• Dedicated account manager\n• Custom integrations\n\nWant to get started with the free plan?";
    }

    if (lowerQuery.includes("how") && (lowerQuery.includes("work") || lowerQuery.includes("use"))) {
      return "Getting started with Chatter AI is super simple:\n\n1. **Sign up** for free (no credit card needed)\n2. **Create an AI agent** and provide URLs to your website, docs, or product pages\n3. **Copy the embed code** - just one line!\n4. **Paste it** on your website before the </body> tag\n\nYour AI chatbot will instantly start answering customer questions based on your content. It works on any website - Shopify, WordPress, custom sites, anywhere!";
    }

    if (lowerQuery.includes("feature") || lowerQuery.includes("can it") || lowerQuery.includes("does it")) {
      return "Chatter AI comes packed with features:\n\n✨ **Custom AI Agents** - Train on your content\n🎯 **Smart Recommendations** - Suggest products automatically\n⚡ **Instant Integration** - One line of code\n🤖 **Multiple AI Models** - GPT-4, Claude, Gemini\n📊 **Analytics Dashboard** - Track performance\n🌍 **Multi-language** - Serve global customers\n🎨 **Customizable** - Match your brand\n\nWhich feature interests you most?";
    }

    if (lowerQuery.includes("integrate") || lowerQuery.includes("install") || lowerQuery.includes("add")) {
      return "Integration is incredibly easy! Here's all you need:\n\n```html\n<script src=\"https://yoursite.com/embed.js\" data-slug=\"your-agent-slug\"></script>\n```\n\nJust add this before your `</body>` tag. That's it!\n\nWe also have plugins for:\n• Shopify\n• WordPress\n• Wix\n• Squarespace\n\nNo coding knowledge required!";
    }

    if (lowerQuery.includes("support") || lowerQuery.includes("help") || lowerQuery.includes("contact")) {
      return "We're here to help!\n\n📧 **Email**: support@chatterai.com\n💬 **Live Chat**: Available on our dashboard\n📚 **Documentation**: Comprehensive guides and tutorials\n\n**Free plan**: Email support (24-48hrs)\n**Pro plan**: Priority support (12hrs)\n**Enterprise**: 24/7 support + dedicated account manager\n\nNeed immediate help? Feel free to ask me anything!";
    }

    if (lowerQuery.includes("start") || lowerQuery.includes("begin") || lowerQuery.includes("signup")) {
      return "Awesome! Here's how to get started:\n\n1. Click 'Sign Up' in the top right\n2. Create your free account (no credit card)\n3. You'll get instant access to:\n   • 5 AI agents\n   • 250 free conversations/month\n   • Full dashboard access\n\nThe whole setup takes less than 2 minutes! Ready to transform your customer support with AI?";
    }

    // Default response
    return `That's a great question! Chatter AI helps businesses automate customer support using AI chatbots that can:\n\n• Answer questions 24/7\n• Recommend products\n• Handle multiple conversations\n• Work in any language\n• Integrate in 2 minutes\n\nCould you tell me more about what you're looking for? I'd love to help you find the perfect solution!`;
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
                  <p className="text-xs text-muted-foreground mt-1 px-1">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
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
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2"
          >
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
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
