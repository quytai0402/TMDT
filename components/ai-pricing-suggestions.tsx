"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  Target,
  Sparkles,
  AlertCircle,
  Loader2,
  Info,
  CheckCircle2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

type ListingSummary = {
  id: string
  title?: string | null
  city?: string | null
  basePrice?: number | null
}

type PricingHistoryItem = {
  id: string
  name: string
  startDate: string
  endDate: string
  multiplier: number
  fixedPrice?: number | null
}

type PricingSuggestionResponse = {
  currentPrice: number
  suggestedPrice: number
  adjustmentPercentage: number
  reasoning: string
  analysis: {
    occupancyRate: number
    season: string
    upcomingEvents: string[]
    competitorAnalysis: {
      averagePrice: number | null
      minPrice: number | null
      maxPrice: number | null
      totalCompetitors: number
    }
  }
  pricingHistory: PricingHistoryItem[]
}

interface AIPricingSuggestionsProps {
  listing: ListingSummary | null
}

export function AIPricingSuggestions({ listing }: AIPricingSuggestionsProps) {
  const [data, setData] = useState<PricingSuggestionResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSuggestions = useCallback(
    async (listingId: string) => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch("/api/ai/pricing-suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingId }),
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}))
          throw new Error(payload.error || "Không thể tải đề xuất giá")
        }

        const payload = (await response.json()) as PricingSuggestionResponse
        setData(payload)
      } catch (err) {
        console.error(err)
        setError((err as Error).message)
        setData(null)
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    if (listing?.id) {
      loadSuggestions(listing.id)
    } else {
      setData(null)
    }
  }, [listing?.id, loadSuggestions])

  const priceDelta = useMemo(() => {
    if (!data) return { isIncrease: false, percent: 0 }
    return {
      isIncrease: data.suggestedPrice >= data.currentPrice,
      percent: Math.abs(data.adjustmentPercentage),
    }
  }, [data])

  const reasoningBullets = useMemo(() => {
    if (!data?.reasoning) return []
    return data.reasoning
      .split(".")
      .map((item) => item.trim())
      .filter(Boolean)
  }, [data])

  if (!listing) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        Chọn một căn hộ để xem đề xuất giá thông minh.
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">Đề xuất giá từ AI</h2>
          <p className="text-muted-foreground">
            {listing.title} {listing.city ? `• ${listing.city}` : ""}
          </p>
        </div>
        <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2">
          <Sparkles className="mr-2 h-4 w-4" />
          AI Powered
        </Badge>
      </div>

      {error && (
        <Card className="border-destructive/40 bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive">Không thể tải đề xuất</CardTitle>
            <CardDescription className="text-destructive">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => listing.id && loadSuggestions(listing.id)}>
              Thử lại
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : data ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Giá hiện tại</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.currentPrice.toLocaleString("vi-VN")}₫</div>
                <p className="text-xs text-muted-foreground">Giá nền tảng đang áp dụng</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Giá đề xuất</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{data.suggestedPrice.toLocaleString("vi-VN")}₫</div>
                <div className="text-xs text-muted-foreground">
                  {priceDelta.isIncrease ? (
                    <span className="text-green-600 inline-flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      +{priceDelta.percent.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-orange-600 inline-flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" />
                      -{priceDelta.percent.toFixed(1)}%
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Occupancy dự kiến</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.analysis.occupancyRate}%</div>
                <p className="text-xs text-muted-foreground">Trong mùa {data.analysis.season}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Đối thủ theo dõi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.analysis.competitorAnalysis.totalCompetitors}</div>
                <p className="text-xs text-muted-foreground">Listing tương đồng tại {listing.city}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Phân tích chi tiết</CardTitle>
              <CardDescription>AI xem xét nhiều yếu tố để đưa ra đề xuất phù hợp</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    <p className="font-medium">So sánh đối thủ</p>
                  </div>
                  <div className="grid grid-cols-3 text-center text-sm">
                    <div>
                      <p className="text-muted-foreground">Min</p>
                      <p className="font-semibold">
                        {data.analysis.competitorAnalysis.minPrice
                          ? `${data.analysis.competitorAnalysis.minPrice.toLocaleString("vi-VN")}₫`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avg</p>
                      <p className="font-semibold">
                        {data.analysis.competitorAnalysis.averagePrice
                          ? `${data.analysis.competitorAnalysis.averagePrice.toLocaleString("vi-VN")}₫`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Max</p>
                      <p className="font-semibold">
                        {data.analysis.competitorAnalysis.maxPrice
                          ? `${data.analysis.competitorAnalysis.maxPrice.toLocaleString("vi-VN")}₫`
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <p className="font-medium">Sự kiện sắp tới</p>
                  </div>
                  {data.analysis.upcomingEvents.length ? (
                    <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                      {data.analysis.upcomingEvents.map((event) => (
                        <li key={event}>{event}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">Không có sự kiện lớn trong khu vực</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">Lý do đề xuất</p>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {reasoningBullets.map((item) => (
                    <div key={item} className="flex items-start gap-2 rounded-lg border p-3 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
                      <span>{item}</span>
                    </div>
                  ))}
                  {!reasoningBullets.length && (
                    <p className="text-sm text-muted-foreground">AI đang tổng hợp phân tích...</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Mức độ tự tin của AI</span>
                  <span className="text-primary font-semibold">
                    {Math.min(100, Math.abs(data.adjustmentPercentage) * 2 + data.analysis.occupancyRate / 2).toFixed(0)}%
                  </span>
                </div>
                <Progress
                  value={Math.min(100, Math.abs(data.adjustmentPercentage) * 2 + data.analysis.occupancyRate / 2)}
                  className="h-2"
                />
              </div>

              <div className="flex flex-col gap-2 md:flex-row">
                <Button className="flex-1">Áp dụng giá đề xuất</Button>
                <Button variant="outline" className="flex-1">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Xem chi tiết phân tích
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lịch sử giá gần đây</CardTitle>
              <CardDescription>Các chiến dịch giá đặc biệt bạn đã tạo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.pricingHistory.length ? (
                data.pricingHistory.map((item) => (
                  <div key={item.id} className="flex flex-col gap-2 rounded-lg border p-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.startDate).toLocaleDateString("vi-VN")} –{" "}
                        {new Date(item.endDate).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                    <div className="text-sm">
                      {item.fixedPrice
                        ? `Giá cố định: ${item.fixedPrice.toLocaleString("vi-VN")}₫`
                        : `Multiplier: x${item.multiplier.toFixed(2)}`}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Chưa có lịch sử giá đặc biệt.</p>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Chưa có dữ liệu đề xuất cho căn hộ này. Thử tải lại hoặc kiểm tra bookings gần đây.
        </Card>
      )}
    </div>
  )
}
