"use client"

import { useEffect, useState } from "react"
import { GuideDashboardLayout } from "@/components/guide-dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

import type { GuideNavMetrics } from "@/components/guide-dashboard-layout"

type GuideDashboardResponse = {
  profile: {
    displayName: string
    tagline?: string | null
    bio?: string | null
    status: string
    subscriptionStatus: string
    languages?: string[]
    serviceAreas?: string[]
    specialties?: string[]
  }
  metrics: GuideNavMetrics & {
    averageRating: number
  }
}

export default function GuideProfilePage() {
  const [profile, setProfile] = useState<GuideDashboardResponse["profile"] | null>(null)
  const [metrics, setMetrics] = useState<GuideNavMetrics | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/guide/dashboard", { cache: "no-store" })
        if (!response.ok) {
          throw new Error("Không thể tải hồ sơ hướng dẫn viên")
        }
        const data = (await response.json()) as GuideDashboardResponse
        setProfile(data.profile)
        setMetrics({
          rating: data.metrics?.averageRating,
          upcomingExperiences: data.metrics?.upcomingExperiences,
          pendingBookings: data.metrics?.pendingBookings,
        })
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  return (
    <GuideDashboardLayout metrics={metrics}>
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="space-y-2">
          <h1 className="font-serif text-3xl font-bold">Hồ sơ hướng dẫn viên</h1>
          <p className="text-sm text-muted-foreground">
            Cập nhật thông tin nổi bật để LuxeStay tiếp thị và giới thiệu bạn đến khách hàng phù hợp.
          </p>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Thông tin hiển thị công khai</CardTitle>
            <CardDescription>Hãy đảm bảo thông tin chính xác và thu hút</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : profile ? (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">Trạng thái: {profile.status}</Badge>
                  <Badge variant="secondary">Membership: {profile.subscriptionStatus}</Badge>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">Tên hiển thị</label>
                    <Input value={profile.displayName} readOnly className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">Tagline</label>
                    <Input value={profile.tagline ?? "Chưa cập nhật"} readOnly className="bg-muted" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Giới thiệu</label>
                  <Textarea value={profile.bio ?? "Chưa cập nhật"} readOnly rows={4} className="bg-muted" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <span className="text-xs font-semibold text-muted-foreground">Ngôn ngữ</span>
                    <div className="flex flex-wrap gap-2">
                      {(profile.languages ?? []).map((language) => (
                        <Badge key={language} variant="outline">
                          {language}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <span className="text-xs font-semibold text-muted-foreground">Khu vực hoạt động</span>
                    <div className="flex flex-wrap gap-2">
                      {(profile.serviceAreas ?? []).map((area) => (
                        <Badge key={area} variant="outline">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <span className="text-xs font-semibold text-muted-foreground">Sở trường</span>
                  <div className="flex flex-wrap gap-2">
                    {(profile.specialties ?? []).map((specialty) => (
                      <Badge key={specialty} variant="secondary">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-dashed bg-muted/40 p-4 text-xs text-muted-foreground">
                  Nếu cần chỉnh sửa thông tin hồ sơ, vui lòng liên hệ concierge LuxeStay hoặc gửi yêu cầu tại mục Hỗ trợ.
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Không tìm thấy hồ sơ hướng dẫn viên.</p>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-end">
          <Button disabled size="sm">
            Đang khoá chỉnh sửa
          </Button>
        </div>
      </div>
    </GuideDashboardLayout>
  )
}
