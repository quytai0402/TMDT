'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Send, Loader2 } from 'lucide-react'
import { useMessages } from '@/hooks/use-messages'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface MessagesPanelProps {
  conversationId: string
  otherUser: {
    id: string
    name: string
    image?: string
  }
}

export function MessagesPanel({ conversationId, otherUser }: MessagesPanelProps) {
  const { data: session } = useSession()
  const { messages, getMessages, sendMessage, loading } = useMessages(conversationId)
  const [newMessage, setNewMessage] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (conversationId) {
      getMessages(conversationId)
    }
  }, [conversationId, getMessages])

  useEffect(() => {
    // Auto scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim()) return

    try {
      await sendMessage(otherUser.id, newMessage.trim())
      setNewMessage('')
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={otherUser.image} />
            <AvatarFallback>{otherUser.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold">{otherUser.name}</div>
            <div className="text-sm text-muted-foreground font-normal">
              Trực tuyến
            </div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 p-0 flex flex-col">
        <ScrollArea ref={scrollRef} className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message: any) => {
              const isOwn = message.senderId === session?.user?.id
              
              return (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-3',
                    isOwn && 'flex-row-reverse'
                  )}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={isOwn ? (session?.user?.image || undefined) : otherUser.image} />
                    <AvatarFallback>
                      {isOwn ? session?.user?.name?.[0] : otherUser.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div
                    className={cn(
                      'flex flex-col gap-1 max-w-[70%]',
                      isOwn && 'items-end'
                    )}
                  >
                    <div
                      className={cn(
                        'rounded-lg px-4 py-2',
                        isOwn
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(message.createdAt), 'HH:mm', { locale: vi })}
                      {message.readAt && isOwn && ' • Đã xem'}
                    </span>
                  </div>
                </div>
              )
            })}
            
            {loading && (
              <div className="flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </ScrollArea>

        <form onSubmit={handleSend} className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Nhập tin nhắn..."
              disabled={loading}
            />
            <Button type="submit" size="icon" disabled={loading || !newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
