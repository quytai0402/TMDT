"use client"

import { useMemo, useState } from "react"
import { TrendingUp, DollarSign, Calendar, Target, Lightbulb, Sliders } from "lucide-react"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

type ListingSummary = {
  id: string
  title?: string | null
  city?: string | null
  basePrice?: number | null
  occupancyRate?: number | null
  weekendMultiplier?: number | null
  monthlyDiscount?: number | null
}

interface PricingSimulatorProps {
  listing: ListingSummary | null
}

export function PricingSimulator({ listing }: PricingSimulatorProps) {
  const basePrice = listing?.basePrice ?? 0
  const baseOccupancy = (listing?.occupancyRate ?? 60) / 100
  const [weekendMultiplier, setWeekendMultiplier] = useState(listing?.weekendMultiplier ?? 1.2)
  const [seasonMultiplier, setSeasonMultiplier] = useState(1.1)
  const [longStayDiscount, setLongStayDiscount] = useState(listing?.monthlyDiscount ?? 0.1)

  const nightsInMonth = 30

  const adjustedOccupancy = useMemo(() => {
    const weekendBoost = (weekendMultiplier - 1) * 0.4
    const seasonBoost = (seasonMultiplier - 1) * 0.6
    const discountBoost = longStayDiscount * 0.3
    return Math.min(0.98, Math.max(0.35, baseOccupancy + weekendBoost + seasonBoost - discountBoost))
  }, [baseOccupancy, weekendMultiplier, seasonMultiplier, longStayDiscount])

  const currentRevenue = useMemo(() => {
    return Math.round(basePrice * baseOccupancy * nightsInMonth)
  }, [basePrice, baseOccupancy])

  const projectedRevenue = useMemo(() => {
    const effectivePrice = basePrice * seasonMultiplier * (1 - longStayDiscount / 2)
    return Math.round(effectivePrice * adjustedOccupancy * nightsInMonth * (0.6 + weekendMultiplier / 2))
  }, [basePrice, seasonMultiplier, longStayDiscount, adjustedOccupancy, weekendMultiplier])

  const revenueDiff = projectedRevenue - currentRevenue

  const chartData = useMemo(() => {
    const data: Array<{ day: number; price: number; occupancy: number }> = []
    for (let day = 1; day <= 30; day++) {
      const isWeekend = day % 7 === 0 || day % 7 === 6
      const isPeak = day >= 20 && day <= 26
      const price =
        basePrice *
        (isWeekend ? weekendMultiplier : 1) *
        (isPeak ? seasonMultiplier : 1) *
        (1 - (longStayDiscount / 2) * (day % 10 === 0 ? 1 : 0))
      const dayOccupancy = Math.min(
        0.97,
        Math.max(0.4, adjustedOccupancy + (isWeekend ? 0.05 : -0.02) + (isPeak ? 0.06 : 0)),
      )
      data.push({
        day,
        price: Math.round(price),
        occupancy: Math.round(dayOccupancy * 100),
      })
    }
    return data
  }, [adjustedOccupancy, basePrice, weekendMultiplier, seasonMultiplier, longStayDiscount])

  if (!listing) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        Chọn một căn hộ để mô phỏng chiến lược giá.
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mô phỏng chiến lược giá</h2>
          <p className="text-muted-foreground">
            {listing.title} {listing.city ? `• ${listing.city}` : ""}
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Sliders className="h-4 w-4" />
          Scenario Planner
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-3">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Revenue hiện tại</p>
              <p className="text-2xl font-bold">{currentRevenue.toLocaleString("vi-VN")}₫</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-50 p-3">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Revenue dự kiến</p>
              <p className="text-2xl font-bold text-green-600">{projectedRevenue.toLocaleString("vi-VN")}₫</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-50 p-3">
              <Target className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tăng trưởng dự kiến</p>
              <p className={`text-2xl font-bold ${revenueDiff >= 0 ? "text-green-600" : "text-orange-600"}`}>
                {revenueDiff >= 0 ? "+" : ""}
                {((revenueDiff / Math.max(currentRevenue, 1)) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="sliders">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sliders">Điều chỉnh thông số</TabsTrigger>
          <TabsTrigger value="comparison">Biểu đồ dự báo</TabsTrigger>
        </TabsList>

        <TabsContent value="sliders" className="space-y-6 pt-4">
          <Card>
            <CardContent className="grid gap-6 py-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Weekend multiplier</Label>
                <Slider
                  min={1}
                  max={1.8}
                  step={0.05}
                  value={[weekendMultiplier]}
                  onValueChange={([val]) => setWeekendMultiplier(val)}
                />
                <Input value={weekendMultiplier.toFixed(2)} readOnly />
                <p className="text-xs text-muted-foreground">Tăng giá cuối tuần theo nhu cầu</p>
              </div>
              <div className="space-y-2">
                <Label>Season boost</Label>
                <Slider min={1} max={1.6} step={0.05} value={[seasonMultiplier]} onValueChange={([val]) => setSeasonMultiplier(val)} />
                <Input value={seasonMultiplier.toFixed(2)} readOnly />
                <p className="text-xs text-muted-foreground">Mùa cao điểm, sự kiện, kỳ nghỉ</p>
              </div>
              <div className="space-y-2">
                <Label>Ưu đãi dài ngày</Label>
                <Slider
                  min={0}
                  max={0.4}
                  step={0.05}
                  value={[longStayDiscount]}
                  onValueChange={([val]) => setLongStayDiscount(val)}
                />
                <Input value={`${Math.round(longStayDiscount * 100)}%`} readOnly />
                <p className="text-xs text-muted-foreground">Giảm giá booking 7+ đêm</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 py-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                Gợi ý: Giữ multiplier cuối tuần dưới 1.4 để tránh giá quá cao so với trung bình khu vực.
              </div>
              <div className="flex flex-col gap-2 md:flex-row">
                <Button className="flex-1">Áp dụng chiến lược</Button>
                <Button variant="outline" className="flex-1">
                  Xuất báo cáo
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="pt-4">
          <Card>
            <CardContent className="space-y-4 py-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Dự báo 30 ngày tiếp theo</p>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip />
                    <Line yAxisId="left" type="monotone" dataKey="price" stroke="#6366f1" strokeWidth={2} name="Giá (₫)" />
                    <Line yAxisId="right" type="monotone" dataKey="occupancy" stroke="#22c55e" strokeWidth={2} name="Occupancy (%)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardContent className="grid gap-4 py-4 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Occupancy dự kiến</p>
            <p className="text-2xl font-bold">{Math.round(adjustedOccupancy * 100)}%</p>
            <p className="text-xs text-muted-foreground">Sau khi áp dụng chiến lược</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Giá trung bình / đêm</p>
            <p className="text-2xl font-bold">{Math.round(basePrice * seasonMultiplier).toLocaleString("vi-VN")}₫</p>
            <p className="text-xs text-muted-foreground">Đã bao gồm multiplier</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Chênh lệch doanh thu</p>
            <p className={`text-2xl font-bold ${revenueDiff >= 0 ? "text-green-600" : "text-orange-600"}`}>
              {revenueDiff >= 0 ? "+" : ""}
              {revenueDiff.toLocaleString("vi-VN")}₫
            </p>
            <p className="text-xs text-muted-foreground">/tháng so với hiện tại</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
