"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageCircle, Users, Clock, CheckCircle2, Send, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatConversation {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  lastMessage: string
  timestamp: Date
  status: "waiting" | "active" | "ended"
  unreadCount: number
  waitTime?: number // minutes
}

interface Message {
  id: string
  content: string
  sender: "user" | "admin"
  timestamp: Date
}

const mockConversations: ChatConversation[] = [
  {
    id: "1",
    userId: "user_1",
    userName: "Nguyễn Văn A",
    userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user1",
    lastMessage: "Cho tôi hỏi về giá phòng với",
    timestamp: new Date(Date.now() - 2 * 60000),
    status: "waiting",
    unreadCount: 2,
    waitTime: 2
  },
  {
    id: "2",
    userId: "user_2",
    userName: "Trần Thị B",
    userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user2",
    lastMessage: "Tôi muốn đổi ngày check-in",
    timestamp: new Date(Date.now() - 5 * 60000),
    status: "waiting",
    unreadCount: 1,
    waitTime: 5
  },
  {
    id: "3",
    userId: "user_3",
    userName: "Lê Văn C",
    userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user3",
    lastMessage: "Cảm ơn admin đã hỗ trợ!",
    timestamp: new Date(Date.now() - 10 * 60000),
    status: "ended",
    unreadCount: 0
  }
]

export function AdminLiveChat() {
  const [conversations, setConversations] = useState<ChatConversation[]>(mockConversations)
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Cho tôi hỏi về giá phòng với",
      sender: "user",
      timestamp: new Date(Date.now() - 2 * 60000)
    },
    {
      id: "2",
      content: "Phòng nào bạn quan tâm ạ?",
      sender: "user",
      timestamp: new Date(Date.now() - 1.5 * 60000)
    }
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isOnline, setIsOnline] = useState(true)

  const waitingChats = conversations.filter(c => c.status === "waiting")
  const activeChats = conversations.filter(c => c.status === "active")
  const endedChats = conversations.filter(c => c.status === "ended")

  const handleAcceptChat = (chatId: string) => {
    setConversations(conversations.map(c => 
      c.id === chatId ? { ...c, status: "active" as const } : c
    ))
    setSelectedChat(chatId)
  }

  const handleEndChat = (chatId: string) => {
    setConversations(conversations.map(c => 
      c.id === chatId ? { ...c, status: "ended" as const, unreadCount: 0 } : c
    ))
    
    // Auto select next waiting chat
    const nextWaiting = waitingChats.find(c => c.id !== chatId)
    if (nextWaiting) {
      setSelectedChat(nextWaiting.id)
      handleAcceptChat(nextWaiting.id)
    } else {
      setSelectedChat(null)
    }
  }

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !selectedChat) return

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: "admin",
      timestamp: new Date()
    }

    setMessages(prev => [...prev, newMessage])
    setInputMessage("")

    // Update last message in conversation
    setConversations(conversations.map(c => 
      c.id === selectedChat 
        ? { ...c, lastMessage: inputMessage, timestamp: new Date() }
        : c
    ))
  }

  const selectedConversation = conversations.find(c => c.id === selectedChat)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Live Chat Support</h2>
          <p className="text-muted-foreground">Quản lý cuộc trò chuyện với khách hàng</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-3 h-3 rounded-full",
              isOnline ? "bg-green-500 animate-pulse" : "bg-gray-400"
            )} />
            <span className="text-sm font-medium">
              {isOnline ? "Đang online" : "Offline"}
            </span>
          </div>
          <Button
            variant={isOnline ? "destructive" : "default"}
            onClick={() => setIsOnline(!isOnline)}
          >
            {isOnline ? "Tắt hỗ trợ" : "Bật hỗ trợ"}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Đang chờ</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{waitingChats.length}</div>
            <p className="text-xs text-muted-foreground">Khách đang chờ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Đang chat</CardTitle>
            <MessageCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeChats.length}</div>
            <p className="text-xs text-muted-foreground">Cuộc trò chuyện</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Đã xử lý</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{endedChats.length}</div>
            <p className="text-xs text-muted-foreground">Hôm nay</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Thời gian TB</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.5m</div>
            <p className="text-xs text-muted-foreground">Phản hồi đầu</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <div className="lg:col-span-1">
          <Tabs defaultValue="waiting" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="waiting" className="relative">
                Chờ
                {waitingChats.length > 0 && (
                  <Badge className="ml-1 bg-orange-500">{waitingChats.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="active">
                Đang chat
                {activeChats.length > 0 && (
                  <Badge className="ml-1">{activeChats.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="ended">Đã xong</TabsTrigger>
            </TabsList>

            <TabsContent value="waiting" className="space-y-2">
              {waitingChats.map((chat) => (
                <Card 
                  key={chat.id}
                  className={cn(
                    "cursor-pointer hover:shadow-md transition-shadow",
                    selectedChat === chat.id && "border-blue-500 border-2"
                  )}
                  onClick={() => handleAcceptChat(chat.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarImage src={chat.userAvatar} />
                        <AvatarFallback>{chat.userName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-sm">{chat.userName}</h4>
                          <Badge variant="outline" className="text-orange-600">
                            <Clock className="h-3 w-3 mr-1" />
                            {chat.waitTime}m
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {chat.lastMessage}
                        </p>
                        <Button size="sm" className="w-full mt-2">
                          Chấp nhận chat
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {waitingChats.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Không có khách chờ</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="active" className="space-y-2">
              {activeChats.map((chat) => (
                <Card 
                  key={chat.id}
                  className={cn(
                    "cursor-pointer hover:shadow-md transition-shadow",
                    selectedChat === chat.id && "border-blue-500 border-2"
                  )}
                  onClick={() => setSelectedChat(chat.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarImage src={chat.userAvatar} />
                        <AvatarFallback>{chat.userName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm mb-1">{chat.userName}</h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {chat.lastMessage}
                        </p>
                      </div>
                      {chat.unreadCount > 0 && (
                        <Badge className="bg-blue-500">{chat.unreadCount}</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {activeChats.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Chưa có cuộc chat</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="ended" className="space-y-2">
              {endedChats.map((chat) => (
                <Card key={chat.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarImage src={chat.userAvatar} />
                        <AvatarFallback>{chat.userName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm mb-1">{chat.userName}</h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {chat.lastMessage}
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          <CheckCircle2 className="h-3 w-3 inline mr-1" />
                          Đã hoàn thành
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* Chat Window */}
        <div className="lg:col-span-2">
          {selectedConversation ? (
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={selectedConversation.userAvatar} />
                      <AvatarFallback>{selectedConversation.userName[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{selectedConversation.userName}</CardTitle>
                      <CardDescription className="text-xs">
                        {selectedConversation.status === "waiting" ? "Đang chờ" : "Đang online"}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleEndChat(selectedConversation.id)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Kết thúc
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-2",
                      message.sender === "admin" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.sender !== "admin" && (
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={selectedConversation.userAvatar} />
                        <AvatarFallback>{selectedConversation.userName[0]}</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "max-w-[70%] rounded-lg px-4 py-2",
                        message.sender === "admin"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-900"
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
                  </div>
                ))}
              </CardContent>

              <div className="border-t p-4">
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
            </Card>
          ) : (
            <Card className="h-[600px] flex items-center justify-center">
              <div className="text-center">
                <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Chọn một cuộc trò chuyện</h3>
                <p className="text-sm text-muted-foreground">
                  Chấp nhận khách đang chờ hoặc chọn cuộc chat đang hoạt động
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
