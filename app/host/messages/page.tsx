"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Loader2, MessageSquare, Sparkles } from "lucide-react"
import { useSession } from "next-auth/react"

import { HostLayout } from "@/components/host-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ConversationsList } from "@/components/conversations-list"
import { MessageThread } from "@/components/message-thread"
import { useMessages } from "@/hooks/use-messages"
import { pusherClient } from "@/lib/pusher"

type Participant = {
  id: string
  name: string
  image?: string | null
  role?: string | null
  isVerified?: boolean | null
}

export default function HostMessagesPage() {
  const { data: session } = useSession()
  const { conversations, getConversations, loading } = useMessages()
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null)

  useEffect(() => {
    void getConversations()
  }, [getConversations])

  // Subscribe to real-time updates for new conversations
  useEffect(() => {
    if (!session?.user?.id) return

    const channelName = `user-${session.user.id}`
    const channel = pusherClient.subscribe(channelName)
    
    channel.bind('new-conversation-message', () => {
      // Refresh conversations when new message arrives
      getConversations()
    })

    return () => {
      channel.unbind_all()
      pusherClient.unsubscribe(channelName)
    }
  }, [session?.user?.id, getConversations])

  const firstAvailableConversation = useMemo(() => {
    if (!conversations.length) return null
    return conversations[0]
  }, [conversations])

  useEffect(() => {
    if (!loading && !selectedConversationId && firstAvailableConversation) {
      const other = firstAvailableConversation.otherParticipant || firstAvailableConversation.participants?.find(
        (participant: Participant) => participant.id !== session?.user?.id,
      )
      setSelectedConversationId(firstAvailableConversation.id)
      setSelectedParticipant(
        other ?? {
          id: "guest",
          name: "Khách",
        },
      )
    }
  }, [loading, firstAvailableConversation, selectedConversationId, session?.user?.id])

  const handleSelectConversation = (conversationId: string, otherUser: Participant) => {
    setSelectedConversationId(conversationId)
    setSelectedParticipant(otherUser)
  }

  return (
    <HostLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tin nhắn</h1>
            <p className="text-muted-foreground mt-2">Quản lý và phản hồi hội thoại với khách theo thời gian thực.</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/host/automation">
              <Sparkles className="mr-2 h-4 w-4" />
              Thiết lập tin nhắn tự động
            </Link>
          </Button>
        </div>

        <div className="grid h-[640px] gap-4 md:grid-cols-[360px_1fr]">
          <Card className="flex flex-col overflow-hidden">
            <CardContent className="p-0">
              <ConversationsList
                selectedId={selectedConversationId ?? undefined}
                onSelect={handleSelectConversation}
                conversations={conversations}
                loading={loading}
              />
            </CardContent>
          </Card>

          <Card className="flex flex-col overflow-hidden">
            <CardContent className="h-full p-0">
              {selectedConversationId && selectedParticipant ? (
                <MessageThread
                  conversationId={selectedConversationId}
                  otherParticipant={{
                    id: selectedParticipant.id,
                    name: selectedParticipant.name,
                    image: selectedParticipant.image ?? "",
                    role: selectedParticipant.role ?? "guest",
                    isVerified: Boolean(selectedParticipant.isVerified),
                  }}
                  onBack={() => {
                    setSelectedConversationId(null)
                    setSelectedParticipant(null)
                  }}
                />
              ) : loading ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Đang tải hội thoại...</span>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
                  <MessageSquare className="h-8 w-8" />
                  <p className="text-sm">Chọn một hội thoại để bắt đầu trò chuyện.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </HostLayout>
  )
}
