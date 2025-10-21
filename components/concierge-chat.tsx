"use client"

import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Send, 
  Bot, 
  User, 
  Loader2,
  Paperclip,
  Smile,
  MapPin,
  Utensils,
  Car,
  Star,
  Clock,
  Phone
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  type: "user" | "bot" | "system"
  content: string
  timestamp: Date
  suggestions?: string[]
  recommendations?: any[]
}

export function ConciergeChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "system",
      content: "Concierge 24/7 đã kết nối",
      timestamp: new Date(),
    },
    {
      id: "2",
      type: "bot",
      content: "Xin chào! Tôi là trợ lý ảo của LuxeStay. Tôi có thể giúp bạn với:\n\n• Đề xuất nhà hàng & điểm tham quan\n• Đặt xe và vận chuyển\n• Thông tin du lịch địa phương\n• Xử lý yêu cầu đặc biệt\n\nBạn cần tôi hỗ trợ điều gì?",
      timestamp: new Date(),
      suggestions: [
        "Gợi ý nhà hàng gần đây",
        "Đặt xe ra sân bay",
        "Địa điểm tham quan hot",
        "Thuê xe máy",
      ],
    },
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages([...messages, userMessage])
    setInput("")
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const botResponse = generateBotResponse(input)
      setMessages(prev => [...prev, botResponse])
      setIsTyping(false)
    }, 1500)
  }

  const generateBotResponse = (query: string): Message => {
    const lowerQuery = query.toLowerCase()

    // Restaurant recommendations
    if (lowerQuery.includes("nhà hàng") || lowerQuery.includes("ăn")) {
      return {
        id: Date.now().toString(),
        type: "bot",
        content: "Tôi tìm thấy những nhà hàng tuyệt vời gần bạn:",
        timestamp: new Date(),
        recommendations: [
          {
            id: "1",
            type: "restaurant",
            name: "Nhà Hàng Hải Sản Biển Đông",
            rating: 4.8,
            distance: "0.5 km",
            cuisine: "Hải sản",
            price: "200,000 - 500,000₫",
            image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400",
          },
          {
            id: "2",
            type: "restaurant",
            name: "BBQ Garden Đà Lạt",
            rating: 4.6,
            distance: "0.8 km",
            cuisine: "BBQ, Nướng",
            price: "150,000 - 400,000₫",
            image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400",
          },
        ],
        suggestions: ["Đặt bàn ngay", "Xem thêm nhà hàng", "Gọi cho tôi taxi"],
      }
    }

    // Transportation
    if (lowerQuery.includes("xe") || lowerQuery.includes("sân bay") || lowerQuery.includes("taxi")) {
      return {
        id: Date.now().toString(),
        type: "bot",
        content: "Tôi có thể sắp xếp dịch vụ vận chuyển cho bạn:",
        timestamp: new Date(),
        recommendations: [
          {
            id: "1",
            type: "transport",
            name: "Đưa đón sân bay",
            price: "500,000₫",
            duration: "45 phút",
            vehicle: "Sedan 4 chỗ",
            icon: Car,
          },
          {
            id: "2",
            type: "transport",
            name: "Thuê xe tự lái",
            price: "800,000₫/ngày",
            duration: "Theo ngày",
            vehicle: "Toyota Vios",
            icon: Car,
          },
        ],
        suggestions: ["Đặt xe ngay", "Xem thêm phương tiện", "Gọi hotline"],
      }
    }

    // Attractions
    if (lowerQuery.includes("tham quan") || lowerQuery.includes("du lịch") || lowerQuery.includes("đi chơi")) {
      return {
        id: Date.now().toString(),
        type: "bot",
        content: "Những địa điểm HOT bạn không nên bỏ lỡ:",
        timestamp: new Date(),
        recommendations: [
          {
            id: "1",
            type: "attraction",
            name: "Hồ Xuân Hương",
            rating: 4.7,
            distance: "2 km",
            category: "Thiên nhiên",
            hours: "6:00 - 22:00",
            image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
          },
          {
            id: "2",
            type: "attraction",
            name: "Vườn Hoa Đà Lạt",
            rating: 4.5,
            distance: "3 km",
            category: "Công viên",
            hours: "7:00 - 18:00",
            image: "https://images.unsplash.com/photo-1464746133101-a2c3f88e0dd9?w=400",
          },
        ],
        suggestions: ["Đặt tour", "Xem bản đồ", "Lưu vào lịch trình"],
      }
    }

    // Default response
    return {
      id: Date.now().toString(),
      type: "bot",
      content: "Tôi có thể giúp bạn với:\n\n• Gợi ý nhà hàng & quán ăn\n• Đặt xe và tour du lịch\n• Thông tin địa điểm tham quan\n• Dịch vụ đặc biệt khác\n\nVui lòng cho tôi biết cụ thể hơn bạn cần gì nhé!",
      timestamp: new Date(),
      suggestions: [
        "Nhà hàng gần đây",
        "Đặt xe sân bay",
        "Địa điểm hot",
        "Thuê xe",
      ],
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
    handleSend()
  }

  return (
    <Card className="flex flex-col h-[600px] shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/10 to-blue-500/10">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Avatar className="w-10 h-10">
              <AvatarImage src="https://api.dicebear.com/7.x/bottts/svg?seed=concierge" />
              <AvatarFallback><Bot /></AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
          </div>
          <div>
            <h3 className="font-semibold">Concierge 24/7</h3>
            <p className="text-xs text-muted-foreground flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse" />
              Đang online
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm">
          <Phone className="w-4 h-4 mr-2" />
          Gọi hotline
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map(message => (
            <div key={message.id}>
              {message.type === "system" && (
                <div className="text-center">
                  <Badge variant="outline" className="text-xs">
                    {message.content}
                  </Badge>
                </div>
              )}

              {message.type === "bot" && (
                <div className="flex items-start space-x-3">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="bg-primary/10">
                      <Bot className="w-4 h-4 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                      <p className="text-sm whitespace-pre-line">{message.content}</p>
                    </div>

                    {/* Recommendations */}
                    {message.recommendations && (
                      <div className="space-y-2">
                        {message.recommendations.map(rec => (
                          <Card key={rec.id} className="p-3 hover:shadow-md transition-shadow cursor-pointer">
                            {rec.type === "restaurant" && (
                              <div className="flex items-start space-x-3">
                                <img
                                  src={rec.image}
                                  alt={rec.name}
                                  className="w-20 h-20 rounded-lg object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-sm mb-1">{rec.name}</h4>
                                  <div className="flex items-center space-x-2 text-xs text-muted-foreground mb-1">
                                    <div className="flex items-center">
                                      <Star className="w-3 h-3 fill-yellow-500 text-yellow-500 mr-1" />
                                      <span>{rec.rating}</span>
                                    </div>
                                    <span>•</span>
                                    <div className="flex items-center">
                                      <MapPin className="w-3 h-3 mr-1" />
                                      <span>{rec.distance}</span>
                                    </div>
                                  </div>
                                  <p className="text-xs text-muted-foreground">{rec.cuisine}</p>
                                  <p className="text-xs font-medium mt-1">{rec.price}</p>
                                </div>
                                <Button size="sm" variant="outline">Đặt bàn</Button>
                              </div>
                            )}

                            {rec.type === "transport" && (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                                    <Car className="w-5 h-5 text-blue-600" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-sm">{rec.name}</h4>
                                    <p className="text-xs text-muted-foreground">{rec.vehicle}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-sm text-primary">{rec.price}</p>
                                  <p className="text-xs text-muted-foreground">{rec.duration}</p>
                                </div>
                              </div>
                            )}

                            {rec.type === "attraction" && (
                              <div className="flex items-start space-x-3">
                                <img
                                  src={rec.image}
                                  alt={rec.name}
                                  className="w-20 h-20 rounded-lg object-cover"
                                />
                                <div className="flex-1">
                                  <h4 className="font-semibold text-sm mb-1">{rec.name}</h4>
                                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                    <div className="flex items-center">
                                      <Star className="w-3 h-3 fill-yellow-500 text-yellow-500 mr-1" />
                                      <span>{rec.rating}</span>
                                    </div>
                                    <span>•</span>
                                    <span>{rec.distance}</span>
                                    <span>•</span>
                                    <span>{rec.category}</span>
                                  </div>
                                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {rec.hours}
                                  </div>
                                </div>
                              </div>
                            )}
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* Suggestions */}
                    {message.suggestions && (
                      <div className="flex flex-wrap gap-2">
                        {message.suggestions.map((suggestion, idx) => (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="text-xs"
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      {message.timestamp.toLocaleTimeString("vi-VN", { 
                        hour: "2-digit", 
                        minute: "2-digit" 
                      })}
                    </p>
                  </div>
                </div>
              )}

              {message.type === "user" && (
                <div className="flex items-start space-x-3 justify-end">
                  <div className="flex-1 flex flex-col items-end space-y-1">
                    <div className="bg-primary text-primary-foreground rounded-lg p-3 max-w-[80%]">
                      <p className="text-sm">{message.content}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {message.timestamp.toLocaleTimeString("vi-VN", { 
                        hour: "2-digit", 
                        minute: "2-digit" 
                      })}
                    </p>
                  </div>
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex items-start space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary/10">
                  <Bot className="w-4 h-4 text-primary" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-lg p-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Paperclip className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Smile className="w-4 h-4" />
          </Button>
          <Input
            placeholder="Nhập tin nhắn..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={!input.trim() || isTyping}>
            {isTyping ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  )
}
