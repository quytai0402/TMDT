'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ConversationList } from '@/components/conversation-list'
import { MessageThread } from '@/components/message-thread'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

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

export default function MessagesPage() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const conversationIdParam = searchParams.get('conversation')
  const participantParam = searchParams.get('participant')
  const listingParam = searchParams.get('listing')
  const { toast } = useToast()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    conversationIdParam
  )
  const [loading, setLoading] = useState(true)
  const [showSidebar, setShowSidebar] = useState(true)
  const [isEnsuringConversation, setIsEnsuringConversation] = useState(false)

  // Fetch conversations
  useEffect(() => {
    if (status === 'authenticated') {
      fetchConversations()
    }
  }, [status])

  useEffect(() => {
    if (status !== 'authenticated') return
    if (!participantParam || isEnsuringConversation) return

    const ensureConversation = async () => {
      try {
        setIsEnsuringConversation(true)
        const response = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participantId: participantParam,
            listingId: listingParam ?? undefined,
          }),
        })

        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'Không thể mở cuộc trò chuyện')
        }

        const conversationId = data.conversation?.id
        if (conversationId) {
          setSelectedConversationId(conversationId)
          await fetchConversations()
        }
      } catch (error) {
        console.error('ensureConversation error:', error)
        toast({
          variant: 'destructive',
          title: 'Không thể bắt đầu trò chuyện',
          description: 'Vui lòng thử lại sau.',
        })
      } finally {
        setIsEnsuringConversation(false)
      }
    }

    ensureConversation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, participantParam, listingParam])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/conversations', { cache: 'no-store' })
      const data = await response.json()
      
      if (response.ok) {
        setConversations(data.conversations)
        
        if (!selectedConversationId && data.conversations.length > 0) {
          setSelectedConversationId(data.conversations[0].id)
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Không thể tải tin nhắn',
          description: data.error || 'Vui lòng thử lại sau.',
        })
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
      toast({
        variant: 'destructive',
        title: 'Không thể tải tin nhắn',
        description: 'Kiểm tra kết nối và thử lại.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId)
    // On mobile, hide sidebar when conversation selected
    if (window.innerWidth < 768) {
      setShowSidebar(false)
    }
  }

  const handleBackToList = () => {
    setShowSidebar(true)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
          <Card className="p-4 md:col-span-1">
            <Skeleton className="h-12 w-full mb-4" />
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 w-full mb-2" />
            ))}
          </Card>
          <Card className="p-4 md:col-span-2">
            <Skeleton className="h-full w-full" />
          </Card>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Đăng nhập để xem tin nhắn</h1>
          <p className="text-muted-foreground">
            Bạn cần đăng nhập để truy cập tin nhắn của mình.
          </p>
        </Card>
      </div>
    )
  }

  const selectedConversation = conversations.find(
    (c) => c.id === selectedConversationId
  )

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gradient-to-b from-slate-100 via-white to-white py-8">
      <div className="container mx-auto px-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Tin nhắn</h1>
            <p className="text-muted-foreground text-sm">Trao đổi trực tiếp với khách và chủ nhà để chốt booking nhanh chóng.</p>
          </div>
          <Button variant="outline" className="hidden md:inline-flex" onClick={fetchConversations}>
            Làm mới hộp thư
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-220px)]">
          <div className={`${showSidebar ? 'block' : 'hidden'} md:block md:col-span-1 transition-all` }>
            <ConversationList
              conversations={conversations}
              selectedId={selectedConversationId}
              onSelect={handleSelectConversation}
            />
          </div>

          <div className={`${!showSidebar ? 'block' : 'hidden'} md:block md:col-span-2 transition-all`}>
            {selectedConversation ? (
              <MessageThread
                conversationId={selectedConversation.id}
                otherParticipant={selectedConversation.otherParticipant}
                listing={selectedConversation.listing}
                onBack={handleBackToList}
              />
            ) : (
              <Card className="h-full flex items-center justify-center border-dashed">
                <div className="text-center text-muted-foreground space-y-2">
                  <Sparkles className="mx-auto h-6 w-6" />
                  <p className="text-lg font-medium">Chọn một cuộc trò chuyện để bắt đầu</p>
                  <p className="text-sm">Tin nhắn mới nhất sẽ hiển thị tại đây.</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
