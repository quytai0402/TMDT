'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, Check, CheckCheck, Trash2, Calendar, Home, Star, MessageSquare, User } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { toast } from 'sonner'
import { pusherClient } from '@/lib/pusher'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  link?: string
}

export function NotificationCenter() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [isPollingActive, setIsPollingActive] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const userId = session?.user?.id ?? null

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/notifications?limit=50')
      if (res.ok) {
        const data = await res.json()
        setNotifications(Array.isArray(data.notifications) ? data.notifications : [])
        if (typeof data.unreadCount === 'number' && data.unreadCount >= 0) {
          setUnreadCount(data.unreadCount)
        }
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadUnreadCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?unreadOnly=true&limit=1')
      if (!res.ok) {
        // Silently ignore if API not available or returns error
        return
      }
      
      const data = await res.json()
      const newUnreadCount = data.unreadCount

      setUnreadCount(prev => {
        if (newUnreadCount > prev && prev > 0) {
          toast.success("Thông báo mới", {
            description: `Bạn có ${newUnreadCount - prev} thông báo mới`,
            action: {
              label: "Xem",
              onClick: () => setOpen(true),
            },
          })

          try {
            const audio = new Audio("/notification.mp3")
            audio.volume = 0.5
            audio.play().catch(() => {
              // Ignore if autoplay is blocked
            })
          } catch (error) {
            // Ignore audio errors
          }
        }

        return newUnreadCount
      })
    } catch (error) {
      // Silently ignore fetch errors
      console.debug('Notification API not available:', error)
    }
  }, [])

  // Update favicon badge với số thông báo
  const updateFaviconBadge = useCallback((count: number) => {
    if (count > 0) {
      // Tạo canvas để vẽ badge
      const canvas = document.createElement("canvas")
      canvas.width = 32
      canvas.height = 32
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Vẽ circle đỏ
      ctx.fillStyle = "#EF4444"
      ctx.beginPath()
      ctx.arc(24, 8, 8, 0, 2 * Math.PI)
      ctx.fill()

      // Vẽ số
      ctx.fillStyle = "#FFFFFF"
      ctx.font = "bold 14px Arial"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(count > 9 ? "9+" : count.toString(), 24, 8)

      // Cập nhật favicon
      const favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement
      if (favicon) {
        favicon.href = canvas.toDataURL()
      }
      
      // Cập nhật title với số thông báo
      document.title = `(${count}) Homestay Booking`
    } else {
      // Reset favicon về mặc định
      document.title = "Homestay Booking"
    }
  }, [])

  // Update favicon khi unreadCount thay đổi
  useEffect(() => {
    updateFaviconBadge(unreadCount)
  }, [unreadCount, updateFaviconBadge])

  useEffect(() => {
    if (!userId || !pusherClient) return

    const channelName = `private-user-${userId}-notifications`
    try {
      const channel = pusherClient.subscribe(channelName)
      setIsConnected(true)

      const handleNotification = (payload: { notification: Notification }) => {
        const newNotification: Notification = {
          ...payload.notification,
          isRead: false,
        }

        setUnreadCount((prev) => prev + 1)

        if (open) {
          setNotifications((prev) => {
            const next = [newNotification, ...prev]
            return next.slice(0, 50)
          })
        }

        toast.success(newNotification.title, {
          description: newNotification.message,
          action: {
            label: "Xem",
            onClick: () => setOpen(true),
          },
        })
      }

      channel.bind("notification:created", handleNotification)

      return () => {
        channel.unbind("notification:created", handleNotification)
        pusherClient.unsubscribe(channelName)
        setIsConnected(false)
      }
    } catch (error) {
      console.error("Pusher subscription error:", error)
    }
  }, [userId, open])

  useEffect(() => {
    if (userId && open) {
      void loadNotifications()
    }
  }, [userId, open, loadNotifications])

  useEffect(() => {
    if (!userId) return

    const poll = () => {
      void loadUnreadCount()
      if (open) {
        void loadNotifications()
      }
    }

    const startPolling = () => {
      if (pollingRef.current) return
      pollingRef.current = setInterval(poll, 30000)
      setIsPollingActive(true)
    }

    const stopPolling = () => {
      if (!pollingRef.current) return
      clearInterval(pollingRef.current)
      pollingRef.current = null
      setIsPollingActive(false)
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        poll()
        startPolling()
      } else {
        stopPolling()
      }
    }

    poll()
    if (document.visibilityState === 'visible') {
      startPolling()
    }

    window.addEventListener('focus', poll)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      stopPolling()
      window.removeEventListener('focus', poll)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [userId, open, loadUnreadCount, loadNotifications])

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds })
      })

      if (res.ok) {
        setNotifications(prev =>
          prev.map(n =>
            notificationIds.includes(n.id) ? { ...n, isRead: true } : n
          )
        )
        setUnreadCount(prev => Math.max(0, prev - notificationIds.length))
      }
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true })
      })

      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const res = await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'BOOKING':
        return '🏠'
      case 'LISTING':
        return '🏡'
      case 'REVIEW':
        return '⭐'
      case 'MESSAGE':
        return '💬'
      case 'USER':
        return '👤'
      case 'PAYMENT':
        return '💰'
      case 'PRICE_DROP':
        return '💸'
      case 'REMINDER':
        return '⏰'
      case 'SYSTEM':
        return '🔔'
      default:
        return '📢'
    }
  }

  const formatTime = (date: string) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: vi
    })
  }

  if (!session?.user) return null

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs animate-pulse"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle>Thông báo</SheetTitle>
              <SheetDescription>
                {unreadCount > 0 ? `Bạn có ${unreadCount} thông báo chưa đọc` : 'Không có thông báo mới'}
              </SheetDescription>
            </div>
            { (isConnected || isPollingActive) && (
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-muted-foreground">Live</span>
              </div>
            )}
          </div>
        </SheetHeader>

        {unreadCount > 0 && (
          <div className="flex justify-end mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Đánh dấu tất cả đã đọc
            </Button>
          </div>
        )}

        <ScrollArea className="h-[calc(100vh-180px)] mt-4">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Chưa có thông báo nào</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`
                    p-4 rounded-lg border transition-colors cursor-pointer
                    ${notification.isRead ? 'bg-background' : 'bg-primary/5 border-primary/20'}
                    hover:bg-muted/50
                  `}
                  onClick={() => {
                    if (!notification.isRead) {
                      markAsRead([notification.id])
                    }
                    if (notification.link) {
                      window.location.href = notification.link
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-sm leading-tight truncate">
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1 animate-pulse" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2 break-words">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatTime(notification.createdAt)}
                        </span>
                        <div className="flex gap-1">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2"
                              onClick={(e) => {
                                e.stopPropagation()
                                markAsRead([notification.id])
                              }}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNotification(notification.id)
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
