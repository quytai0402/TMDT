"use client"

import { useState } from "react"
import { HostLayout } from "@/components/host-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Send, MoreVertical, Star, Clock } from "lucide-react"

const conversations = [
  {
    id: 1,
    guest: "Nguyễn Văn A",
    avatar: null,
    lastMessage: "Cho em hỏi chỗ nghỉ có gần bãi biển không ạ?",
    time: "5 phút trước",
    unread: 2,
    status: "active"
  },
  {
    id: 2,
    guest: "Trần Thị B",
    avatar: null,
    lastMessage: "Em đã thanh toán xong rồi ạ",
    time: "1 giờ trước",
    unread: 0,
    status: "active"
  },
  {
    id: 3,
    guest: "Lê Minh C",
    avatar: null,
    lastMessage: "Cảm ơn chủ nhà rất nhiều!",
    time: "Hôm qua",
    unread: 0,
    status: "archived"
  }
]

export default function HostMessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState(conversations[0])
  const [message, setMessage] = useState("")

  return (
    <HostLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Tin nhắn</h1>
          <p className="text-muted-foreground mt-2">
            Quản lý và trả lời tin nhắn từ khách hàng
          </p>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="grid md:grid-cols-[350px_1fr] h-[600px]">
              {/* Conversations List */}
              <div className="border-r">
                <div className="p-4 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Tìm kiếm tin nhắn..." className="pl-9" />
                  </div>
                </div>

                <Tabs defaultValue="active" className="w-full">
                  <TabsList className="w-full rounded-none border-b px-4">
                    <TabsTrigger value="active" className="flex-1">
                      Hoạt động ({conversations.filter(c => c.status === "active").length})
                    </TabsTrigger>
                    <TabsTrigger value="archived" className="flex-1">
                      Lưu trữ
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="active" className="mt-0">
                    <div className="divide-y">
                      {conversations.filter(c => c.status === "active").map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => setSelectedConversation(conv)}
                          className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                            selectedConversation.id === conv.id ? "bg-muted" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Avatar>
                              <AvatarImage src={conv.avatar || undefined} />
                              <AvatarFallback className="bg-gradient-to-br from-primary to-pink-500 text-white">
                                {conv.guest.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-medium truncate">{conv.guest}</p>
                                {conv.unread > 0 && (
                                  <Badge variant="default" className="ml-2">
                                    {conv.unread}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {conv.lastMessage}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {conv.time}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="archived" className="mt-0">
                    <div className="divide-y">
                      {conversations.filter(c => c.status === "archived").map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => setSelectedConversation(conv)}
                          className="w-full p-4 text-left hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <Avatar>
                              <AvatarFallback>{conv.guest.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium">{conv.guest}</p>
                              <p className="text-sm text-muted-foreground">{conv.lastMessage}</p>
                              <p className="text-xs text-muted-foreground mt-1">{conv.time}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Chat Area */}
              <div className="flex flex-col">
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-gradient-to-br from-primary to-pink-500 text-white">
                        {selectedConversation.guest.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedConversation.guest}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Hoạt động {selectedConversation.time}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-pink-500 text-white text-xs">
                        {selectedConversation.guest.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-muted rounded-lg p-3 max-w-md">
                        <p className="text-sm">{selectedConversation.lastMessage}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{selectedConversation.time}</p>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end">
                    <div className="flex-1 flex flex-col items-end">
                      <div className="bg-primary text-primary-foreground rounded-lg p-3 max-w-md">
                        <p className="text-sm">Dạ chào anh/chị! Chỗ nghỉ của em cách biển chỉ 100m thôi ạ. Đi bộ 2 phút là tới bãi biển rồi ạ.</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">2 phút trước</p>
                    </div>
                  </div>
                </div>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nhập tin nhắn..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          setMessage("")
                        }
                      }}
                    />
                    <Button onClick={() => setMessage("")}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </HostLayout>
  )
}
