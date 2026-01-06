"use client"

import { cn } from "@/lib/utils"
// import { MessageTable } from "@/lib/db/schema"
import { Bot, User } from "lucide-react"

// Define interface locally
interface Message {
  id: string;
  conversationId: string;
  role: string | "user" | "assistant";
  content: string;
  createdAt: Date;
}

interface ConversationViewerProps {
  messages: Message[]
}

export function ConversationViewer({ messages }: ConversationViewerProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-full text-muted-foreground">
        <p>Select a conversation to view details</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-4 p-4 h-full overflow-y-auto">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "flex w-full gap-2 p-4 rounded-lg",
            message.role === "user"
              ? "bg-muted/50 ml-auto max-w-[80%]"
              : "bg-background border mr-auto max-w-[80%]"
          )}
        >
          <div className="flex-shrink-0 mt-1">
            {message.role === "user" ? (
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
            ) : (
              <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-blue-500" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted-foreground capitalize">
              {message.role}
            </span>
            <div className="text-sm whitespace-pre-wrap leading-relaxed">
              {message.content}
            </div>
            <span className="text-[10px] text-muted-foreground mt-1">
              {new Date(message.createdAt).toLocaleString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
