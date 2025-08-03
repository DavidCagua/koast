"use client"

import { useState, useRef, useEffect } from "react"
import { useChat } from '@ai-sdk/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Badge } from "~/components/ui/badge"
import { MessageCircle, X, Send, Bot, User, Sparkles } from "lucide-react"
import { cn } from "~/lib/utils"
import { api } from "~/trpc/react"
import { toast } from "sonner"

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const utils = api.useUtils()

  const { messages, sendMessage } = useChat()

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Check for sync triggers in messages
  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.role === 'assistant') {
      const syncTriggered = lastMessage.parts.some(part =>
        part.type === 'tool-syncCampaignData' &&
        typeof part === 'object' &&
        'success' in part &&
        part.success === true
      )

      if (syncTriggered) {
        // Invalidate campaign data cache to trigger UI update
        void utils.campaign.getLatest.invalidate()
        toast.success("Campaign data synced! Dashboard updated.")
      }
    }
  }, [messages, utils.campaign.getLatest])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    setIsLoading(true)
    void sendMessage({ text: input }).finally(() => setIsLoading(false))
    setInput('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (!input.trim() || isLoading) return
      setIsLoading(true)
      void sendMessage({ text: input }).finally(() => setIsLoading(false))
      setInput('')
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-8 w-8 rounded-full shadow-lg transition-all duration-300 hover:scale-105",
          isOpen
            ? "bg-destructive hover:bg-destructive/90 shadow-xl"
            : "bg-primary hover:bg-primary/90 shadow-xl"
        )}
      >
        {isOpen ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="absolute bottom-10 right-0 w-96 shadow-2xl border-0 animate-in slide-in-from-bottom-2 duration-300 p-2">
          <CardHeader className="">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Bot className="h-5 w-5 text-primary" />
                  {isLoading && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  )}
                </div>
                <CardTitle className="text-lg">Koast AI Assistant</CardTitle>
                <Sparkles className="h-4 w-4 text-yellow-500" />
              </div>
              <Badge variant="secondary" className="text-xs">
                {isLoading ? "Thinking..." : "Online"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 p-0">
            {/* Messages */}
            <div className="h-80 overflow-y-auto space-y-3 p-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <Bot className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="text-sm">Ask me about your campaigns, automation rules, or anything else!</p>
                </div>
              )}

              {messages.map(message => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-2 animate-in slide-in-from-bottom-1 duration-200",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <Bot className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                  )}
                  <div
                    className={cn(
                      "max-w-[85%] rounded-lg px-3 py-2 text-sm transition-all duration-200",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted shadow-sm hover:shadow-md"
                    )}
                  >
                    {message.parts.map((part, i) => {
                      switch (part.type) {
                        case 'text':
                          return (
                            <div key={`${message.id}-${i}`} className="prose prose-sm max-w-none">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  // Custom styling for markdown elements
                                  h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                                  h2: ({ children }) => <h2 className="text-base font-semibold mb-1">{children}</h2>,
                                  h3: ({ children }) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
                                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                                  ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                                  li: ({ children }) => <li className="text-sm">{children}</li>,
                                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                  em: ({ children }) => <em className="italic">{children}</em>,
                                  code: ({ children, className }) => {
                                    const isInline = !className
                                    return isInline ? (
                                      <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                                    ) : (
                                      <pre className="bg-muted p-2 rounded text-xs font-mono overflow-x-auto mb-2">
                                        <code>{children}</code>
                                      </pre>
                                    )
                                  },
                                  blockquote: ({ children }) => (
                                    <blockquote className="border-l-4 border-primary pl-2 italic text-muted-foreground mb-2">
                                      {children}
                                    </blockquote>
                                  ),
                                  table: ({ children }) => (
                                    <div className="overflow-x-auto mb-2">
                                      <table className="min-w-full text-xs border-collapse">
                                        {children}
                                      </table>
                                    </div>
                                  ),
                                  th: ({ children }) => (
                                    <th className="border border-border px-2 py-1 bg-muted font-semibold text-left">
                                      {children}
                                    </th>
                                  ),
                                  td: ({ children }) => (
                                    <td className="border border-border px-2 py-1">
                                      {children}
                                    </td>
                                  ),
                                }}
                              >
                                {part.text}
                              </ReactMarkdown>
                            </div>
                          )
                        case 'tool-getCampaignData':
                        case 'tool-getAutomationRules':
                        case 'tool-getActionLogs':
                        case 'tool-syncCampaignData':
                          return (
                            <div key={`${message.id}-${i}`} className="text-xs opacity-70">
                              <div className="font-semibold flex items-center gap-1">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                Tool Call: {part.type}
                              </div>
                              <pre className="mt-1 text-xs overflow-x-auto bg-muted p-2 rounded border">
                                {JSON.stringify(part, null, 2)}
                              </pre>
                            </div>
                          )
                        default:
                          return null
                      }
                    })}
                  </div>
                  {message.role === "user" && (
                    <User className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2 justify-start animate-in slide-in-from-bottom-1 duration-200">
                  <Bot className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                  <div className="bg-muted rounded-lg px-3 py-2 text-sm shadow-sm">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t bg-background p-4">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={input}
                  onChange={e => setInput(e.currentTarget.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about campaigns, automation rules..."
                  className="flex-1 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="h-10 w-10 transition-all duration-200 hover:scale-105 disabled:scale-100"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}