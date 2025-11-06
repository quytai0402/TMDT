"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { GuideDashboardLayout } from "@/components/guide-dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  Clock,
  Compass,
  Loader2,
  MapPin,
  PencilLine,
  Search,
  Users,
  Wallet,
  XCircle,
} from "lucide-react"

import type { GuideNavMetrics } from "@/components/guide-dashboard-layout"

type ExperienceStatus = "ACTIVE" | "DRAFT" | "PAUSED" | "INACTIVE"

type StatusFilter = "ALL" | ExperienceStatus

type ExperienceRecord = {
  id: string
  title: string
  description: string
  category: string
  city: string
  state?: string | null
  location: string
  image: string
  images: string[]
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
  status: ExperienceStatus
  isVerified: boolean
  featured: boolean
  isMembersOnly: boolean
  totalBookings: number
  totalReviews: number
  averageRating: number
  createdAt: string
  updatedAt: string
  bookingsSummary: {
    total: number
    pending: number
    upcoming: number
    grossRevenue: number
    netRevenue: number
    lastBookingAt: string | null
  }
}

type ExperienceStats = {
  total: number
  statusCounts: Record<ExperienceStatus, number>
  pendingBookings: number
  upcomingSessions: number
  grossRevenue: number
  netRevenue: number
}

type GuideExperiencesResponse = {
  experiences: ExperienceRecord[]
  stats: ExperienceStats
  navMetrics: GuideNavMetrics
}

const STATUS_TABS: Array<{ value: StatusFilter; label: string }> = [
  { value: "ALL", label: "Tất cả" },
  { value: "ACTIVE", label: "Đang hoạt động" },
  { value: "DRAFT", label: "Nháp" },
  { value: "PAUSED", label: "Tạm dừng" },
  { value: "INACTIVE", label: "Ngừng" },
]

const formatCurrency = (value: number, currency = "VND") =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value)

