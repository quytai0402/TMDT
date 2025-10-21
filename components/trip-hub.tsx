import { Calendar, DoorOpen, KeySquare, MapPin, MessageCircle, Navigation, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

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
    arrivalGuide: Array<{
      title: string
      description: string
      icon: "map" | "door" | "key"
    }>
    houseRules: string[]
    concierge: Array<{
      id: string
      title: string
      description: string
      estimatedPrice: string
    }>
    messagesUrl: string
    directionsUrl: string
  }
}

const guideIconMap = {
  map: Navigation,
  door: DoorOpen,
  key: KeySquare,
}

export function TripHub({ trip }: TripHubProps) {
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
            <CardTitle className="text-lg text-slate-900">Dịch vụ gia tăng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-600">
            {trip.concierge.map((service) => (
              <div key={service.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-base font-semibold text-slate-900">{service.title}</p>
                <p className="mt-1">{service.description}</p>
                <p className="mt-2 text-xs font-semibold text-primary">Ước tính: {service.estimatedPrice}</p>
              </div>
            ))}
            <Button variant="outline" className="w-full rounded-xl">
              Yêu cầu dịch vụ khác
            </Button>
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
