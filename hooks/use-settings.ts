"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"

interface UserSettings {
  id: string
  userId: string
  
  // Notifications
  emailNotifications: boolean
  pushNotifications: boolean
  smsNotifications: boolean
  bookingNotifications: boolean
  messageNotifications: boolean
  reviewNotifications: boolean
  promotionNotifications: boolean
  
  // Privacy
  profileVisibility: "PUBLIC" | "FRIENDS" | "PRIVATE"
  showEmail: boolean
  showPhone: boolean
  showLastSeen: boolean
  
  // Language & Display
  language: string
  currency: string
  timezone: string
  theme: "light" | "dark" | "system"
  
  // Host Settings
  autoAcceptBookings: boolean
  instantBookingEnabled: boolean
  minimumStay: number
  maximumStay: number
  advanceBookingTime: number
  checkInTime: string
  checkOutTime: string
  
  // Guest Settings
  autoReview: boolean
  savePaymentMethods: boolean
  
  createdAt: string
  updatedAt: string
}

export function useSettings() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/settings")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch settings")
      }

      setSettings(data.settings)
    } catch (error: any) {
      console.error("Error fetching settings:", error)
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải cài đặt",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const updateSettings = useCallback(
    async (updates: Partial<UserSettings>) => {
      try {
        setSaving(true)
        const response = await fetch("/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to update settings")
        }

        setSettings(data.settings)
        
        toast({
          title: "Đã lưu",
          description: "Cài đặt của bạn đã được cập nhật",
        })

        return data.settings
      } catch (error: any) {
        console.error("Error updating settings:", error)
        toast({
          title: "Lỗi",
          description: error.message || "Không thể cập nhật cài đặt",
          variant: "destructive",
        })
        throw error
      } finally {
        setSaving(false)
      }
    },
    [toast]
  )

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  return {
    settings,
    loading,
    saving,
    updateSettings,
    refetch: fetchSettings,
  }
}