export default function GuideExperiencesPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
  const [searchValue, setSearchValue] = useState("")
  const [appliedSearch, setAppliedSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<GuideExperiencesResponse | null>(null)

  const loadExperiences = useCallback(
    async (status: StatusFilter, query: string) => {
      try {
        setLoading(true)
        setError(null)
        const params = new URLSearchParams()
        if (status !== "ALL") {
          params.set("status", status)
        }
        if (query.trim().length > 0) {
          params.set("q", query.trim())
        }
        const queryString = params.toString()
        const response = await fetch(`/api/guide/experiences${queryString ? `?${queryString}` : ""}`, {
          cache: "no-store",
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => ({ error: "Không thể tải danh sách" }))
          throw new Error(payload.error || "Không thể tải danh sách trải nghiệm")
        }

        const payload = (await response.json()) as GuideExperiencesResponse
        setData(payload)
      } catch (err) {
        const message = (err as Error).message
        setError(message)
        toast.error(message)
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    void loadExperiences(statusFilter, appliedSearch)
  }, [statusFilter, appliedSearch, loadExperiences])

  const navMetrics = data?.navMetrics

  const statusCounts = useMemo(() => {
    if (!data) return undefined
    return STATUS_TABS.filter((tab): tab is { value: ExperienceStatus; label: string } => tab.value !== "ALL").map((tab) => ({
      status: tab.value,
      label: tab.label,
      count: data.stats.statusCounts[tab.value] ?? 0,
    }))
  }, [data])

  const handleSubmitSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAppliedSearch(searchValue)
  }

  const handleRefresh = () => {
    void loadExperiences(statusFilter, appliedSearch)
  }

  return (
    <GuideDashboardLayout metrics={navMetrics}>
      <div className="space-y-8">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <h1 className="font-serif text-3xl font-bold text-foreground md:text-4xl">Danh mục trải nghiệm</h1>
            <p className="text-sm text-muted-foreground">
              Theo dõi hiệu suất trải nghiệm và tạo mới để phát triển kênh hướng dẫn viên của bạn.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Clock className="mr-2 h-4 w-4" />}Tải lại
            </Button>
            <Button asChild>
              <Link href="/guide/experiences/new">Tạo trải nghiệm mới</Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tổng số trải nghiệm</CardTitle>
              <CardDescription className="text-2xl font-semibold text-foreground">
                {data?.stats.total ?? 0}
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Booking đang chờ</CardTitle>
              <CardDescription className="text-2xl font-semibold text-foreground">
                {data?.stats.pendingBookings ?? 0}
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Doanh thu tích lũy</CardTitle>
              <CardDescription className="text-2xl font-semibold text-foreground">
                {formatCurrency(data?.stats.netRevenue ?? 0)}
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Lịch sắp tới</CardTitle>
              <CardDescription className="text-2xl font-semibold text-foreground">
                {data?.stats.upcomingSessions ?? 0}
              </CardDescription>
            </CardHeader>
          </Card>
        </section>

        <section className="rounded-xl border bg-card p-4 shadow-sm">
          <form onSubmit={handleSubmitSearch} className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)} className="w-full md:w-auto">
              <TabsList className="flex w-full flex-wrap justify-start gap-2 md:w-auto md:justify-start">
                {STATUS_TABS.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value} className="text-xs md:text-sm">
                    {tab.label}
                    {tab.value !== "ALL" && statusCounts ? (
                      <span className="ml-1 rounded-full bg-muted px-1.5 text-[10px] text-muted-foreground">
                        {statusCounts.find((item) => item.status === tab.value as ExperienceStatus)?.count ?? 0}
                      </span>
                    ) : null}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="flex w-full items-center gap-2 md:w-80">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Tìm theo tên, thành phố, tags"
                  className="pl-9"
                />
              </div>
              <Button type="submit" variant="outline" disabled={loading}>
                Tìm kiếm
              </Button>
            </div>
          </form>
        </section>

        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Card className="border-destructive/40 bg-destructive/10">
            <CardContent className="flex flex-col items-center justify-center space-y-3 py-12 text-center">
              <XCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" onClick={handleRefresh}>
                Thử lại
              </Button>
            </CardContent>
          </Card>
        ) : data && data.experiences.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center space-y-4 py-16 text-center text-muted-foreground">
              <div className="rounded-full bg-muted p-4">
                <Compass className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">Chưa có trải nghiệm nào</p>
                <p className="text-sm">Hãy tạo trải nghiệm đầu tiên để thu hút khách hàng.</p>
              </div>
              <Button asChild>
                <Link href="/guide/experiences/new">Tạo trải nghiệm ngay</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 xl:grid-cols-2">
            {data?.experiences.map((experience) => (
              <Card key={experience.id} className="border border-muted/60 shadow-sm">
                <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-semibold text-foreground flex flex-wrap items-center gap-2">
                      {experience.title}
                      {experience.featured ? <Badge variant="outline">Featured</Badge> : null}
                      {experience.isVerified ? <Badge variant="outline" className="border-emerald-200 text-emerald-600">Verified</Badge> : null}
                    </CardTitle>
                    <CardDescription className="flex flex-wrap items-center gap-2 text-sm">
                      <Badge variant="secondary" className="font-normal uppercase tracking-wide">
                        {experience.status}
                      </Badge>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {experience.city}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        {experience.groupSize}
                      </span>
                    </CardDescription>
                  </div>
                  <Button size="sm" variant="ghost" asChild>
                    <Link href={`/guide/experiences/${experience.id}`}>
                      <PencilLine className="mr-2 h-4 w-4" />Quản lý
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border p-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Doanh thu thuần</p>
                      <p className="mt-2 text-lg font-semibold text-foreground">
                        {formatCurrency(experience.bookingsSummary.netRevenue, experience.currency)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {experience.bookingsSummary.total} booking • {experience.totalReviews} đánh giá
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Hoạt động booking</p>
                      <p className="mt-2 flex items-center gap-2 text-sm text-foreground">
                        <Wallet className="h-4 w-4 text-primary" />
                        {experience.bookingsSummary.pending} đang chờ • {experience.bookingsSummary.upcoming} sắp diễn ra
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Cập nhật lần cuối {new Date(experience.updatedAt).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                      <p className="font-semibold text-foreground">Ngôn ngữ</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {experience.languages.map((language) => (
                          <Badge key={language} variant="outline" className="text-xs">
                            {language}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                      <p className="font-semibold text-foreground">Tags nổi bật</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {experience.tags.length > 0 ? (
                          experience.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              #{tag}
                            </Badge>
                          ))
                        ) : (
                          <span>Chưa thiết lập</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                    <p className="font-semibold text-foreground">Bao gồm</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {experience.includedItems.length > 0 ? (
                        experience.includedItems.map((item) => (
                          <Badge key={item} variant="outline" className="text-xs">
                            {item}
                          </Badge>
                        ))
                      ) : (
                        <span>Chưa cập nhật</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </GuideDashboardLayout>
  )
}
