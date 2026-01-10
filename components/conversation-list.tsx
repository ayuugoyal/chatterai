"use client"

import { formatDistanceToNow } from "date-fns"
import { MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
// import { ConversationTable } from "@/lib/db/schema"

// Define interface locally if schema type isn't exported or fully compatible with client usage
interface Conversation {
  id: string;
  agentId: string;
  sessionId: string;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ConversationListProps {
  conversations: Conversation[]
  selectedId?: string | null
  onSelect: (id: string) => void
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg h-[400px] text-muted-foreground bg-muted/10">
        <MessageSquare className="h-10 w-10 mb-2 opacity-20" />
        <p>No conversations yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          className={cn(
            "flex flex-col p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors",
            selectedId === conversation.id
              ? "bg-muted border-primary/50"
              : "bg-card"
          )}
          onClick={() => onSelect(conversation.id)}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-sm truncate max-w-[180px]">
              Session {conversation.sessionId.slice(0, 8)}...
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}
            </span>
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <MessageSquare className="h-3 w-3 mr-1" />
            {conversation.messageCount} messages
          </div>
        </div>
      ))}
    </div>
  )
}
