'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Send, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { pusherClient } from '@/lib/pusher'
import { useToast } from '@/components/ui/use-toast'

interface Message {
  id: string
  content: string
  senderId: string
  createdAt: Date
  isRead: boolean
  sender: {
    id: string
    name: string
    image: string
    isVerified: boolean
    role: string
  }
}

interface MessageThreadProps {
  conversationId: string
  otherParticipant: {
    id: string
    name: string
    image: string
    isVerified: boolean
    role: string
  }
  listing?: {
    id: string
    title: string
    images: string[]
  }
  onBack?: () => void
}

export function MessageThread({
  conversationId,
  otherParticipant,
  listing,
  onBack,
}: MessageThreadProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Fetch messages
  useEffect(() => {
    if (conversationId) {
      fetchMessages()
    }
  }, [conversationId])

  // Subscribe to Pusher for realtime messages
  useEffect(() => {
    if (!conversationId) return

    const channel = pusherClient.subscribe(`conversation-${conversationId}`)
    
    channel.bind('new-message', (data: { message: Message }) => {
      setMessages((prev) => {
        // Check if message already exists to avoid duplicates
        if (prev.some((m) => m.id === data.message.id)) {
          return prev
        }
        return [...prev, data.message]
      })
      
      // Scroll to bottom when new message arrives
      setTimeout(scrollToBottom, 100)
    })

    return () => {
      channel.unbind_all()
      pusherClient.unsubscribe(`conversation-${conversationId}`)
    }
  }, [conversationId])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/conversations/${conversationId}/messages`)
      const data = await response.json()
      
      if (response.ok) {
        setMessages(data.messages)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast({
        variant: 'destructive',
        title: 'Không thể tải tin nhắn',
        description: 'Vui lòng thử tải lại cuộc trò chuyện.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return

    try {
      setSending(true)
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage.trim(),
          messageType: 'TEXT',
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessages((prev) => [...prev, data.message])
        setNewMessage('')
        setTimeout(scrollToBottom, 100)
        toast({
          title: 'Đã gửi tin nhắn',
          description: 'Tin nhắn của bạn đã được chuyển tới đối tác.',
        })
      } else {
        const message = data.error || 'Không thể gửi tin nhắn'
        toast({
          variant: 'destructive',
          title: 'Gửi tin nhắn thất bại',
          description: message,
        })
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        variant: 'destructive',
        title: 'Gửi tin nhắn thất bại',
        description: 'Kiểm tra kết nối và thử lại.',
      })
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const messageDate = new Date(date)
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return formatDistanceToNow(messageDate, {
        addSuffix: true,
        locale: vi,
      })
    } else {
      return messageDate.toLocaleDateString('vi-VN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    }
  }

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center gap-3">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}

        <Avatar className="h-10 w-10">
          <AvatarImage
            src={otherParticipant.image || '/placeholder.svg'}
            alt={otherParticipant.name}
          />
          <AvatarFallback>
            {otherParticipant.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <h2 className="font-semibold truncate">{otherParticipant.name}</h2>
            {otherParticipant.isVerified && (
              <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
            )}
            {otherParticipant.role === 'host' && (
              <Badge variant="secondary" className="text-xs">
                Chủ nhà
              </Badge>
            )}
          </div>
          {listing && (
            <p className="text-xs text-muted-foreground truncate">
              {listing.title}
            </p>
          )}
        </div>
      </div>

      {/* Listing Card (if exists) */}
      {listing && (
        <div className="p-4 border-b bg-muted/20">
          <div className="flex items-center gap-3">
            {listing.images && listing.images.length > 0 && (
              <img
                src={listing.images[0]}
                alt={listing.title}
                className="w-16 h-16 object-cover rounded-lg"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{listing.title}</p>
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto text-xs"
                asChild
              >
                <a href={`/listing/${listing.id}`} target="_blank">
                  Xem chi tiết →
                </a>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-3/4" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-center">
              Chưa có tin nhắn nào<br />
              <span className="text-sm">Gửi tin nhắn đầu tiên của bạn!</span>
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isOwn = message.senderId === session?.user?.id
              const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId

              return (
                <div
                  key={`${message.id}-${index}`}
                  className={`flex gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  {!isOwn && showAvatar && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage
                        src={message.sender.image || '/placeholder.svg'}
                        alt={message.sender.name}
                      />
                      <AvatarFallback>
                        {message.sender.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  {!isOwn && !showAvatar && <div className="w-8 flex-shrink-0" />}

                  <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        isOwn
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">
                      {formatTimestamp(message.createdAt)}
                    </span>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nhập tin nhắn..."
            className="min-h-[60px] max-h-[120px] resize-none"
            disabled={sending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            size="icon"
            className="h-[60px] w-[60px]"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
