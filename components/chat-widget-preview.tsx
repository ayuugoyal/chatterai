"use client"

import { useState, useEffect } from "react"
import { Bot, Send, User, X, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type ChatWidgetPreviewProps = {
  config: {
    primaryColor: string
    secondaryColor: string
    backgroundColor: string
    textColor: string
    widgetWidth: number
    widgetHeight: number
    borderRadius: number
    welcomeMessage: string
    headerTitle: string
    showAgentAvatar: boolean
    showTimestamp: boolean
    showTypingIndicator: boolean
    allowAttachments: boolean
  }
}

export default function ChatWidgetPreview({ config }: ChatWidgetPreviewProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [messages, setMessages] = useState([
    { role: "assistant", content: config.welcomeMessage, timestamp: new Date() },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)

  // Update welcome message when config changes
  useEffect(() => {
    setMessages([{ role: "assistant", content: config.welcomeMessage, timestamp: new Date() }])
  }, [config.welcomeMessage])

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    // Add user message
    const newMessages = [...messages, { role: "user", content: inputValue, timestamp: new Date() }]
    setMessages(newMessages)
    setInputValue("")

    // Simulate AI typing
    setIsTyping(true)

    // Simulate AI response after a delay
    setTimeout(() => {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "This is a preview of how the AI would respond. The actual responses will come from your AI agent.",
          timestamp: new Date(),
        },
      ])
      setIsTyping(false)
    }, 1500)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="relative border rounded-lg p-8 bg-gray-100 h-[600px] flex items-center justify-center overflow-hidden">
      {/* Dark Backdrop (when chat is open) */}
      {isOpen && (
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm z-10 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Floating Input */}
      <div
        onClick={() => setIsOpen(true)}
        style={{
          position: "absolute",
          bottom: "24px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 15,
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 24px",
          backgroundColor: config.backgroundColor,
          border: `1px solid ${config.primaryColor}30`,
          borderRadius: "999px",
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.12)",
          cursor: "pointer",
          maxWidth: "90%",
          width: "400px",
        }}
      >
        <Search size={18} style={{ color: config.textColor, opacity: 0.6, flexShrink: 0 }} />
        <span style={{ color: config.textColor, opacity: 0.65, fontSize: "15px" }}>
          Ask {config.headerTitle} anything...
        </span>
      </div>

      {/* Chat Modal Window */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            bottom: "90px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "90%",
            maxWidth: `${config.widgetWidth}px`,
            height: `${config.widgetHeight}px`,
            maxHeight: "70vh",
            borderRadius: "20px",
            backgroundColor: config.backgroundColor,
            color: config.textColor,
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 20,
          }}
        >
          {/* Header */}
          <div
            style={{
              backgroundColor: config.secondaryColor,
              borderBottom: `1px solid ${config.primaryColor}20`,
              color: config.textColor,
              padding: "16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div className="flex items-center gap-3">
              {config.showAgentAvatar && (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center relative"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  <Bot size={18} color="white" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2" style={{ borderColor: config.backgroundColor }}></div>
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-bold text-sm">{config.headerTitle}</span>
                <span className="text-xs opacity-70">Online • AI Assistant</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="opacity-60 hover:opacity-100 transition-opacity">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-4"
            style={{
              backgroundColor: config.backgroundColor,
            }}
          >
            {messages.map((message, index) => (
              <div key={index} className={cn("flex gap-2", message.role === "user" ? "justify-end" : "justify-start")}>
                {message.role === "assistant" && config.showAgentAvatar && (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    <Bot size={16} color="white" />
                  </div>
                )}
                <div className="flex flex-col max-w-[70%]">
                  <div
                    className="p-3.5 shadow-sm"
                    style={{
                      backgroundColor: message.role === "user" ? config.primaryColor : config.secondaryColor,
                      color: message.role === "user" ? "white" : config.textColor,
                      borderRadius: `${config.borderRadius}px`,
                      border: message.role === "assistant" ? `1px solid ${config.primaryColor}20` : "none",
                    }}
                  >
                    {message.content}
                  </div>
                  {config.showTimestamp && (
                    <span className="text-xs opacity-60 mt-1" style={{ color: config.textColor }}>{formatTime(message.timestamp)}</span>
                  )}
                </div>
                {message.role === "user" && config.showAgentAvatar && (
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                    <User size={16} />
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && config.showTypingIndicator && (
              <div className="flex items-center gap-2">
                {config.showAgentAvatar && (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    <Bot size={16} color="white" />
                  </div>
                )}
                <div
                  className="p-3.5 shadow-sm"
                  style={{
                    backgroundColor: config.secondaryColor,
                    color: config.textColor,
                    borderRadius: `${config.borderRadius}px`,
                    border: `1px solid ${config.primaryColor}20`,
                  }}
                >
                  <div className="flex space-x-1.5">
                    <div
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ backgroundColor: `${config.primaryColor}60`, animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ backgroundColor: `${config.primaryColor}60`, animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ backgroundColor: `${config.primaryColor}60`, animationDelay: "300ms" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4">
            <div
              className="flex items-center gap-2 p-1.5 shadow-md"
              style={{
                backgroundColor: config.secondaryColor,
                border: `1px solid ${config.primaryColor}20`,
                borderRadius: `${config.borderRadius * 3}px`,
              }}
            >
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSendMessage()
                  }
                }}
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                style={{
                  color: config.textColor,
                }}
              />
              <Button
                onClick={handleSendMessage}
                size="icon"
                className="rounded-full h-10 w-10 shrink-0"
                style={{
                  backgroundColor: inputValue.trim() ? config.primaryColor : `${config.primaryColor}40`,
                  color: "white",
                }}
              >
                <Send size={16} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
