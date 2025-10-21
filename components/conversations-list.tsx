'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useMessages } from '@/hooks/use-messages'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface ConversationsListProps {
  selectedId?: string
  onSelect: (conversationId: string, otherUser: any) => void
}

export function ConversationsList({ selectedId, onSelect }: ConversationsListProps) {
  const { conversations, getConversations, loading } = useMessages()

  useEffect(() => {
    getConversations()
  }, [getConversations])

  if (loading && conversations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tin nhắn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tin nhắn</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>Chưa có tin nhắn nào</p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conversation: any) => {
                const otherUser = conversation.participants.find(
                  (p: any) => p.id !== conversation.currentUserId
                )
                const lastMessage = conversation.messages[0]
                const unreadCount = conversation.unreadCount || 0

                return (
                  <button
                    key={conversation.id}
                    onClick={() => onSelect(conversation.id, otherUser)}
                    className={cn(
                      'w-full p-4 flex gap-3 hover:bg-muted transition-colors text-left',
                      selectedId === conversation.id && 'bg-muted'
                    )}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={otherUser?.image} />
                      <AvatarFallback>{otherUser?.name?.[0]}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold truncate">
                          {otherUser?.name}
                        </h3>
                        {lastMessage && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(lastMessage.createdAt), 'HH:mm', { locale: vi })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <p className={cn(
                          'text-sm truncate',
                          unreadCount > 0 ? 'font-semibold text-foreground' : 'text-muted-foreground'
                        )}>
                          {lastMessage?.content || 'Bắt đầu cuộc trò chuyện'}
                        </p>
                        {unreadCount > 0 && (
                          <Badge variant="default" className="rounded-full h-5 w-5 p-0 flex items-center justify-center text-xs">
                            {unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
