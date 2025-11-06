"use client"

import { Calendar, DoorOpen, KeySquare, MapPin, MessageCircle, Navigation, Users, CheckCircle2, Sparkles, Gift, ClipboardCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useSession } from "next-auth/react"

const SERVICE_STATUS_BADGES: Record<string, { label: string; variant: "outline" | "secondary" | "default" }> = {
  PENDING: { label: "Concierge đang nhận", variant: "outline" },
  CONFIRMED: { label: "Đang chuẩn bị", variant: "secondary" },
  COMPLETED: { label: "Sẵn sàng", variant: "default" },
}

interface TripHubProps {
  trip: {
    id: string
    bookingCode: string
    status: "confirmed" | "pending" | "completed"
    canReview?: boolean
    reviewUrl?: string
    listing: {
      title: string
      location: string
      image: string
      host: {
        name: string
        avatar: string
        phone: string
        language: string
        responseRate: number
      }
    }
    checkIn: string
    checkOut: string
    guests: number
    total: number
    smartLock: {
      code: string
      validFrom: string
      validTo: string
    }
    wifi: {
      name: string
      password: string
    }
    services?: Array<{
      id: string
      name: string
      quantityLabel?: string
      totalPrice: number
      status?: string
      updatedAt?: string | null
    }>
    servicesTotal?: number
    arrivalGuide: Array<{
      title: string
      description: string
      icon: "map" | "door" | "key"
    }>
    houseRules: string[]
    conciergePlans?: Array<{
      id: string
      status: string
      loyaltyOffer?: string | null
      hostNotes?: string | null
      guestNotes?: string | null
      createdAt: string
      partnerInfo?: Array<{ title?: string; location?: string; sameHost?: boolean }>
    }>
    packingChecklist?: string[]
    upsellExperiences?: Array<{
      title: string
      description: string
      cta?: string
    }>
    messagesUrl: string
    directionsUrl: string
  }
  membershipTier?: string | null
}

const guideIconMap = {
  map: Navigation,
  door: DoorOpen,
  key: KeySquare,
}

