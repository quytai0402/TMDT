"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  AlertTriangle,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  PauseCircle,
  RefreshCcw,
  Sparkles,
  Star,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type ExperienceStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "INACTIVE"
type StatusFilter = ExperienceStatus | "all"

interface ExperienceSummary {
  total: number
  pending: number
  active: number
  paused: number
  inactive: number
  submittedLast24Hours: number
}

const STATUS_BADGE: Record<ExperienceStatus, { label: string; className: string }> = {
  DRAFT: { label: "Chờ duyệt", className: "bg-amber-100 text-amber-700" },
  ACTIVE: { label: "Đang hoạt động", className: "bg-emerald-100 text-emerald-700" },
  PAUSED: { label: "Tạm dừng", className: "bg-blue-100 text-blue-700" },
  INACTIVE: { label: "Ngưng", className: "bg-rose-100 text-rose-700" },
}

const SUMMARY_CONFIG: Array<{
  key: keyof ExperienceSummary
  title: string
  icon: React.ComponentType<{ className?: string }>
  helper: string
  accentClass: string
}> = [
  { key: "pending", title: "Chờ duyệt", icon: Clock, helper: "Trải nghiệm đang cần kiểm duyệt", accentClass: "text-amber-600" },
  { key: "active", title: "Đang hoạt động", icon: CheckCircle2, helper: "Đang hiển thị trên marketplace", accentClass: "text-emerald-600" },
  { key: "paused", title: "Tạm dừng", icon: PauseCircle, helper: "Đợi cập nhật thêm thông tin", accentClass: "text-blue-600" },
  { key: "submittedLast24Hours", title: "Đăng trong 24h", icon: Sparkles, helper: "Ưu tiên duyệt sớm", accentClass: "text-violet-600" },
]

const STATUS_OPTIONS: Array<{ label: string; value: StatusFilter }> = [
  { label: "Chờ duyệt", value: "DRAFT" },
  { label: "Đang hoạt động", value: "ACTIVE" },
  { label: "Tạm dừng", value: "PAUSED" },
  { label: "Ngưng", value: "INACTIVE" },
  { label: "Tất cả", value: "all" },
]

const ACTION_CONFIG: Record<ModeratorAction, {
  title: string
  description: string
  targetStatus: ExperienceStatus
  requireNote?: boolean
  isVerification?: boolean
  successMessage: string
}> = {
  approve: {
    title: "Phê duyệt trải nghiệm",
    description: "Trải nghiệm sẽ được kích hoạt và hiển thị cho khách hàng.",
    targetStatus: "ACTIVE",
    isVerification: true,
    successMessage: "Đã phê duyệt trải nghiệm",
  },
  pause: {
    title: "Tạm dừng trải nghiệm",
    description: "Trải nghiệm sẽ tạm ẩn để chờ bổ sung hoặc rà soát.",
    targetStatus: "PAUSED",
    requireNote: true,
    successMessage: "Đã tạm dừng trải nghiệm",
  },
  reject: {
    title: "Từ chối trải nghiệm",
    description: "Trải nghiệm bị vô hiệu hóa khỏi hệ thống.",
    targetStatus: "INACTIVE",
    requireNote: true,
    successMessage: "Đã vô hiệu hóa trải nghiệm",
  },
  resume: {
    title: "Mở lại trải nghiệm",
    description: "Trải nghiệm sẽ quay lại trạng thái hoạt động.",
    targetStatus: "ACTIVE",
    isVerification: true,
    successMessage: "Đã mở lại trải nghiệm",
  },
}

const DEFAULT_SUMMARY: ExperienceSummary = {
  total: 0,
  pending: 0,
  active: 0,
  paused: 0,
  inactive: 0,
  submittedLast24Hours: 0,
}

interface GuideProfileSummary {
  id: string
  userId: string
  displayName: string
  status: string
  adminCommissionRate: number
  user?: {
    id: string
    name: string | null
    email: string | null
    image: string | null
  } | null
}

interface ExperienceHostSummary {
  id: string
  name: string | null
  email: string | null
  image: string | null
}

