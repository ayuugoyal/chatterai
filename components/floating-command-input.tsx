"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Search, Command, Sparkles, ArrowRight, X } from "lucide-react";

export function FloatingCommandInput() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Keyboard shortcut to open (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }

      // ESC to close
      if (e.key === "Escape") {
        setIsOpen(false);
        setInput("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    const trimmedInput = input.trim();

    // Check if input is a URL or contains /chat/
    if (trimmedInput.startsWith("http") || trimmedInput.includes("/chat/")) {
      // Extract slug from URL if it's a full URL
      const slugMatch = trimmedInput.match(/\/chat\/([^/?]+)/);
      if (slugMatch) {
        router.push(`/chat/${slugMatch[1]}`);
        setInput("");
        setIsOpen(false);
        return;
      }
    }

    // Check if input looks like an agent slug (alphanumeric with hyphens)
    const slugPattern = /^[a-zA-Z0-9-]+$/;
    if (slugPattern.test(trimmedInput) && trimmedInput.length > 3 && !trimmedInput.includes(" ")) {
      // Likely an agent slug, open that agent's chat
      router.push(`/chat/${trimmedInput}`);
      setInput("");
      setIsOpen(false);
      return;
    }

    // If user types /chat, open the demo chat
    if (trimmedInput.toLowerCase() === "/chat" || trimmedInput.toLowerCase() === "chat") {
      router.push("/demo-chat");
      setInput("");
      setIsOpen(false);
      return;
    }

    // Otherwise, open demo chat with the query as initial message
    router.push(`/demo-chat?q=${encodeURIComponent(trimmedInput)}`);
    setInput("");
    setIsOpen(false);
  };

  const quickActions = [
    {
      icon: Sparkles,
      label: "Try Demo Chat",
      description: "Chat with our AI about Chatter AI",
      action: () => {
        setInput("");
        setIsOpen(false);
        router.push("/demo-chat");
      },
    },
    {
      icon: Search,
      label: "View Features",
      description: "Explore what Chatter AI can do",
      action: () => {
        setIsOpen(false);
        const element = document.getElementById("features");
        element?.scrollIntoView({ behavior: "smooth" });
      },
    },
  ];

  return (
    <>
      {/* Floating Input Button - Always visible */}
      <button
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        className="fixed bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 sm:px-6 py-3 bg-background/90 backdrop-blur-lg border border-border rounded-full shadow-lg hover:shadow-xl transition-shadow w-[calc(100vw-2rem)] max-w-md sm:max-w-2xl cursor-pointer"
      >
        <Search className="w-[18px] h-[18px] text-muted-foreground flex-shrink-0" />
        <span className="text-[15px] text-muted-foreground flex-1 text-left">
          Try AI Chat or type a command...
        </span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted rounded">
          <Command className="w-3 h-3" />K
        </kbd>
      </button>

      {/* Expanded Command Palette */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => {
                setIsOpen(false);
                setInput("");
              }}
            />

            {/* Command Palette */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed top-[10%] sm:top-[20%] left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-full sm:max-w-2xl z-50"
            >
              <div className="bg-background rounded-xl sm:rounded-2xl border border-border shadow-2xl overflow-hidden max-h-[80vh] overflow-y-auto">
                {/* Header with Search */}
                <form onSubmit={handleSubmit} className="relative">
                  <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
                    <Search className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      placeholder="Type agent slug, /chat for demo, or ask a question..."
                      className="flex-1 bg-transparent outline-none text-sm sm:text-base placeholder:text-muted-foreground"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        setInput("");
                      }}
                      className="p-1 hover:bg-muted rounded-md transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </form>

                {/* Quick Actions */}
                {!input && (
                  <div className="p-2">
                    <div className="px-4 py-2 text-xs font-medium text-muted-foreground">
                      Quick Actions
                    </div>
                    {quickActions.map((action, index) => (
                      <button
                        key={index}
                        onClick={action.action}
                        className="w-full flex items-center gap-4 px-4 py-3 hover:bg-muted rounded-lg transition-colors group"
                      >
                        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                          <action.icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="text-sm font-medium">{action.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {action.description}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Suggestions when typing */}
                {input && (
                  <div className="p-2 space-y-2">
                    {/* Check if input looks like an agent slug */}
                    {/^[a-zA-Z0-9-]+$/.test(input.trim()) && input.trim().length > 3 && (
                      <button
                        onClick={handleSubmit}
                        className="w-full flex items-center gap-4 px-4 py-3 bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors group"
                      >
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Sparkles className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="text-sm font-medium">
                            Open agent: "{input}"
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Visit /chat/{input}
                          </div>
                        </div>
                        <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded">
                          ↵
                        </kbd>
                      </button>
                    )}

                    {/* Default: Ask question in demo chat */}
                    <button
                      onClick={handleSubmit}
                      className="w-full flex items-center gap-4 px-4 py-3 bg-muted hover:bg-muted/80 rounded-lg transition-colors group"
                    >
                      <div className="p-2 bg-muted-foreground/10 rounded-lg">
                        <Search className="w-4 h-4" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium">
                          Ask in demo chat: "{input}"
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Chat with our AI assistant
                        </div>
                      </div>
                    </button>
                  </div>
                )}

                {/* Footer */}
                <div className="px-4 py-3 bg-muted/50 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-background rounded text-[10px] sm:text-xs">↵</kbd>
                      <span className="hidden sm:inline">to chat</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-background rounded text-[10px] sm:text-xs">ESC</kbd>
                      <span className="hidden sm:inline">to close</span>
                    </span>
                  </div>
                  <span className="hidden sm:inline">Powered by Chatter AI</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
