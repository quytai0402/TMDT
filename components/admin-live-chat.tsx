"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { MessageCircle, Users, Clock, CheckCircle2, Send, X, Loader2 } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { cn } from "@/lib/utils"

type LiveChatStatus = "WAITING" | "CONNECTED" | "ENDED"

interface ApiMessage {
  id: string
  sender: "user" | "admin" | "system"
  content: string
  createdAt: string
  metadata?: Record<string, unknown> | null
}

interface ApiSession {
  id: string
  userId?: string | null
  userName?: string | null
  userEmail?: string | null
  status: LiveChatStatus
  queuePosition: number | null
  createdAt: string
  connectedAt?: string | null
  endedAt?: string | null
  metadata?: Record<string, unknown> | null
  messages: ApiMessage[]
}

interface AdminSessionSummary {
  waiting: number
  connected: number
  ended: number
}

interface ConversationItem {
  id: string
  userName: string
  userEmail?: string | null
  status: LiveChatStatus
  queuePosition: number | null
  lastMessage: string
  lastTimestamp: Date
  createdAt: Date
  connectedAt?: Date | null
  endedAt?: Date | null
}

interface Message {
  id: string
  content: string
  sender: "user" | "admin" | "bot"
  timestamp: Date
  senderName?: string
  senderAvatar?: string
}

interface SessionState {
  id: string
  status: LiveChatStatus
  queuePosition: number | null
  userName: string
  userEmail?: string | null
  adminName?: string | null
  adminAvatar?: string | null
  createdAt: Date
  connectedAt?: Date | null
  endedAt?: Date | null
}

const STATUS_TABS: Array<{ label: string; value: "all" | LiveChatStatus }> = [
  { label: "Tất cả", value: "all" },
  { label: "Đang chờ", value: "WAITING" },
  { label: "Đang xử lý", value: "CONNECTED" },
  { label: "Đã kết thúc", value: "ENDED" },
]

const POLL_INTERVAL_MS = 5000

function mapMessage(message: ApiMessage, session: SessionState | null): Message {
  const timestamp = new Date(message.createdAt)
  const metadata = (message.metadata ?? {}) as Record<string, unknown>

  if (message.sender === "system") {
    return {
      id: message.id,
      content: message.content,
      sender: "bot",
      timestamp,
    }
  }

  if (message.sender === "admin") {
    const senderName =
      (typeof metadata["senderName"] === "string" ? (metadata["senderName"] as string) : undefined) ||
      session?.adminName ||
      "Bạn"
    const senderAvatar =
      typeof metadata["senderAvatar"] === "string"
        ? (metadata["senderAvatar"] as string)
        : session?.adminAvatar ?? undefined

    return {
      id: message.id,
      content: message.content,
      sender: "admin",
      timestamp,
      senderName,
      senderAvatar,
    }
  }

  const guestName =
    (typeof metadata["senderName"] === "string" ? (metadata["senderName"] as string) : undefined) || session?.userName

  return {
    id: message.id,
    content: message.content,
    sender: "user",
    timestamp,
    senderName: guestName,
  }
}

function buildSessionState(apiSession: ApiSession): SessionState {
  const metadata = (apiSession.metadata ?? {}) as Record<string, unknown>
  const adminName =
    typeof metadata["lastAssignedAdminName"] === "string"
      ? (metadata["lastAssignedAdminName"] as string)
      : null
  const adminAvatar =
    typeof metadata["lastAssignedAdminAvatar"] === "string"
      ? (metadata["lastAssignedAdminAvatar"] as string)
      : null

  return {
    id: apiSession.id,
    status: apiSession.status,
    queuePosition: apiSession.queuePosition ?? null,
    userName: apiSession.userName || "Khách LuxeStay",
    userEmail: apiSession.userEmail ?? undefined,
    adminName,
    adminAvatar,
    createdAt: new Date(apiSession.createdAt),
    connectedAt: apiSession.connectedAt ? new Date(apiSession.connectedAt) : null,
    endedAt: apiSession.endedAt ? new Date(apiSession.endedAt) : null,
  }
}