interface ExperienceListItem {
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
  languages: string[]
  tags: string[]
  status: ExperienceStatus
  isVerified: boolean
  featured: boolean
  isMembersOnly: boolean
  averageRating: number
  totalReviews: number
  totalBookings: number
  createdAt: string
  updatedAt: string
  guideProfile: GuideProfileSummary | null
  host: ExperienceHostSummary | null
  counts: {
    bookings: number
    reviews: number
  }
}

type ModeratorAction = "approve" | "pause" | "reject" | "resume"

export function AdminGuideExperienceModeration() {
  const [experiences, setExperiences] = useState<ExperienceListItem[]>([])
  const [summary, setSummary] = useState<ExperienceSummary>(DEFAULT_SUMMARY)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("DRAFT")
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedExperience, setSelectedExperience] = useState<ExperienceListItem | null>(null)
  const [activeAction, setActiveAction] = useState<ModeratorAction | null>(null)
  const [adminNote, setAdminNote] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 400)
    return () => clearTimeout(handler)
  }, [searchQuery])

  const fetchExperiences = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({ limit: "20", page: "1" })

      if (statusFilter !== "all") {
        params.set("status", statusFilter)
      }

      if (debouncedSearch) {
        params.set("search", debouncedSearch)
      }

      const response = await fetch(`/api/admin/guide-experiences?${params.toString()}`, {
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error("Không thể tải danh sách trải nghiệm")
      }

      const payload = await response.json()
      setExperiences(Array.isArray(payload.experiences) ? payload.experiences : [])
      setSummary(payload.summary ?? DEFAULT_SUMMARY)
    } catch (err) {
      console.error("Load guide experiences failed:", err)
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, debouncedSearch])

  useEffect(() => {
    void fetchExperiences()
  }, [fetchExperiences])

  const refresh = useCallback(() => {
    void fetchExperiences()
  }, [fetchExperiences])

  const openActionDialog = (experience: ExperienceListItem, action: ModeratorAction) => {
    setSelectedExperience(experience)
    setActiveAction(action)
    setAdminNote("")
  }

  const closeActionDialog = () => {
    setSelectedExperience(null)
    setActiveAction(null)
    setAdminNote("")
    setSubmitting(false)
  }

  const handleAction = async () => {
    if (!selectedExperience || !activeAction) return

    const config = ACTION_CONFIG[activeAction]
    if (!config) return

    if (config.requireNote && adminNote.trim().length === 0) {
      toast.error("Vui lòng ghi rõ ghi chú dành cho hướng dẫn viên")
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch("/api/admin/guide-experiences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          experienceId: selectedExperience.id,
          status: config.targetStatus,
          isVerified: config.isVerification ? true : undefined,
          adminMessage: adminNote.trim() || undefined,
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || "Không thể cập nhật trạng thái trải nghiệm")
      }

      toast.success(config.successMessage)
      closeActionDialog()
      await fetchExperiences()
    } catch (err) {
      console.error("Update experience status failed:", err)
      toast.error((err as Error).message)
      setSubmitting(false)
    }
  }

  const formatCurrency = useCallback((value: number, currency: string) => {
    try {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency,
        maximumFractionDigits: currency === "VND" ? 0 : 2,
      }).format(value)
    } catch (error) {
      console.error("Currency format error", error)
      return `${value.toLocaleString()} ${currency}`
    }
  }, [])

  const formatDate = (value: string) => {
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return "--"
    return parsed.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const renderedSummary = useMemo(() => {
    return SUMMARY_CONFIG.map((card) => {
      const Icon = card.icon
      return (
        <Card key={card.key} className="border-muted/60">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Icon className={`h-4 w-4 ${card.accentClass}`} />
              {card.title}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">{card.helper}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{(summary[card.key] ?? 0).toLocaleString("vi-VN")}</div>
          </CardContent>
        </Card>
      )
    })
  }, [summary])

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Kiểm duyệt trải nghiệm</CardTitle>
            <CardDescription>
              Duyệt trải nghiệm hướng dẫn viên trước khi hiển thị tới khách hàng LuxeStay
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
            Tải lại
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{renderedSummary}</div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
            <SelectTrigger className="w-full md:w-56">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Tìm theo tên trải nghiệm, hướng dẫn viên, địa điểm..."
            className="md:max-w-md"
          />
        </div>

        {error ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive bg-destructive/10 p-8 text-center text-destructive">
            <AlertTriangle className="h-8 w-8" />
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={refresh}>
              Thử lại
            </Button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : experiences.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12 text-center text-muted-foreground">
            <BadgeCheck className="h-8 w-8" />
            <p>Không có trải nghiệm nào phù hợp với bộ lọc hiện tại.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {experiences.map((experience) => {
              const badge = STATUS_BADGE[experience.status]

              return (
                <div
                  key={experience.id}
                  className="flex flex-col gap-4 rounded-lg border border-muted/60 p-4 md:flex-row md:items-start md:gap-6"
                >
                  <div className="relative h-40 w-full overflow-hidden rounded-lg bg-muted md:h-40 md:w-60">
                    <Image
                      src={experience.image || "/placeholder.svg"}
                      alt={experience.title}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-foreground">{experience.title}</h3>
                      <Badge className={badge.className}>{badge.label}</Badge>
                      {experience.isVerified ? <Badge variant="outline">Đã xác minh</Badge> : null}
                      {experience.featured ? <Badge variant="outline" className="border-primary text-primary">Featured</Badge> : null}
                    </div>

                    <div className="text-sm text-muted-foreground line-clamp-2">{experience.description}</div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" /> {experience.city}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" /> {experience.groupSize}
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarClock className="h-4 w-4" /> {experience.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-amber-500" />
                        {experience.averageRating.toFixed(1)} ({experience.totalReviews} đánh giá)
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span>Tạo ngày {formatDate(experience.createdAt)}</span>
                      <span>Cập nhật {formatDate(experience.updatedAt)}</span>
                      <span>Booking: {experience.counts.bookings}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {experience.languages.map((language) => (
                        <Badge key={language} variant="secondary">
                          {language}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-8 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Giá trọn gói</p>
                        <p className="font-semibold text-foreground">
                          {formatCurrency(experience.price, experience.currency)}
                        </p>
                      </div>
                      {experience.guideProfile ? (
                        <div>
                          <p className="text-xs text-muted-foreground">Hướng dẫn viên</p>
                          <p className="font-medium text-foreground">
                            {experience.guideProfile.displayName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Commission {Math.round(experience.guideProfile.adminCommissionRate * 100)}%
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-2 md:w-56">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/experiences/${experience.id}`} target="_blank" rel="noopener noreferrer">
                        Xem trang công khai
                      </Link>
                    </Button>

                    {experience.status === "DRAFT" ? (
                      <>
                        <Button size="sm" onClick={() => openActionDialog(experience, "approve")}>Phê duyệt</Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openActionDialog(experience, "reject")}
                        >
                          Từ chối
                        </Button>
                      </>
                    ) : null}

                    {experience.status === "ACTIVE" ? (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openActionDialog(experience, "pause")}
                        >
                          Tạm dừng
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openActionDialog(experience, "reject")}
                        >
                          Vô hiệu hóa
                        </Button>
                      </>
                    ) : null}

                    {experience.status === "PAUSED" ? (
                      <>
                        <Button size="sm" onClick={() => openActionDialog(experience, "resume")}>Mở lại</Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openActionDialog(experience, "reject")}
                        >
                          Vô hiệu hóa
                        </Button>
                      </>
                    ) : null}

                    {experience.status === "INACTIVE" ? (
                      <Button size="sm" onClick={() => openActionDialog(experience, "resume")}>Mở lại</Button>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      {selectedExperience && activeAction ? (
        <Dialog open onOpenChange={(open) => (open ? null : closeActionDialog())}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{ACTION_CONFIG[activeAction].title}</DialogTitle>
              <DialogDescription>
                {ACTION_CONFIG[activeAction].description}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-sm">
              <div className="rounded-lg border bg-muted/40 p-4">
                <p className="font-medium text-foreground">{selectedExperience.title}</p>
                <p className="text-xs text-muted-foreground">{selectedExperience.city}</p>
              </div>

              {ACTION_CONFIG[activeAction].requireNote ? (
                <Textarea
                  placeholder="Ghi chú gửi cho hướng dẫn viên..."
                  value={adminNote}
                  onChange={(event) => setAdminNote(event.target.value)}
                  rows={4}
                />
              ) : null}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={closeActionDialog} disabled={submitting}>
                Hủy
              </Button>
              <Button onClick={handleAction} disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Xác nhận
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </Card>
  )
}
