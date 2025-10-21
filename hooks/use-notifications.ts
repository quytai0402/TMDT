"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"

export interface Notification {
  id: string
  type: "booking" | "message" | "review" | "price_drop" | "payment" | "reminder" | "system"
  title: string
  message: string
  read: boolean
  timestamp: Date
  actionUrl?: string
  icon?: string
  priority?: "low" | "normal" | "high"
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isConnected, setIsConnected] = useState(false)

  // Cập nhật favicon với badge
  const updateFaviconBadge = useCallback((count: number) => {
    const favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement
    if (!favicon) return

    if (count > 0) {
      // Tạo canvas để vẽ badge
      const canvas = document.createElement("canvas")
      canvas.width = 32
      canvas.height = 32
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Vẽ background đỏ
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
      favicon.href = canvas.toDataURL()
      
      // Cập nhật title
      document.title = `(${count}) Homestay Booking`
    } else {
      // Reset favicon về mặc định
      document.title = "Homestay Booking"
    }
  }, [])

  // Đếm số thông báo chưa đọc
  useEffect(() => {
    const count = notifications.filter((n) => !n.read).length
    setUnreadCount(count)
    updateFaviconBadge(count)
  }, [notifications, updateFaviconBadge])

  // Fetch notifications từ API
  useEffect(() => {
    let mounted = true

    const fetchNotifications = async () => {
      try {
        setIsConnected(true)
        const response = await fetch('/api/notifications')
        
        if (!response.ok) {
          throw new Error('Failed to fetch notifications')
        }

        const data = await response.json()
        
        if (mounted) {
          // Convert timestamp strings to Date objects
          const notificationsWithDates = data.map((n: any) => ({
            ...n,
            timestamp: new Date(n.timestamp)
          }))
          setNotifications(notificationsWithDates)
        }
      } catch (error) {
        console.error('Error fetching notifications:', error)
        if (mounted) {
          setNotifications([])
          setIsConnected(false)
        }
      }
    }

    fetchNotifications()

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)

    return () => {
      mounted = false
      clearInterval(interval)
      setIsConnected(false)
    }
  }, [])

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    )
  }, [])

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  // Delete notification
  const deleteNotification = useCallback((notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
  }, [])

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  }
}
