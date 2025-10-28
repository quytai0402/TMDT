"use client"

import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { User, Phone, Mail, MessageSquare, Gift, AlertCircle, Star, Crown, ArrowUpRight } from "lucide-react"
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
    memberTier: string
    discount: number
    perks: string[]
    progress: number
    nextTier: {
      name: string
      bookingsToUnlock: number
      spendToUnlock: number
      discount: number
      perks: string[]
    } | null
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
        setPhoneHistory({
          totalBookings: data.totalBookings ?? 0,
          totalSpent: data.totalSpent ?? 0,
          memberTier: data.memberTier ?? 'Bronze',
          discount: data.discount ?? 0,
          perks: Array.isArray(data.perks) ? data.perks : [],
          progress: typeof data.progress === 'number' ? data.progress : 0,
          nextTier: data.nextTier
            ? {
                name: data.nextTier.name ?? 'Silver',
                bookingsToUnlock: Math.max(0, data.nextTier.bookingsToUnlock ?? 0),
                spendToUnlock: Math.max(0, data.nextTier.spendToUnlock ?? 0),
                discount: data.nextTier.discount ?? 0,
                perks: Array.isArray(data.nextTier.perks) ? data.nextTier.perks : [],
              }
            : null,
        })
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

  const SparkleBullet = () => (
    <span className="mt-1 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600 shadow-sm">
      <Star className="h-3 w-3" />
    </span>
  )

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
          <Alert className="bg-gradient-to-r from-purple-50 via-rose-50 to-orange-50 dark:from-purple-900/20 dark:via-rose-900/20 dark:to-orange-900/20 border-purple-200">
            <AlertDescription className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-purple-600">
                    <Star className="h-4 w-4" />
                    Khách hàng {phoneHistory.memberTier}
                  </div>
                  <p className="mt-1 text-sm text-purple-700 dark:text-purple-200">
                    Bạn đã đặt <strong>{phoneHistory.totalBookings} lần</strong>, chi tiêu tổng cộng{' '}
                    <strong>{formatPrice(phoneHistory.totalSpent)}₫</strong> với LuxeStay.
                  </p>
                  <p className="text-xs text-purple-500 dark:text-purple-300">
                    Chương trình tích điểm hoàn toàn miễn phí, áp dụng cho mọi lượt đặt phòng.
                  </p>
                </div>
                <Badge className="bg-white/80 text-purple-700 hover:bg-white">
                  <Gift className="mr-1 h-3 w-3" />
                  Ưu đãi hiện tại: {phoneHistory.discount}%
                </Badge>
              </div>

              <div className="rounded-xl bg-white/80 p-4 shadow-sm dark:bg-white/10">
                <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-purple-700">
                  <span>{phoneHistory.memberTier}</span>
                  <span>{phoneHistory.nextTier ? phoneHistory.nextTier.name : 'Hạng tối đa'}</span>
                </div>
                <Progress value={Math.round(Math.min(1, phoneHistory.progress ?? 0) * 100)} className="mt-2 h-2" />
                {phoneHistory.nextTier ? (
                  <p className="mt-2 flex items-center gap-2 text-sm text-purple-700 dark:text-purple-200">
                    <ArrowUpRight className="h-4 w-4" />
                    Còn <strong>{phoneHistory.nextTier.bookingsToUnlock}</strong> lần đặt hoặc{' '}
                    <strong>{formatPrice(phoneHistory.nextTier.spendToUnlock)}₫</strong> để lên hạng{' '}
                    {phoneHistory.nextTier.name} (+{phoneHistory.nextTier.discount}% ưu đãi).
                  </p>
                ) : (
                  <p className="mt-2 flex items-center gap-2 text-sm text-purple-700 dark:text-purple-200">
                    <Crown className="h-4 w-4" />
                    Bạn đang ở hạng cao nhất – tiếp tục đặt để nhận quà bất ngờ dành riêng cho Platinum!
                  </p>
                )}
              </div>

              {phoneHistory.perks.length > 0 && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {phoneHistory.perks.map((perk) => (
                    <div key={perk} className="flex items-start gap-2 text-sm text-purple-700 dark:text-purple-200">
                      <SparkleBullet />
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>
              )}
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