export function AdminLiveChat() {
  const [sessions, setSessions] = useState<ApiSession[]>([])
  const [summary, setSummary] = useState<AdminSessionSummary>({ waiting: 0, connected: 0, ended: 0 })
  const [statusFilter, setStatusFilter] = useState<"all" | LiveChatStatus>("WAITING")
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [selectedSession, setSelectedSession] = useState<SessionState | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)

  const pollRef = useRef<NodeJS.Timeout | null>(null)

  const fetchSessions = useCallback(async () => {
    setLoadingSessions(true)
    try {
      const res = await fetch("/api/admin/live-chat/sessions", { cache: "no-store" })
      if (res.status === 403) {
        throw new Error("Bạn không có quyền truy cập module chat.")
      }
      if (!res.ok) {
        throw new Error("Không thể tải danh sách chat.")
      }
      const data: { sessions: ApiSession[]; summary: Record<string, number> } = await res.json()

      setSessions(data.sessions)
      setSummary({
        waiting: data.summary.WAITING ?? 0,
        connected: data.summary.CONNECTED ?? 0,
        ended: data.summary.ENDED ?? 0,
      })
      setError(null)
    } catch (err: any) {
      console.error("Failed to load live chat sessions:", err)
      setError(err.message || "Đã xảy ra lỗi khi tải danh sách chat.")
    } finally {
      setLoadingSessions(false)
    }
  }, [])

  const fetchMessages = useCallback(
    async (sessionId: string) => {
      setLoadingMessages(true)
      try {
        const res = await fetch(`/api/live-chat/sessions/${sessionId}`, { cache: "no-store" })
        if (!res.ok) {
          throw new Error("Không thể tải tin nhắn.")
        }
        const data: ApiSession = await res.json()
        const state = buildSessionState(data)
        const parsedMessages = data.messages.map((msg) => mapMessage(msg, state))
        parsedMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

        setSelectedSession(state)
        setMessages(parsedMessages)
        setActionError(null)
      } catch (err: any) {
        console.error("Failed to load session messages:", err)
        setActionError(err.message || "Không thể tải tin nhắn.")
      } finally {
        setLoadingMessages(false)
      }
    },
    [],
  )

  useEffect(() => {
    fetchSessions()
    const interval = setInterval(fetchSessions, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchSessions])

  useEffect(() => {
    if (!selectedSessionId) {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
      return
    }

    fetchMessages(selectedSessionId)
    if (pollRef.current) {
      clearInterval(pollRef.current)
    }

    pollRef.current = setInterval(() => {
      fetchMessages(selectedSessionId)
    }, 3000)

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [fetchMessages, selectedSessionId])

  const conversations = useMemo<ConversationItem[]>(() => {
    return sessions.map((session) => {
      const state = buildSessionState(session)
      const lastMessage = session.messages.at(-1)
      return {
        id: session.id,
        userName: state.userName,
        userEmail: state.userEmail,
        status: state.status,
        queuePosition: state.queuePosition,
        lastMessage: lastMessage ? lastMessage.content : "Chưa có tin nhắn",
        lastTimestamp: lastMessage ? new Date(lastMessage.createdAt) : state.createdAt,
        createdAt: state.createdAt,
        connectedAt: state.connectedAt,
        endedAt: state.endedAt,
      }
    })
  }, [sessions])

  const filteredConversations = useMemo(() => {
    if (statusFilter === "all") return conversations
    return conversations.filter((conversation) => conversation.status === statusFilter)
  }, [conversations, statusFilter])

  const waitingCount = summary.waiting
  const activeCount = summary.connected
  const endedCount = summary.ended

  const handleSelectConversation = useCallback(
    (conversationId: string) => {
      setSelectedSessionId(conversationId)
    },
    [],
  )

  const handleAcceptChat = useCallback(async () => {
    if (!selectedSessionId) return
    try {
      const res = await fetch(`/api/admin/live-chat/sessions/${selectedSessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "connect" }),
      })
      if (!res.ok) {
        throw new Error("Không thể kết nối với khách.")
      }
      await fetchSessions()
      await fetchMessages(selectedSessionId)
    } catch (err: any) {
      setActionError(err.message || "Không thể kết nối với khách.")
    }
  }, [fetchMessages, fetchSessions, selectedSessionId])

  const handleEndChat = useCallback(async () => {
    if (!selectedSessionId) return
    try {
      const res = await fetch(`/api/admin/live-chat/sessions/${selectedSessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "end" }),
      })
      if (!res.ok) {
        throw new Error("Không thể kết thúc cuộc trò chuyện.")
      }
      await fetchSessions()
      await fetchMessages(selectedSessionId)
    } catch (err: any) {
      setActionError(err.message || "Không thể kết thúc cuộc trò chuyện.")
    }
  }, [fetchMessages, fetchSessions, selectedSessionId])

  const handleSendMessage = useCallback(async () => {
    if (!selectedSessionId || !inputMessage.trim()) return

    const content = inputMessage.trim()
    setInputMessage("")

    try {
      const res = await fetch(`/api/live-chat/sessions/${selectedSessionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })

      if (!res.ok) {
        throw new Error("Không thể gửi tin nhắn.")
      }

      await fetchMessages(selectedSessionId)
      setActionError(null)
    } catch (err: any) {
      console.error("Failed to send admin message:", err)
      setActionError(err.message || "Không thể gửi tin nhắn.")
    }
  }, [fetchMessages, inputMessage, selectedSessionId])

  const selectedConversation = useMemo(() => {
    if (!selectedSessionId) return null
    return conversations.find((conversation) => conversation.id === selectedSessionId) ?? null
  }, [conversations, selectedSessionId])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Live Chat Support</h2>
          <p className="text-muted-foreground">Quản lý cuộc trò chuyện với khách hàng theo thời gian thực</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className={cn("w-3 h-3 rounded-full", isOnline ? "bg-green-500 animate-pulse" : "bg-gray-400")}
            />
            <span className="text-sm font-medium">{isOnline ? "Đang online" : "Offline"}</span>
          </div>
          <Button variant={isOnline ? "destructive" : "default"} onClick={() => setIsOnline((prev) => !prev)}>
            {isOnline ? "Tắt hỗ trợ" : "Bật hỗ trợ"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Đang chờ</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{waitingCount}</div>
            <p className="text-xs text-muted-foreground">Khách đang chờ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Đang chat</CardTitle>
            <MessageCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground">Cuộc trò chuyện</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Đã xử lý</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{endedCount}</div>
            <p className="text-xs text-muted-foreground">Ngày hôm nay</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Khách đang phục vụ</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount + waitingCount}</div>
            <p className="text-xs text-muted-foreground">Bao gồm đang chờ</p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-5">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Danh sách cuộc trò chuyện</CardTitle>
            <CardDescription>Chọn một khách để xem chi tiết và trả lời</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
              <TabsList className="grid grid-cols-4">
                {STATUS_TABS.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value={statusFilter} className="mt-0">
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {loadingSessions ? (
                    <div className="text-center text-sm text-muted-foreground py-12">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Đang tải danh sách...</span>
                      </div>
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-12">Chưa có cuộc trò chuyện nào.</div>
                  ) : (
                    filteredConversations.map((conversation) => (
                      <button
                        type="button"
                        key={conversation.id}
                        onClick={() => handleSelectConversation(conversation.id)}
                        className={cn(
                          "w-full rounded-lg border px-4 py-3 text-left transition hover:bg-muted",
                          selectedSessionId === conversation.id ? "border-blue-500 bg-blue-50/60" : "border-transparent",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{conversation.userName}</p>
                            {conversation.userEmail ? (
                              <p className="text-xs text-muted-foreground">{conversation.userEmail}</p>
                            ) : null}
                          </div>
                          <Badge
                            variant={
                              conversation.status === "WAITING"
                                ? "secondary"
                                : conversation.status === "CONNECTED"
                                ? "default"
                                : "outline"
                            }
                          >
                            {conversation.status === "WAITING"
                              ? "Đang chờ"
                              : conversation.status === "CONNECTED"
                              ? "Đang chat"
                              : "Đã kết thúc"}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{conversation.lastMessage}</p>
                        <div className="mt-2 text-xs text-muted-foreground flex items-center justify-between">
                          <span>
                            {conversation.lastTimestamp.toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {conversation.queuePosition ? (
                            <span>Hàng chờ #{conversation.queuePosition}</span>
                          ) : null}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Chi tiết cuộc trò chuyện</CardTitle>
                <CardDescription>
                  {selectedSession
                    ? selectedSession.userName
                    : "Chọn một cuộc trò chuyện để xem và trả lời khách hàng"}
                </CardDescription>
              </div>
              {selectedSession && (
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      selectedSession.status === "WAITING"
                        ? "secondary"
                        : selectedSession.status === "CONNECTED"
                        ? "default"
                        : "outline"
                    }
                  >
                    {selectedSession.status === "WAITING"
                      ? "Đang chờ"
                      : selectedSession.status === "CONNECTED"
                      ? "Đang chat"
                      : "Đã kết thúc"}
                  </Badge>
                  {selectedSession.queuePosition ? (
                    <Badge variant="outline">Hàng chờ #{selectedSession.queuePosition}</Badge>
                  ) : null}
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col">
            {selectedSessionId ? (
              <>
                {actionError && (
                  <Alert variant="destructive" className="mb-3">
                    <AlertDescription>{actionError}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2 mb-4">
                  {selectedSession?.status === "WAITING" && (
                    <Button onClick={handleAcceptChat} disabled={loadingMessages || !isOnline}>
                      Nhận chat
                    </Button>
                  )}
                  {selectedSession?.status !== "ENDED" && (
                    <Button variant="outline" onClick={handleEndChat} disabled={loadingMessages}>
                      Kết thúc
                    </Button>
                  )}
                </div>

                <div className="flex-1 border rounded-lg p-4 space-y-4 max-h-[420px] overflow-y-auto">
                  {loadingMessages ? (
                    <div className="text-center text-sm text-muted-foreground py-12">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Đang tải tin nhắn...</span>
                      </div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-12">
                      Chưa có tin nhắn nào trong cuộc trò chuyện này.
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-2",
                          message.sender === "admin" ? "justify-end text-right" : "justify-start text-left",
                        )}
                      >
                        {message.sender !== "admin" && (
                          <Avatar className="w-8 h-8">
                            <AvatarFallback>
                              {message.sender === "bot"
                                ? "AI"
                                : (message.senderName ?? selectedSession?.userName ?? "K")[0]}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={cn(
                            "max-w-[70%] rounded-lg px-4 py-2",
                            message.sender === "admin"
                              ? "bg-blue-600 text-white ml-auto"
                              : message.sender === "bot"
                              ? "bg-purple-50 text-purple-900 border border-purple-200"
                              : "bg-muted",
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
                        {message.sender === "admin" && (
                          <Avatar className="w-8 h-8">
                            {selectedSession?.adminAvatar ? (
                              <AvatarImage src={selectedSession.adminAvatar} />
                            ) : null}
                            <AvatarFallback>{(selectedSession?.adminName ?? "Bạn")[0]}</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  <Input
                    placeholder="Nhập tin nhắn..."
                    value={inputMessage}
                    onChange={(event) => setInputMessage(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    disabled={!selectedSession || selectedSession.status === "ENDED"}
                  />
                  <Button onClick={handleSendMessage} disabled={!selectedSession || selectedSession.status === "ENDED"}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-muted-foreground text-sm gap-4">
                <MessageCircle className="h-10 w-10 text-muted-foreground/60" />
                <p>Chọn một cuộc trò chuyện ở danh sách bên trái để bắt đầu hỗ trợ khách.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
