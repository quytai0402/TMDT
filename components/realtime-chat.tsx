'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Send, Loader2 } from 'lucide-react'
import { pusherClient } from '@/lib/pusher'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

interface Message {
  id: string
  content: string
  createdAt: string
  senderId: string
  sender: {
    id: string
    name: string
    image?: string | null
  }
}

interface RealtimeChatProps {
  listingId: string
  hostId: string
  hostName: string
  hostImage?: string | null
}

export function RealtimeChat({ listingId, hostId, hostName, hostImage }: RealtimeChatProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!session?.user) return

    // Fetch existing messages
    async function fetchMessages() {
      try {
        const res = await fetch(`/api/messages?userId=${hostId}`)
        const data = await res.json()
        // Ensure data is an array
        setMessages(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Error fetching messages:', error)
        setMessages([])
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()

    // Subscribe to Pusher for real-time messages
    if (pusherClient) {
      const channel = pusherClient.subscribe(`user-${session.user.id}`)
      
      channel.bind('new-message', (data: { message: Message }) => {
        if (data.message.senderId === hostId) {
          setMessages(prev => [...prev, data.message])
        }
      })

      return () => {
        channel.unbind_all()
        channel.unsubscribe()
      }
    }
  }, [session?.user, hostId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !session?.user) return

    setSending(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: hostId,
          content: newMessage,
          listingId,
        }),
      })

      const message = await res.json()
      setMessages(prev => [...prev, message])
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  if (!session?.user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Liên hệ chủ nhà</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Đăng nhập để nhắn tin với chủ nhà</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={hostImage || ''} alt={hostName} />
            <AvatarFallback>{hostName.charAt(0)}</AvatarFallback>
          </Avatar>
          <span>Nhắn tin với {hostName}</span>
          {pusherClient && (
            <span className="ml-auto flex items-center gap-2 text-sm text-green-600">
              <span className="h-2 w-2 bg-green-600 rounded-full animate-pulse" />
              Trực tuyến
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            <div className="h-96 overflow-y-auto mb-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
                </div>
              ) : (
                messages.map(message => {
                  const isOwn = message.senderId === session.user.id
                  return (
                    <div
                      key={message.id}
                      className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={message.sender.image || ''}
                          alt={message.sender.name}
                        />
                        <AvatarFallback>
                          {message.sender.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`flex-1 ${isOwn ? 'text-right' : ''}`}>
                        <div
                          className={`inline-block p-3 rounded-lg max-w-[80%] ${
                            isOwn
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          {message.content}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {format(new Date(message.createdAt), 'HH:mm', {
                            locale: vi,
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Nhập tin nhắn..."
                disabled={sending}
              />
              <Button type="submit" disabled={sending || !newMessage.trim()}>
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </>
        )}
      </CardContent>
    </Card>
  )
}
