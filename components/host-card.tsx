'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Shield, MessageCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"

interface HostCardProps {
  host: {
    id: string
    name: string
    avatar: string
    joinedDate: string
    verified: boolean
    responseRate: number
    responseTime: string
  }
  listingId?: string
}

export function HostCard({ host, listingId }: HostCardProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)

  const handleContactHost = async () => {
    // Check authentication
    if (!session) {
      toast.error('Vui lòng đăng nhập để nhắn tin với chủ nhà')
      router.push('/login')
      return
    }

    // Prevent user from messaging themselves
    if (session.user.id === host.id) {
      toast.error('Bạn không thể nhắn tin với chính mình')
      return
    }

    try {
      setLoading(true)

      // Create or get conversation
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantId: host.id,
          listingId: listingId || undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Navigate to messages page with conversation
        router.push(`/messages?conversation=${data.conversation.id}`)
        
        if (data.isNew) {
          toast.success('Bắt đầu cuộc trò chuyện!')
        }
      } else {
        toast.error(data.error || 'Không thể tạo cuộc trò chuyện')
      }
    } catch (error) {
      console.error('Error contacting host:', error)
      toast.error('Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start space-x-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={host.avatar || "/placeholder.svg"} alt={host.name} />
            <AvatarFallback>{host.name[0]}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold text-xl text-foreground">{host.name}</h3>
              {host.verified && <Shield className="h-5 w-5 text-primary" />}
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <div className="text-sm text-muted-foreground">Tham gia</div>
                <div className="font-semibold text-foreground">{host.joinedDate}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Tỷ lệ phản hồi</div>
                <div className="font-semibold text-foreground">{host.responseRate}%</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Thời gian phản hồi</div>
                <div className="font-semibold text-foreground">{host.responseTime}</div>
              </div>
            </div>

            <Button 
              className="w-full md:w-auto"
              onClick={handleContactHost}
              disabled={loading}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {loading ? 'Đang xử lý...' : 'Liên hệ chủ nhà'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
