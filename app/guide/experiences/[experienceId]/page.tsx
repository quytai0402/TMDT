"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { GuideDashboardLayout } from "@/components/guide-dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { ArrowLeft, Loader2, MapPin, Star, Users } from "lucide-react"

import type { GuideNavMetrics } from "@/components/guide-dashboard-layout"

type ExperienceDetailResponse = {
  experience: {
    id: string
    title: string
    description: string
    category: string
    city: string
    state?: string | null
    location: string
    latitude?: number | null
    longitude?: number | null
    image: string
    images: string[]
    videoUrl?: string | null
    price: number
    currency: string
    duration: string
    groupSize: string
    minGuests: number
    maxGuests: number
    includedItems: string[]
    notIncluded: string[]
    requirements: string[]
    languages: string[]
    tags: string[]
    status: string
    isVerified: boolean
    featured: boolean
    isMembersOnly: boolean
    totalBookings: number
    totalReviews: number
    averageRating: number
    createdAt: string
    updatedAt: string
    guideProfile: {
      id: string
      displayName: string
      adminCommissionRate: number
    } | null
    bookings: Array<{
      id: string
      date: string | null
      timeSlot: string | null
      status: string
      totalPrice: number | null
      currency: string
      numberOfGuests: number
      paid: boolean
      guest: {
        id: string
        name: string | null
        email: string | null
      }
    }>
  }
  revenue: {
    gross: number
    net: number
    outstanding: number
  }
}

type PageProps = {
  params: { experienceId: string }
}

const formatCurrency = (value: number, currency = "VND") =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency }).format(value)

const formatDate = (value: string | null) =>
  value ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(value)) : "--"

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  ACTIVE: "default",
  DRAFT: "outline",
  PAUSED: "secondary",
  INACTIVE: "destructive",
}

export default function GuideExperienceDetailPage({ params }: PageProps) {
  const [data, setData] = useState<ExperienceDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/guide/experiences/${params.experienceId}`, { cache: "no-store" })
        if (!response.ok) {
          const payload = await response.json().catch(() => ({ error: "Không thể tải trải nghiệm" }))
          throw new Error(payload.error || "Không thể tải trải nghiệm")
        }
        const payload = (await response.json()) as ExperienceDetailResponse
        setData(payload)
      } catch (error) {
        toast.error((error as Error).message)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [params.experienceId])

  const navMetrics = useMemo<GuideNavMetrics | undefined>(() => {
    if (!data) return undefined
    return {
      rating: data.experience.averageRating,
      upcomingExperiences: data.experience.bookings.filter((booking) => booking.date && new Date(booking.date) > new Date()).length,
      pendingBookings: data.experience.bookings.filter((booking) => booking.status === "PENDING").length,
    }
  }, [data])

  return (
    <GuideDashboardLayout metrics={navMetrics}>
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/guide/experiences">
              <ArrowLeft className="mr-2 h-4 w-4" /> Danh sách trải nghiệm
            </Link>
          </Button>
          <h1 className="font-serif text-3xl font-bold">Chi tiết trải nghiệm</h1>
        </div>

        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : data ? (
          <div className="space-y-8">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="grid gap-0 md:grid-cols-2">
                  <div className="relative aspect-video md:aspect-auto md:h-full">
                    <Image src={data.experience.image} alt={data.experience.title} fill className="object-cover" />
                  </div>
                  <div className="space-y-4 p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={statusVariant[data.experience.status.toUpperCase()] ?? "outline"}
                        className="uppercase"
                      >
                        {data.experience.status}
                      </Badge>
                      {data.experience.featured ? <Badge variant="outline">Featured</Badge> : null}
                      {data.experience.isMembersOnly ? <Badge variant="outline">Members only</Badge> : null}
                    </div>
                    <CardTitle className="text-2xl font-serif">{data.experience.title}</CardTitle>
                    <CardDescription className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-4 w-4" /> {data.experience.city}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-4 w-4" /> {data.experience.groupSize}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Star className="h-4 w-4 text-amber-500" /> {data.experience.averageRating.toFixed(2)} ({data.experience.totalReviews} đánh giá)
                      </span>
                    </CardDescription>
                    <p className="text-sm text-muted-foreground">{data.experience.description}</p>
                    <div className="grid gap-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Giá net (sau phí)</span>
                        <span className="font-semibold text-foreground">
                          {formatCurrency(data.revenue.net, data.experience.currency)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground text-xs">
                        <span>Gross lifetime</span>
                        <span>{formatCurrency(data.revenue.gross, data.experience.currency)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Outstanding</span>
                        <span>{formatCurrency(data.revenue.outstanding, data.experience.currency)}</span>
                      </div>
                    </div>
                    <div className="grid gap-2 text-xs text-muted-foreground">
                      <p>Ngôn ngữ: {data.experience.languages.join(", ") || "Chưa cập nhật"}</p>
                      <p>Tags: {data.experience.tags.length > 0 ? data.experience.tags.map((tag) => `#${tag}`).join(" ") : "Chưa có"}</p>
                      <p>Khu vực: {data.experience.location}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Chi tiết nội dung</CardTitle>
                <CardDescription>Thông tin khách cần biết trước khi đặt</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Đã bao gồm</p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                    {data.experience.includedItems.length > 0 ? data.experience.includedItems.map((item) => <li key={item}>{item}</li>) : <li>Chưa cập nhật</li>}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Chưa bao gồm</p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                    {data.experience.notIncluded.length > 0 ? data.experience.notIncluded.map((item) => <li key={item}>{item}</li>) : <li>Chưa cập nhật</li>}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Yêu cầu</p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                    {data.experience.requirements.length > 0 ? data.experience.requirements.map((item) => <li key={item}>{item}</li>) : <li>Không có yêu cầu đặc biệt</li>}
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Booking gần đây</CardTitle>
                <CardDescription>20 booking gần nhất để theo dõi trạng thái</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {data.experience.bookings.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ngày diễn ra</TableHead>
                        <TableHead>Khách</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead className="text-right">Tổng tiền</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.experience.bookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>
                            <p className="text-sm font-medium text-foreground">{formatDate(booking.date)}</p>
                            {booking.timeSlot ? <p className="text-xs text-muted-foreground">{booking.timeSlot}</p> : null}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            <p>{booking.guest.name || booking.guest.email || "Ẩn danh"}</p>
                            {booking.guest.email ? <p className="text-xs">{booking.guest.email}</p> : null}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{booking.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right text-sm font-semibold text-foreground">
                            {booking.totalPrice ? formatCurrency(booking.totalPrice, booking.currency) : "--"}
                            <p className="text-xs text-muted-foreground">{booking.paid ? "Đã thanh toán" : "Chưa thanh toán"}</p>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-6 text-sm text-muted-foreground">Chưa có booking nào cho trải nghiệm này.</div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              Không tìm thấy trải nghiệm.
            </CardContent>
          </Card>
        )}
      </div>
    </GuideDashboardLayout>
  )
}
