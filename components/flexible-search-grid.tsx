"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { CalendarHeart, Clock, Map, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useMembershipAccess } from "@/hooks/use-membership-access"
import { useAuthModal } from "@/hooks/use-auth-modal"

const flexibleOptions = [
  {
    id: "weekend",
    title: "Cuối tuần linh hoạt",
    description: "Tự động tìm giá tốt nhất cho 3 ngày cuối tuần trong 60 ngày tới.",
    meta: "Tiết kiệm trung bình 12%",
    icon: CalendarHeart,
    highlight: "Phù hợp cho nhóm bạn",
    requiresMembership: false,
  },
  {
    id: "extended",
    title: "Ở dài ngày",
    description: "Gợi ý homestay giảm giá cho kỳ nghỉ từ 1 tới 4 tuần.",
    meta: "Ưu đãi tới 25%",
    icon: Clock,
    highlight: "Có dịch vụ vệ sinh định kỳ",
    requiresMembership: false,
  },
  {
    id: "anywhere",
    title: "Linh hoạt địa điểm",
    description: "Chọn ngân sách và phong cách, hệ thống đề xuất điểm đến hợp gu.",
    meta: "Khám phá điểm đến mới",
    icon: Map,
    highlight: "Kèm guidebook địa phương",
    requiresMembership: true,
  },
]

const FLEXIBLE_QUERY_MAP: Record<
  string,
  {
    flexMode: string
    region: string
    tripLength: string
    query?: string
  }
> = {
  weekend: { flexMode: "weekends", region: "south", tripLength: "2-3", query: "Villa cuối tuần cho nhóm bạn" },
  extended: { flexMode: "weeks", region: "central", tripLength: "7-14", query: "Căn hộ hoặc villa cho staycation dài ngày" },
  anywhere: { flexMode: "month", region: "highlands", tripLength: "10-20", query: "Homestay độc đáo để khám phá điểm đến mới" },
}

export function FlexibleSearchGrid() {
  const router = useRouter()
  const { hasMembership, isAuthenticated } = useMembershipAccess()
  const authModal = useAuthModal()

  const openFlexibleSearch = useCallback(
    (variant: keyof typeof FLEXIBLE_QUERY_MAP, requiresMembership = false) => {
      if (requiresMembership && !hasMembership) {
        if (!isAuthenticated) {
          authModal.openLogin()
          return
        }
        router.push("/membership?ref=flexible-grid")
        return
      }
      const config = FLEXIBLE_QUERY_MAP[variant] ?? FLEXIBLE_QUERY_MAP.weekend
      const params = new URLSearchParams()
      params.set("flexible", "true")
      params.set("flexMode", config.flexMode)
      params.set("tripLength", config.tripLength)
      params.set("region", config.region)
      params.set("sortBy", "averageRating")
      params.set("sortOrder", "desc")
      params.set("limit", "24")
      if (config.query) {
        params.set("q", config.query)
      }
      router.push(`/search?${params.toString()}`)
    },
    [authModal, hasMembership, isAuthenticated, router],
  )

  return (
    <section className="bg-white py-20" id="flexible-search">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1 text-sm font-semibold text-primary">
              <Sparkles className="h-4 w-4" />
              Tôi linh hoạt
            </div>
            <h2 className="font-serif text-4xl font-bold text-slate-900 md:text-5xl">
              Dành cho những tâm hồn thích xê dịch linh hoạt
            </h2>
            <p className="text-lg text-slate-600">
              Không cần khóa ngày cụ thể, LuxeStay dùng AI để chọn ra khoảng thời gian và homestay lý tưởng dựa trên giá tốt, lịch
              trống và tiện nghi bạn mong muốn.
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-slate-600">
              <span className="rounded-full bg-sky-100 px-4 py-2 font-semibold text-sky-700">So sánh giá theo tháng</span>
              <span className="rounded-full bg-emerald-100 px-4 py-2 font-semibold text-emerald-700">Tính toán thời tiết & lễ hội</span>
              <span className="rounded-full bg-amber-100 px-4 py-2 font-semibold text-amber-700">Dự đoán tỉ lệ kín phòng</span>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
              <Badge variant="secondary" className="uppercase tracking-wide text-[11px]">
                Công cụ miễn phí
              </Badge>
              {hasMembership ? (
                <Badge
                  variant="outline"
                  className="uppercase tracking-wide text-[11px] text-emerald-700 border-emerald-200 bg-emerald-50/70"
                >
                  Đã mở khóa ưu đãi hội viên
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="uppercase tracking-wide text-[11px] text-amber-600 border-amber-200 bg-amber-50/60"
                >
                  Một số tính năng cần membership
                </Badge>
              )}
            </div>
            <Button
              className="mt-4 w-full max-w-xs rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
              onClick={() => openFlexibleSearch("weekend")}
            >
              Khám phá chế độ linh hoạt
            </Button>
            {!hasMembership && (
              <Button
                variant="outline"
                className="w-full max-w-xs rounded-xl border-amber-300 text-amber-700"
                onClick={() => openFlexibleSearch("anywhere", true)}
              >
                Thử tính năng hội viên
              </Button>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-1">
            {flexibleOptions.map((option) => {
              const Icon = option.icon
              return (
                <Card
                  key={option.id}
                  className="relative cursor-pointer overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-white via-slate-50 to-white shadow-[0_30px_60px_-50px_rgba(15,23,42,0.8)] transition hover:-translate-y-1 hover:border-primary/30"
                  role="button"
                  tabIndex={0}
                  onClick={() => openFlexibleSearch(option.id as keyof typeof FLEXIBLE_QUERY_MAP, option.requiresMembership)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      openFlexibleSearch(option.id as keyof typeof FLEXIBLE_QUERY_MAP, option.requiresMembership)
                    }
                  }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <CardTitle className="text-xl text-slate-900">{option.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-slate-600">
                    <p>{option.description}</p>
                    <div className="flex flex-col gap-2 text-sm font-medium">
                      <span className="text-primary">{option.meta}</span>
                      <span className="rounded-lg bg-slate-100 px-3 py-2 text-slate-700">{option.highlight}</span>
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        {option.requiresMembership ? "Membership" : "Free"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
