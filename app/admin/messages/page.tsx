'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AdminLayout } from '@/components/admin-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, AlertTriangle, Flag, Eye, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface AdminMessageUser {
  id: string
  name: string | null
  email: string | null
  image?: string | null
}

interface AdminMessage {
  id: string
  content: string
  createdAt: string
  flagged?: boolean
  sender?: AdminMessageUser | null
  receiver?: AdminMessageUser | null
}

interface MessageStats {
  total: number
  flagged: number
  spam: number
  todayCount: number
}

const initialStats: MessageStats = {
  total: 0,
  flagged: 0,
  spam: 0,
  todayCount: 0,
}

export default function AdminMessagesPage() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [messages, setMessages] = useState<AdminMessage[]>([])
  const [stats, setStats] = useState<MessageStats>(initialStats)
  const [loading, setLoading] = useState(true)

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedFilter !== 'all') params.set('filter', selectedFilter)
      if (searchQuery) params.set('search', searchQuery)
      
      const res = await fetch(`/api/admin/messages?${params}`)
      if (!res.ok) throw new Error('Failed to fetch messages')
      
      const data = await res.json()
      setMessages(data.messages || [])
      setStats(data.stats || initialStats)
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast({
        title: "Lỗi",
        description: "Không thể tải tin nhắn. Vui lòng thử lại.",
        variant: "destructive",
      })
      setMessages([])
      setStats(initialStats)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, selectedFilter, toast])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  const flaggedMessages = useMemo(
    () => messages.filter((message) => Boolean(message.flagged)),
    [messages]
  )

  const renderMessageCard = (msg: AdminMessage) => (
    <div
      key={msg.id}
      className="flex flex-col gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 md:flex-row md:items-center md:justify-between"
    >
      <div className="flex flex-1 items-center gap-4">
        <Avatar>
          <AvatarFallback className="bg-gradient-to-br from-primary to-pink-500 text-white">
            {msg.sender?.name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="font-medium">{msg.sender?.name || 'Unknown'}</span>
            <span className="text-muted-foreground">→</span>
            <span className="font-medium">{msg.receiver?.name || 'Unknown'}</span>
            {msg.flagged && (
              <Badge variant="destructive" className="ml-2">
                <Flag className="mr-1 h-3 w-3" />
                Flagged
              </Badge>
            )}
          </div>
          <p className="truncate text-sm text-muted-foreground">{msg.content}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {new Date(msg.createdAt).toLocaleString('vi-VN')}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <Eye className="mr-1 h-4 w-4" />
          Xem
        </Button>
        <Button variant="ghost" size="sm">
          <Flag className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Quản lý tin nhắn</h1>
          <p className="text-muted-foreground mt-2">
            Giám sát và kiểm duyệt tin nhắn trong hệ thống
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Tổng tin nhắn</div>
              <div className="text-2xl font-bold mt-2">
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.total || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Hôm nay: {stats?.todayCount || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Tin nhắn bị gắn cờ</div>
              <div className="text-2xl font-bold mt-2 text-orange-600">
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.flagged || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Cần xem xét</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Báo cáo spam</div>
              <div className="text-2xl font-bold mt-2 text-red-600">
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.spam || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Đang chờ xử lý</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Tin nhắn hôm nay</div>
              <div className="text-2xl font-bold mt-2">
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.todayCount || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Tin nhắn mới</p>
            </CardContent>
          </Card>
        </div>

        {/* Messages Table */}
        <Card>
          <CardContent className="pt-6">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm tin nhắn..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Tabs value={selectedFilter} onValueChange={setSelectedFilter}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">Tất cả</TabsTrigger>
                <TabsTrigger value="flagged">
                  <Flag className="h-4 w-4 mr-1" />
                  Bị gắn cờ
                </TabsTrigger>
                <TabsTrigger value="spam">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Spam
                </TabsTrigger>
                <TabsTrigger value="support">Hỗ trợ</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Không có tin nhắn nào
                  </div>
                ) : (
                  messages.map((msg) => renderMessageCard(msg))
                )}
              </TabsContent>

              <TabsContent value="flagged" className="space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : flaggedMessages.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Không có tin nhắn bị gắn cờ
                  </div>
                ) : (
                  flaggedMessages.map((msg) => renderMessageCard(msg))
                )}
              </TabsContent>

              <TabsContent value="spam">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    Không có tin nhắn spam
                  </div>
                )}
              </TabsContent>

              <TabsContent value="support">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    Không có yêu cầu hỗ trợ
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
