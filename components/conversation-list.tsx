'use client'

import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { CheckCircle2 } from 'lucide-react'

interface Conversation {
  id: string
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
  lastMessage: string
  lastMessageAt: Date
  unreadCount: number
}

interface ConversationListProps {
  conversations: Conversation[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Chưa có tin nhắn nào</p>
        <p className="text-sm text-muted-foreground mt-2">
          Tin nhắn của bạn với chủ nhà sẽ hiển thị ở đây
        </p>
      </Card>
    )
  }

  return (
    <Card className="h-full overflow-y-auto">
      <div className="divide-y">
        {conversations.map((conversation) => {
          const isSelected = conversation.id === selectedId
          const hasUnread = conversation.unreadCount > 0

          return (
            <button
              key={conversation.id}
              onClick={() => onSelect(conversation.id)}
              className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                isSelected ? 'bg-muted' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <Avatar className="h-12 w-12 flex-shrink-0">
                  <AvatarImage
                    src={conversation.otherParticipant.image || '/placeholder.svg'}
                    alt={conversation.otherParticipant.name}
                  />
                  <AvatarFallback>
                    {conversation.otherParticipant.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Name and time */}
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className={`font-medium truncate ${hasUnread ? 'font-bold' : ''}`}>
                        {conversation.otherParticipant.name}
                      </span>
                      {conversation.otherParticipant.isVerified && (
                        <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      )}
                      {conversation.otherParticipant.role === 'host' && (
                        <Badge variant="secondary" className="text-xs">
                          Chủ nhà
                        </Badge>
                      )}
                    </div>
                    {conversation.lastMessageAt && (
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(conversation.lastMessageAt), {
                          addSuffix: false,
                          locale: vi,
                        })}
                      </span>
                    )}
                  </div>

                  {/* Listing title if exists */}
                  {conversation.listing && (
                    <p className="text-xs text-muted-foreground truncate mb-1">
                      {conversation.listing.title}
                    </p>
                  )}

                  {/* Last message */}
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-sm truncate ${
                        hasUnread ? 'font-semibold text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {conversation.lastMessage || 'Bắt đầu cuộc trò chuyện'}
                    </p>
                    {hasUnread && (
                      <Badge variant="default" className="h-5 px-2 text-xs">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </Card>
  )
}