export function TripHub({ trip, membershipTier }: TripHubProps) {
  const { data: session } = useSession()
  const normalizedTier = membershipTier?.toUpperCase() ?? null
  const sessionTier = session?.user?.membership?.toUpperCase() ?? null
  const MEMBERSHIP_ORDER: Record<string, number> = {
    BRONZE: 0,
    SILVER: 1,
    GOLD: 2,
    PLATINUM: 3,
    DIAMOND: 4,
  }

  const resolvedTier = [normalizedTier, sessionTier].reduce<string | null>((highest, current) => {
    if (!current) return highest
    if (!highest) return current
    const currentScore = MEMBERSHIP_ORDER[current] ?? -1
    const highestScore = MEMBERSHIP_ORDER[highest] ?? -1
    return currentScore > highestScore ? current : highest
  }, null)

  const hasConciergeAccess = resolvedTier === "DIAMOND"

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="overflow-hidden rounded-3xl border border-slate-100 bg-white/90 shadow-[0_32px_90px_-70px_rgba(15,23,42,0.9)]">
          <CardContent className="p-0">
            <div className="grid gap-0 md:grid-cols-[1.1fr,1fr]">
              <div className="relative h-full min-h-[260px] overflow-hidden">
                <img
                  src={trip.listing.image || "/placeholder.svg"}
                  alt={trip.listing.title}
                  className="h-full w-full object-cover"
                />
                <span className="absolute left-6 top-6 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-primary">
                  Mã đặt phòng: {trip.bookingCode}
                </span>
              </div>
              <div className="space-y-5 p-6">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary">
                      {trip.status === "confirmed" ? "Đã xác nhận" : trip.status === "completed" ? "Đã hoàn thành" : "Chờ xác nhận"}
                    </Badge>
                  </div>
                  <h1 className="font-serif text-3xl font-bold text-slate-900">{trip.listing.title}</h1>
                  <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="h-4 w-4" />
                    {trip.listing.location}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Calendar className="h-4 w-4" />
                      Nhận phòng
                    </div>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {new Date(trip.checkIn).toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Calendar className="h-4 w-4" />
                      Trả phòng
                    </div>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {new Date(trip.checkOut).toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="outline" className="rounded-full border-primary/30 bg-primary/5 text-primary">
                    <Users className="mr-2 h-4 w-4" /> {trip.guests} khách
                  </Badge>
                  <Badge variant="outline" className="rounded-full border-primary/30 bg-primary/5 text-primary">
                    Tổng: {trip.total.toLocaleString("vi-VN")}₫
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-slate-100 bg-white/80">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">Liên hệ & hỗ trợ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
              <img
                src={trip.listing.host.avatar || "/placeholder.svg"}
                alt={trip.listing.host.name}
                className="h-12 w-12 rounded-full object-cover"
              />
              <div>
                <p className="text-sm text-slate-500">Chủ nhà</p>
                <p className="text-base font-semibold text-slate-900">{trip.listing.host.name}</p>
                <p className="text-xs text-slate-500">
                  Tỷ lệ phản hồi {trip.listing.host.responseRate}% • Ngôn ngữ: {trip.listing.host.language}
                </p>
              </div>
            </div>
            <Button className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90" asChild>
              <Link href={trip.messagesUrl}>
                <MessageCircle className="mr-2 h-4 w-4" /> Nhắn tin với chủ nhà
              </Link>
            </Button>
            <Button variant="outline" className="w-full rounded-xl" asChild>
              <Link href={trip.directionsUrl}>
                <Navigation className="mr-2 h-4 w-4" /> Dẫn đường đến chỗ ở
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-3xl border border-slate-100 bg-white/80 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">Hướng dẫn nhận phòng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {trip.arrivalGuide.map((step) => {
              const Icon = guideIconMap[step.icon]
              return (
                <div key={step.title} className="flex gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-base font-semibold text-slate-900">{step.title}</p>
                    <p className="text-sm text-slate-600">{step.description}</p>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-3xl border border-slate-100 bg-white/80">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900">Khóa thông minh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <p>
                <span className="font-semibold text-slate-900">Mã mở cửa:</span> {trip.smartLock.code}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Hiệu lực từ:</span> {new Date(trip.smartLock.validFrom).toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" })}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Hết hạn:</span> {new Date(trip.smartLock.validTo).toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-slate-100 bg-white/80">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900">Wi-Fi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <p>
                <span className="font-semibold text-slate-900">Tên mạng:</span> {trip.wifi.name}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Mật khẩu:</span> {trip.wifi.password}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {(trip.services?.length || trip.conciergePlans?.length) && (
        <section className="grid gap-6 lg:grid-cols-3">
          {trip.services?.length ? (
            <Card className="rounded-3xl border border-primary/20 bg-white/90 lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-primary">
                  <Sparkles className="h-5 w-5" /> Dịch vụ bạn đã đặt trước
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {trip.services.map((service) => {
                  const status = service.status ? service.status.toUpperCase() : 'PENDING'
                  const statusInfo = SERVICE_STATUS_BADGES[status] ?? SERVICE_STATUS_BADGES.PENDING

                  return (
                    <div key={service.id} className="flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
                      <div className="space-y-1">
                        <p className="font-semibold text-primary-600">{service.name}</p>
                        {service.quantityLabel && <p className="text-xs text-muted-foreground">{service.quantityLabel}</p>}
                        {service.updatedAt && (
                          <p className="text-xs text-muted-foreground">
                            Cập nhật {new Date(service.updatedAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        <p className="text-sm font-semibold text-primary">{service.totalPrice.toLocaleString("vi-VN")}₫</p>
                      </div>
                    </div>
                  )
                })}
                <div className="flex items-center justify-between border-t border-primary/20 pt-3 text-sm font-semibold text-primary">
                  <span>Tổng dịch vụ</span>
                  <span>{(trip.servicesTotal || 0).toLocaleString("vi-VN")}₫</span>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {trip.conciergePlans?.length ? (
            <Card className="rounded-3xl border border-emerald-200 bg-emerald-50/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-emerald-700">
                  <Gift className="h-5 w-5" /> Kế hoạch concierge
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {trip.conciergePlans.slice(0, 2).map((plan) => (
                  <div key={plan.id} className="rounded-2xl border border-emerald-200 bg-white/80 p-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="border-emerald-300 bg-emerald-100 text-emerald-700">
                        {plan.status === "CONFIRMED"
                          ? "Đã xác nhận"
                          : plan.status === "PENDING"
                            ? "Đang xử lý"
                            : plan.status === "COMPLETED"
                              ? "Hoàn tất"
                              : "Đã hủy"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(plan.createdAt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}
                      </span>
                    </div>
                    {plan.loyaltyOffer && (
                      <p className="mt-2 text-sm text-emerald-800 font-semibold">Ưu đãi: {plan.loyaltyOffer}</p>
                    )}
                    {plan.hostNotes && <p className="mt-2 text-sm text-slate-600">Host note: {plan.hostNotes}</p>}
                    {plan.partnerInfo && plan.partnerInfo.length > 0 && (
                      <ul className="mt-3 space-y-1 text-xs text-slate-600">
                        {plan.partnerInfo.map((partner, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-400" />
                            {partner.title}
                            {partner.location ? ` • ${partner.location}` : ""}
                            {partner.sameHost ? " (cùng chuỗi)" : ""}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">
                  Concierge sẽ gửi cập nhật khi có thay đổi lịch trình hoặc ưu đãi mới.
                </p>
              </CardContent>
            </Card>
          ) : null}
        </section>
      )}

      {(trip.packingChecklist?.length || trip.upsellExperiences?.length) && (
        <section className="grid gap-6 lg:grid-cols-3">
          {trip.packingChecklist?.length ? (
            <Card className="rounded-3xl border border-slate-100 bg-white/90 lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                  <ClipboardCheck className="h-5 w-5" /> Checklist trước chuyến đi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {trip.packingChecklist.map((item, idx) => (
                  <div key={`${item}-${idx}`} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {trip.upsellExperiences?.length ? (
            <Card className="rounded-3xl border border-purple-200 bg-purple-50/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-purple-700">
                  <Sparkles className="h-5 w-5" /> Gợi ý mở rộng trải nghiệm
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {trip.upsellExperiences.map((offer) => (
                  <div key={offer.title} className="rounded-2xl border border-purple-200 bg-white/90 p-4 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">{offer.title}</p>
                    <p className="mt-1 text-xs text-slate-600">{offer.description}</p>
                    {offer.cta && (
                      <Button variant="link" size="sm" className="px-0 text-purple-600" asChild>
                        <Link href={offer.cta}>Khám phá thêm</Link>
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card className="rounded-3xl border border-slate-100 bg-white/80">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">Quy tắc nhà</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-slate-600">
              {trip.houseRules.map((rule) => (
                <li key={rule} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-slate-100 bg-white/80">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">Concierge 24/7</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <p>
              Đội concierge sẽ hỗ trợ bạn đặt xe, nhà hàng, tour trải nghiệm và xử lý mọi yêu cầu đặc biệt trong suốt kỳ nghỉ.
            </p>
            {!hasConciergeAccess && (
              <p className="text-xs text-muted-foreground">
                Tính năng này dành riêng cho thành viên Diamond. Nâng cấp để được hỗ trợ ngay lập tức.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {['Nhà hàng gần đây', 'Đặt tour trong ngày', 'Spa & wellness', 'Thuê xe riêng'].map((action) => (
                <Badge key={action} variant="outline" className="rounded-full border-primary/30 bg-primary/5 text-primary">
                  {action}
                </Badge>
              ))}
            </div>
            {hasConciergeAccess ? (
              <Button className="w-full rounded-xl" asChild>
                <Link href="/concierge">Chat với concierge</Link>
              </Button>
            ) : (
              <Button className="w-full rounded-xl" variant="outline" disabled>
                Chỉ dành cho Diamond
              </Button>
            )}
          </CardContent>
        </Card>
      </section>

      {trip.canReview && trip.reviewUrl && (
        <section className="grid gap-6">
          <Card className="rounded-3xl border border-slate-100 bg-white/80">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900">Đánh giá trải nghiệm</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <p>
                Chia sẻ cảm nhận của bạn để giúp chủ nhà cải thiện dịch vụ và hỗ trợ các khách sau lựa chọn chỗ ở phù hợp.
              </p>
              <Button className="rounded-xl" asChild>
                <Link href={trip.reviewUrl}>
                  Viết đánh giá
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  )
}
