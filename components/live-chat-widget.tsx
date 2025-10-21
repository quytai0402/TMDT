"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageCircle, X, Send, Minimize2, Maximize2, Clock, User, Bot, Users } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  content: string
  sender: "user" | "admin" | "bot"
  timestamp: Date
  senderName?: string
  senderAvatar?: string
}

interface ChatSession {
  id: string
  adminName?: string
  adminAvatar?: string
  startTime: Date
  status: "waiting" | "connected" | "ended"
  queuePosition?: number
}

export function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [chatSession, setChatSession] = useState<ChatSession | null>(null)
  const [adminOnline, setAdminOnline] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Simulate admin online status (replace with real WebSocket connection)
  useEffect(() => {
    const checkAdminStatus = setInterval(() => {
      const isOnline = Math.random() > 0.5 // Simulate 50% chance admin is online
      setAdminOnline(isOnline)
    }, 10000)

    return () => clearInterval(checkAdminStatus)
  }, [])

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Simulate initial greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setTimeout(() => {
        if (adminOnline && !chatSession) {
          setMessages([{
            id: "1",
            content: "Xin chào! Bạn đang trong hàng chờ. Vui lòng đợi một admin sẽ kết nối với bạn...",
            sender: "bot",
            timestamp: new Date()
          }])
          setChatSession({
            id: "session_" + Date.now(),
            status: "waiting",
            queuePosition: Math.floor(Math.random() * 5) + 1,
            startTime: new Date()
          })
          
          // Simulate admin connection after 3 seconds
          setTimeout(() => {
            const adminNames = ["Minh Anh", "Hương Giang", "Tuấn Anh", "Mai Linh"]
            const randomAdmin = adminNames[Math.floor(Math.random() * adminNames.length)]
            
            setChatSession(prev => prev ? {
              ...prev,
              status: "connected",
              adminName: randomAdmin,
              adminAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomAdmin}`
            } : null)
            
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              content: `Xin chào! Mình là ${randomAdmin}. Mình có thể giúp gì cho bạn?`,
              sender: "admin",
              senderName: randomAdmin,
              timestamp: new Date()
            }])
          }, 3000)
        } else {
          setMessages([{
            id: "1",
            content: "Xin chào! Tôi là trợ lý ảo của Homestay Booking. Hiện tại không có admin trực tuyến, nhưng tôi có thể giúp bạn!",
            sender: "bot",
            timestamp: new Date()
          }])
        }
      }, 500)
    }
  }, [isOpen, adminOnline])

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: "user",
      timestamp: new Date()
    }

    setMessages(prev => [...prev, newMessage])
    setInputMessage("")

    // Simulate response
    setTimeout(() => {
      const responseMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: generateResponse(inputMessage),
        sender: chatSession?.status === "connected" ? "admin" : "bot",
        senderName: chatSession?.adminName,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, responseMessage])
      
      if (!isOpen) {
        setUnreadCount(prev => prev + 1)
      }
    }, 1000 + Math.random() * 2000)
  }

  const generateResponse = (message: string) => {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes("giá") || lowerMessage.includes("phí")) {
      return "Giá phòng tùy thuộc vào ngày bạn đặt. Bạn có thể xem giá cụ thể trên trang listing. Cần tôi tìm phòng phù hợp với ngân sách của bạn không?"
    }
    if (lowerMessage.includes("đặt") || lowerMessage.includes("book")) {
      return "Để đặt phòng, bạn chọn phòng bạn thích, chọn ngày check-in/check-out, sau đó nhấn nút 'Đặt phòng'. Cần hỗ trợ gì thêm không?"
    }
    if (lowerMessage.includes("hủy") || lowerMessage.includes("cancel")) {
      return "Chính sách hủy phòng tùy thuộc vào từng host. Bạn có thể xem chi tiết trên trang đặt phòng. Cần tôi kiểm tra đơn đặt phòng của bạn không?"
    }
    if (lowerMessage.includes("thanh toán") || lowerMessage.includes("payment")) {
      return "Chúng tôi chấp nhận thanh toán qua thẻ tín dụng, ví điện tử, và chuyển khoản ngân hàng. Bạn gặp vấn đề gì với thanh toán không?"
    }
    
    return "Cảm ơn bạn đã liên hệ! Tôi đã ghi nhận yêu cầu của bạn. Còn gì tôi có thể giúp không?"
  }

  const handleEndChat = () => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      content: "Cảm ơn bạn đã sử dụng dịch vụ hỗ trợ. Cuộc trò chuyện đã kết thúc.",
      sender: "bot",
      timestamp: new Date()
    }])
    
    setTimeout(() => {
      setChatSession(null)
      setMessages([])
      setIsOpen(false)
    }, 2000)
  }

  const handleToggleChat = () => {
    setIsOpen(!isOpen)
    setIsMinimized(false)
    if (!isOpen) {
      setUnreadCount(0)
    }
  }

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={handleToggleChat}
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

      {/* Chat Window */}
      {isOpen && (
        <Card className={cn(
          "fixed bottom-6 right-6 z-50 shadow-2xl transition-all",
          isMinimized ? "w-80 h-16" : "w-96 h-[600px]"
        )}>
          {/* Header */}
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              {chatSession?.status === "connected" ? (
                <>
                  <Avatar className="w-8 h-8 border-2 border-white">
                    <AvatarImage src={chatSession.adminAvatar} />
                    <AvatarFallback>{chatSession.adminName?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-sm font-semibold">{chatSession.adminName}</CardTitle>
                    <CardDescription className="text-xs text-blue-100 flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      Đang online
                    </CardDescription>
                  </div>
                </>
              ) : chatSession?.status === "waiting" ? (
                <>
                  <Clock className="h-8 w-8" />
                  <div>
                    <CardTitle className="text-sm font-semibold">Đang chờ...</CardTitle>
                    <CardDescription className="text-xs text-blue-100">
                      Vị trí: #{chatSession.queuePosition} trong hàng chờ
                    </CardDescription>
                  </div>
                </>
              ) : (
                <>
                  <Bot className="h-8 w-8" />
                  <div>
                    <CardTitle className="text-sm font-semibold">Trợ lý ảo</CardTitle>
                    <CardDescription className="text-xs text-blue-100">
                      Sẵn sàng hỗ trợ 24/7
                    </CardDescription>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 w-8 p-0 hover:bg-white/20"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleChat}
                className="h-8 w-8 p-0 hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          {!isMinimized && (
            <>
              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 h-[440px]">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-2",
                      message.sender === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.sender !== "user" && (
                      <Avatar className="w-8 h-8">
                        {message.sender === "admin" ? (
                          <>
                            <AvatarImage src={chatSession?.adminAvatar} />
                            <AvatarFallback>{message.senderName?.[0]}</AvatarFallback>
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
                          : "bg-purple-50 text-purple-900 border border-purple-200"
                      )}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {message.timestamp.toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit"
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

              {/* Input */}
              <div className="border-t p-4">
                {chatSession?.status === "connected" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEndChat}
                    className="w-full mb-2 text-xs"
                  >
                    Kết thúc cuộc trò chuyện
                  </Button>
                )}
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} size="icon">
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
