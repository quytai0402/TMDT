"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { MessageCircle, X, Send, Minimize2, Maximize2, Clock, User, Bot } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { useConciergeContext } from "@/components/concierge-context-provider"
import { useSession } from "next-auth/react"

const SESSION_STORAGE_KEY = "luxestay_live_chat_session"
const POLL_INTERVAL_MS = 4000

type LiveChatStatus = "WAITING" | "CONNECTED" | "ENDED"

interface ApiMessage {
  id: string
  content: string
  sender: "user" | "admin" | "system"
  createdAt: string
  metadata?: Record<string, unknown> | null
}

interface ApiSession {
  id: string
  status: LiveChatStatus
  queuePosition: number | null
  metadata?: Record<string, unknown> | null
  createdAt: string
  connectedAt?: string | null
  endedAt?: string | null
  messages: ApiMessage[]
}

interface Message {
  id: string
  content: string
  sender: "user" | "admin" | "bot"
  timestamp: Date
  senderName?: string
  senderAvatar?: string
}

interface ChatSessionState {
  id: string
  status: LiveChatStatus
  queuePosition: number | null
  adminName?: string | null
  adminAvatar?: string | null
  connectedAt?: Date | null
  endedAt?: Date | null
}

function parseSession(api: ApiSession): ChatSessionState {
  const metadata = api.metadata ?? {}
  const adminName = typeof metadata?.["lastAssignedAdminName"] === "string" ? (metadata["lastAssignedAdminName"] as string) : null
  const adminAvatar =
    typeof metadata?.["lastAssignedAdminAvatar"] === "string" ? (metadata["lastAssignedAdminAvatar"] as string) : null

  return {
    id: api.id,
    status: api.status,
    queuePosition: api.queuePosition ?? null,
    adminName,
    adminAvatar,
    connectedAt: api.connectedAt ? new Date(api.connectedAt) : null,
    endedAt: api.endedAt ? new Date(api.endedAt) : null,
  }
}

function mapApiMessage(message: ApiMessage, session: ChatSessionState | null): Message {
  const baseTimestamp = new Date(message.createdAt)
  const metadata = (message.metadata ?? {}) as Record<string, unknown>

  if (message.sender === "system") {
    return {
      id: message.id,
      content: message.content,
      sender: "bot",
      timestamp: baseTimestamp,
    }
  }

  if (message.sender === "admin") {
    const metaName =
      (typeof metadata["senderName"] === "string" ? (metadata["senderName"] as string) : undefined) ||
      session?.adminName ||
      "Chuyên viên LuxeStay"
    const metaAvatar =
      typeof metadata["senderAvatar"] === "string"
        ? (metadata["senderAvatar"] as string)
        : session?.adminAvatar ?? undefined

    return {
      id: message.id,
      content: message.content,
      sender: "admin",
      timestamp: baseTimestamp,
      senderName: metaName,
      senderAvatar: metaAvatar,
    }
  }

  return {
    id: message.id,
    content: message.content,
    sender: "user",
    timestamp: baseTimestamp,
  }
}

