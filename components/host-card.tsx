'use client'

import { FormEvent, useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Shield, MessageCircle, Phone, Send } from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

interface HostCardProps {
  host: {
    id: string
    name: string
    avatar: string
    joinedDate: string
    verified: boolean
    responseRate: number
    responseTime: string
    phone?: string | null
  }
  listingId?: string
}

export function HostCard({ host, listingId }: HostCardProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [message, setMessage] = useState("")

  const defaultMessage = useMemo(
    () =>
      `Xin chào ${host.name.split(' ')[0] ?? ''}! Tôi rất quan tâm tới chỗ ở này và muốn hỏi thêm thông tin.`,
    [host.name],
  )

  const ensureAuthenticated = useCallback(() => {
    if (!session) {
      toast.error('Vui lòng đăng nhập để nhắn tin với chủ nhà')
      const returnTo = listingId ? `/listing/${listingId}` : '/messages'
      router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`)
      return false
    }
    if (session.user.id === host.id) {
      toast.error('Bạn không thể nhắn tin với chính mình')
      return false
    }
    return true
  }, [host.id, listingId, router, session])

  const handleOpenDialog = () => {
    if (!ensureAuthenticated()) {
      return
    }
    setMessage(defaultMessage)
    setIsDialogOpen(true)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!ensureAuthenticated()) {
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
          message: message.trim() || defaultMessage,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setIsDialogOpen(false)
        // Navigate to messages page with conversation
        router.push(`/messages?conversation=${data.conversation.id}`)
        
        if (data.isNew) {
          toast.success('Đã gửi tin nhắn đầu tiên tới chủ nhà.')
        } else {
          toast.success('Đã tiếp tục cuộc trò chuyện với chủ nhà.')
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

  const buttonDisabled = status === 'loading' || loading

  return (
    <Card className="relative">
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

            {host.phone && (
              <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-muted/50 border border-border">
                <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">Số điện thoại</div>
                  <a 
                    href={`tel:${host.phone}`}
                    className="font-semibold text-foreground hover:text-primary transition-colors"
                  >
                    {host.phone}
                  </a>
                </div>
              </div>
            )}

            <Button 
              className="w-full md:w-auto"
              onClick={handleOpenDialog}
              disabled={buttonDisabled}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {buttonDisabled ? 'Đang xử lý...' : 'Liên hệ chủ nhà'}
            </Button>
          </div>
        </div>
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={(value) => !loading && setIsDialogOpen(value)}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Gửi tin nhắn cho {host.name}</DialogTitle>
              <DialogDescription>
                Giới thiệu ngắn gọn về chuyến đi của bạn và yêu cầu thông tin cụ thể nếu cần.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              className="mt-4 min-h-[140px]"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={defaultMessage}
              maxLength={600}
              disabled={loading}
              required
            />
            <DialogFooter className="mt-6 gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={loading}>
                Hủy
              </Button>
              <Button type="submit" disabled={loading || message.trim().length === 0}>
                <Send className="h-4 w-4 mr-2" />
                {loading ? 'Đang gửi...' : 'Gửi tin nhắn'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
