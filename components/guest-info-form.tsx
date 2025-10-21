"use client"

import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, Phone, Mail, MessageSquare, Gift, AlertCircle, Star } from "lucide-react"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

export interface GuestInfo {
  fullName: string
  phone: string
  email: string
  specialRequests?: string
}

interface GuestInfoFormProps {
  onInfoChange?: (info: GuestInfo) => void
  onLoginClick?: () => void
  titlePrefix?: string
}

export function GuestInfoForm({ onInfoChange, onLoginClick, titlePrefix }: GuestInfoFormProps) {
  const { data: session } = useSession()
  const [guestInfo, setGuestInfo] = useState<GuestInfo>({
    fullName: "",
    phone: "",
    email: "",
    specialRequests: ""
  })
  const [phoneHistory, setPhoneHistory] = useState<{
    totalBookings: number
    totalSpent: number
    memberTier?: string
    discount?: number
  } | null>(null)

  // Auto-fill if user is logged in
  useEffect(() => {
    if (session?.user) {
      setGuestInfo(prev => ({
        ...prev,
        fullName: session.user.name || "",
        email: session.user.email || "",
      }))
    }
  }, [session])

  // Check phone number history when phone changes
  const checkPhoneHistory = async (phone: string) => {
    if (phone.length === 10) {
      try {
        const response = await fetch(`/api/guests/history?phone=${phone}`)
        
        if (!response.ok) {
          setPhoneHistory(null)
          return
        }

        const data = await response.json()
        setPhoneHistory(data)
      } catch (error) {
        console.error('Error checking phone history:', error)
        setPhoneHistory(null)
      }
    } else {
      setPhoneHistory(null)
    }
  }

  const handleChange = (field: keyof GuestInfo, value: string) => {
    const updated = { ...guestInfo, [field]: value }
    setGuestInfo(updated)

    // Check phone history when phone number changes
    if (field === "phone") {
      checkPhoneHistory(value)
    }
  }

  useEffect(() => {
    onInfoChange?.(guestInfo)
  }, [guestInfo, onInfoChange])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(Math.round(price))
  }

  const headingPrefix = titlePrefix ? titlePrefix.trim() : ""

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-lg">
          {headingPrefix ? `${headingPrefix} ` : ""}
          Thông tin khách hàng
        </h3>
        {session?.user ? (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <User className="w-3 h-3 mr-1" />
            Đã đăng nhập
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Khách vãng lai
          </Badge>
        )}
      </div>

      {!session?.user && (
        <Alert className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200">
          <AlertCircle className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-sm text-blue-700 dark:text-blue-300">
            Bạn đang đặt phòng với tư cách khách vãng lai. 
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 ml-1 text-blue-700"
              onClick={onLoginClick}
            >
              Đăng nhập
            </Button> để nhận ưu đãi tốt hơn.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {/* Full Name */}
        <div>
          <Label htmlFor="fullName" className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>Họ và tên <span className="text-red-500">*</span></span>
          </Label>
          <Input
            id="fullName"
            value={guestInfo.fullName}
            onChange={(e) => handleChange("fullName", e.target.value)}
            placeholder="Nguyễn Văn A"
            className="mt-2"
            required
          />
        </div>

        {/* Phone Number */}
        <div>
          <Label htmlFor="phone" className="flex items-center space-x-2">
            <Phone className="w-4 h-4" />
            <span>Số điện thoại <span className="text-red-500">*</span></span>
          </Label>
          <Input
            id="phone"
            value={guestInfo.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="0912345678"
            className="mt-2"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            Số điện thoại sẽ được dùng để tra cứu lịch sử đặt phòng và nhận ưu đãi
          </p>
        </div>

        {/* Phone History Alert */}
        {phoneHistory && (
          <Alert className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200">
            <Star className="w-4 h-4 text-purple-600" />
            <AlertDescription className="space-y-2">
              <p className="font-semibold text-purple-900 dark:text-purple-100">
                Chào mừng khách hàng {phoneHistory.memberTier}! 🎉
              </p>
              <div className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                <div className="flex items-center justify-between">
                  <span>Số lần đặt phòng:</span>
                  <span className="font-medium">{phoneHistory.totalBookings} lần</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tổng chi tiêu:</span>
                  <span className="font-medium">{formatPrice(phoneHistory.totalSpent)}₫</span>
                </div>
                {phoneHistory.discount && (
                  <div className="flex items-center justify-between">
                    <span>Ưu đãi của bạn:</span>
                    <Badge className="bg-green-600">
                      <Gift className="w-3 h-3 mr-1" />
                      Giảm {phoneHistory.discount}%
                    </Badge>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Email */}
        <div>
          <Label htmlFor="email" className="flex items-center space-x-2">
            <Mail className="w-4 h-4" />
            <span>Email <span className="text-red-500">*</span></span>
          </Label>
          <Input
            id="email"
            type="email"
            value={guestInfo.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="example@email.com"
            className="mt-2"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            Email để nhận xác nhận đặt phòng
          </p>
        </div>

        <Separator />

        {/* Special Requests */}
        <div>
          <Label htmlFor="specialRequests" className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4" />
            <span>Yêu cầu đặc biệt (tùy chọn)</span>
          </Label>
          <Textarea
            id="specialRequests"
            value={guestInfo.specialRequests}
            onChange={(e) => handleChange("specialRequests", e.target.value)}
            placeholder="Ví dụ: Cần giường phụ, đến trễ, allergies..."
            className="mt-2 min-h-[100px]"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Chúng tôi sẽ cố gắng đáp ứng yêu cầu của bạn (không đảm bảo)
          </p>
        </div>
      </div>

      {/* Privacy Notice */}
      <Alert className="mt-6">
        <AlertCircle className="w-4 h-4" />
        <AlertDescription className="text-xs">
          Thông tin của bạn được bảo mật và chỉ dùng cho mục đích đặt phòng. 
          Số điện thoại sẽ được dùng để tra cứu lịch sử và tính ưu đãi cho các lần đặt sau.
        </AlertDescription>
      </Alert>
    </Card>
  )
}