export function LiveChatWidget() {
  const { data: session } = useSession()
  const membershipTier = session?.user?.membership ?? null
  const isDiamondMember = membershipTier === "DIAMOND"
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [chatSession, setChatSession] = useState<ChatSessionState | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const { context: conciergeContext } = useConciergeContext()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const sessionIdRef = useRef<string | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const isOpenRef = useRef<boolean>(false)
  const isMinimizedRef = useRef<boolean>(false)
  const contextMessageKeyRef = useRef<string | null>(null)

  const scrollToBottom = useCallback(() => {
    if (isMinimizedRef.current) {
      return
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    isOpenRef.current = isOpen
    if (isOpen) {
      setUnreadCount(0)
    }
  }, [isOpen])

  useEffect(() => {
    isMinimizedRef.current = isMinimized
  }, [isMinimized])

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  const updateFromApi = useCallback(
    (apiSession: ApiSession) => {
      const parsedSession = parseSession(apiSession)
      setChatSession(parsedSession)

      const parsedMessages = apiSession.messages.map((msg) => mapApiMessage(msg, parsedSession))

      setMessages((prev) => {
        const existingIds = new Set(prev.map((msg) => msg.id))
        let added = 0
        const merged = [...prev]

        for (const message of parsedMessages) {
          if (!existingIds.has(message.id)) {
            merged.push(message)
            existingIds.add(message.id)
            added += 1
          }
        }

        if (added > 0) {
          merged.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
          if ((!isOpenRef.current || isMinimizedRef.current) && parsedSession.status !== "ENDED") {
            setUnreadCount((prevCount) => prevCount + added)
          }
        }

        return merged
      })

      setError(null)
    },
    [],
  )

  const fetchSession = useCallback(async () => {
    const sessionId = sessionIdRef.current
    if (!sessionId) return

    try {
      const response = await fetch(`/api/live-chat/sessions/${sessionId}`, {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      })

      if (response.status === 404) {
        sessionIdRef.current = null
        localStorage.removeItem(SESSION_STORAGE_KEY)
        stopPolling()
        setChatSession((prev) =>
          prev
            ? {
                ...prev,
                status: "ENDED",
                endedAt: new Date(),
              }
            : null,
        )
        return
      }

      if (!response.ok) {
        throw new Error("Failed to fetch session")
      }

      const data: ApiSession = await response.json()
      updateFromApi(data)
    } catch (err) {
      console.error("Failed to sync live chat session:", err)
      setError("Không thể đồng bộ cuộc trò chuyện. Vui lòng thử lại.")
    }
  }, [stopPolling, updateFromApi])

  const startPolling = useCallback(() => {
    if (pollingRef.current) return
    pollingRef.current = setInterval(() => {
      fetchSession()
    }, POLL_INTERVAL_MS)
  }, [fetchSession])

  const createSession = useCallback(async () => {
    if (sessionIdRef.current) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/live-chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(
          conciergeContext
            ? {
                metadata: {
                  conciergeContext,
                },
              }
            : {},
        ),
      })

      if (!response.ok) {
        throw new Error("Failed to create session")
      }

      const data: ApiSession = await response.json()
      sessionIdRef.current = data.id
      localStorage.setItem(SESSION_STORAGE_KEY, data.id)
      updateFromApi(data)
      startPolling()
    } catch (err) {
      console.error("Failed to create live chat session:", err)
      setError("Không thể khởi tạo cuộc trò chuyện. Vui lòng thử lại sau.")
    } finally {
      setLoading(false)
    }
  }, [conciergeContext, startPolling, updateFromApi])

  useEffect(() => {
    if (!isDiamondMember || typeof window === "undefined") return

    const storedSessionId = window.localStorage.getItem(SESSION_STORAGE_KEY)
    if (storedSessionId) {
      sessionIdRef.current = storedSessionId
      fetchSession()
      startPolling()
    }

    return () => {
      stopPolling()
    }
  }, [fetchSession, isDiamondMember, startPolling, stopPolling])

  useEffect(() => {
    if (!isDiamondMember) return
    if (isOpen && !sessionIdRef.current && !loading) {
      createSession()
    }
  }, [createSession, isDiamondMember, isOpen, loading])

  useEffect(() => {
    if (!isDiamondMember || !isOpen) return

    if (!conciergeContext) {
      contextMessageKeyRef.current = null
      return
    }

    const { updatedAt, ...rest } = conciergeContext
    const contextKey = JSON.stringify(rest)

    if (contextMessageKeyRef.current === contextKey) {
      return
    }

    const params = new URLSearchParams()

    if (conciergeContext.source === 'listing' && conciergeContext.listingId) {
      params.set('listingId', conciergeContext.listingId)
    } else if (conciergeContext.source === 'booking' && conciergeContext.bookingId) {
      params.set('bookingId', conciergeContext.bookingId)
    }

    params.set('includeLatestBooking', 'true')

    const controller = new AbortController()

    fetch(`/api/concierge/context?${params.toString()}`, {
      cache: 'no-store',
      credentials: 'include',
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) return null
        return (await res.json()) as { introMessage?: string }
      })
      .then((data) => {
        if (!data?.introMessage) return

        const introMessage = data.introMessage

        setMessages((prev) => {
          const exists = prev.some((message) => message.sender === 'bot' && message.content === introMessage)
          if (exists) return prev
          return [
            ...prev,
            {
              id: `context-${Date.now()}`,
              content: introMessage,
              sender: 'bot',
              timestamp: new Date(),
            },
          ]
        })

        contextMessageKeyRef.current = contextKey
      })
      .catch((error) => {
        if (error.name === 'AbortError') return
        console.warn('Unable to fetch concierge intro message:', error)
      })

    return () => controller.abort()
  }, [conciergeContext, isDiamondMember, isOpen])

  if (!isDiamondMember) {
    return null
  }

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || loading) return

    if (!sessionIdRef.current) {
      await createSession()
    }

    const sessionId = sessionIdRef.current
    if (!sessionId) return

    const content = inputMessage.trim()
    setInputMessage("")

    try {
      const response = await fetch(`/api/live-chat/sessions/${sessionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || "Failed to send message"
        console.error("Failed to send message:", errorMessage)
        throw new Error(errorMessage)
      }

      const message: ApiMessage = await response.json()
      const parsedMessage = mapApiMessage(message, chatSession)

      setMessages((prev) => {
        const merged = [...prev, parsedMessage]
        merged.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        return merged
      })

      setError(null)
      scrollToBottom()
      fetchSession()
    } catch (err) {
      console.error("Failed to send live chat message:", err)
      const errorMsg = err instanceof Error ? err.message : "Không thể gửi tin nhắn"
      setError(errorMsg + ". Vui lòng thử lại.")
      // Re-add the message back to input so user doesn't lose it
      setInputMessage(content)
    }
  }, [chatSession, createSession, fetchSession, inputMessage, loading, scrollToBottom])

  const handleEndChat = useCallback(async () => {
    const sessionId = sessionIdRef.current

    try {
      if (sessionId) {
        await fetch(`/api/live-chat/sessions/${sessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: "ENDED" as LiveChatStatus }),
        })
      }
    } catch (err) {
      console.error("Failed to end live chat session:", err)
    } finally {
      stopPolling()
      sessionIdRef.current = null
      localStorage.removeItem(SESSION_STORAGE_KEY)
      setChatSession((prev) =>
        prev
          ? {
              ...prev,
              status: "ENDED",
              endedAt: new Date(),
            }
          : null,
      )
    }
  }, [stopPolling])

  const adminDisplayName = chatSession?.adminName ?? "Chuyên viên LuxeStay"

  const isEnded = chatSession?.status === "ENDED"
  const isWaiting = chatSession?.status === "WAITING"

  const headerDescription = (() => {
    if (isEnded) {
      return "Cuộc trò chuyện đã kết thúc"
    }
    if (chatSession?.status === "CONNECTED") {
      return "Đang online"
    }
    if (isWaiting && chatSession?.queuePosition) {
      return `Vị trí: #${chatSession.queuePosition} trong hàng chờ`
    }
    return "Sẵn sàng hỗ trợ 24/7"
  })()

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 group"
        >
          <MessageCircle className="h-7 w-7" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center p-0">
              {unreadCount}
            </Badge>
          )}
          <div className="absolute -top-2 right-16 bg-gray-900 text-white px-3 py-1 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Cần hỗ trợ?
          </div>
        </button>
      )}

      {isOpen && (
        <Card
          className={cn(
            "fixed bottom-6 right-6 z-50 shadow-2xl transition-all flex flex-col",
            isMinimized ? "w-80 h-16 overflow-hidden" : "w-96 h-[600px]",
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              {chatSession?.status === "CONNECTED" ? (
                <>
                  <Avatar className="w-8 h-8 border-2 border-white">
                    <AvatarImage src={chatSession.adminAvatar ?? undefined} />
                    <AvatarFallback>{adminDisplayName[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-sm font-semibold">{adminDisplayName}</CardTitle>
                    <CardDescription className="text-xs text-blue-100 flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      {headerDescription}
                    </CardDescription>
                  </div>
                </>
              ) : isWaiting ? (
                <>
                  <Clock className="h-8 w-8" />
                  <div>
                    <CardTitle className="text-sm font-semibold">Đang chờ...</CardTitle>
                    <CardDescription className="text-xs text-blue-100">
                      {chatSession?.queuePosition
                        ? `Vị trí: #${chatSession.queuePosition} trong hàng chờ`
                        : "Kết nối tới admin trong giây lát"}
                    </CardDescription>
                  </div>
                </>
              ) : (
                <>
                  <Bot className="h-8 w-8" />
                  <div>
                    <CardTitle className="text-sm font-semibold">Trợ lý LuxeStay</CardTitle>
                    <CardDescription className="text-xs text-blue-100">{headerDescription}</CardDescription>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized((prev) => !prev)}
                className="h-8 w-8 p-0 hover:bg-white/20"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsOpen(false)
                  setIsMinimized(false)
                }}
                className="h-8 w-8 p-0 hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          {!isMinimized && (
            <>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 h-[440px]">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn("flex gap-2", message.sender === "user" ? "justify-end" : "justify-start")}
                  >
                    {message.sender !== "user" && (
                      <Avatar className="w-8 h-8">
                        {message.sender === "admin" ? (
                          <>
                            {message.senderAvatar ? <AvatarImage src={message.senderAvatar} /> : null}
                            <AvatarFallback>{(message.senderName ?? adminDisplayName)[0]}</AvatarFallback>
                          </>
                        ) : (
                          <AvatarFallback className="bg-purple-100">
                            <Bot className="h-4 w-4 text-purple-600" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "max-w-[70%] rounded-lg px-4 py-2",
                        message.sender === "user"
                          ? "bg-blue-600 text-white"
                          : message.sender === "admin"
                          ? "bg-gray-100 text-gray-900"
                          : "bg-purple-50 text-purple-900 border border-purple-200",
                      )}
                    >
                      <p className="text-sm whitespace-pre-line">{message.content}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {message.timestamp.toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {message.sender === "user" && (
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-blue-100">
                          <User className="h-4 w-4 text-blue-600" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </CardContent>

              <div className="border-t p-4 space-y-2">
                {isEnded ? (
                  <p className="text-xs text-center text-muted-foreground">
                    Cuộc trò chuyện đã kết thúc. Bạn có thể đóng cửa sổ hoặc bắt đầu cuộc trò chuyện mới.
                  </p>
                ) : chatSession?.status === "CONNECTED" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEndChat}
                    className="w-full text-xs"
                    disabled={loading}
                  >
                    Kết thúc cuộc trò chuyện
                  </Button>
                ) : null}

                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    placeholder={
                      isEnded ? "Cuộc trò chuyện đã kết thúc" : loading ? "Đang khởi tạo..." : "Nhập tin nhắn..."
                    }
                    className="flex-1"
                    disabled={isEnded || loading}
                  />
                  <Button onClick={handleSendMessage} size="icon" disabled={isEnded || loading}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      )}
    </>
  )
}
