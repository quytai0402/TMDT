"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Calendar,
  Target,
  Lightbulb,
  ArrowRight,
  CheckCircle2
} from "lucide-react"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

export function PricingSimulator() {
  const [basePrice, setBasePrice] = useState(1850000)
  const [weekendMultiplier, setWeekendMultiplier] = useState(1.2)
  const [peakSeasonMultiplier, setPeakSeasonMultiplier] = useState(1.5)
  const [minNightsDiscount, setMinNightsDiscount] = useState(0.1)
  
  const currentPrice = 1850000
  const suggestedPrice = 2100000
  const priceDiff = ((suggestedPrice - currentPrice) / currentPrice * 100)

  // Simulate 30 days revenue
  const simulateRevenue = () => {
    const days = []
    let totalRevenue = 0
    let bookedDays = 0
    
    for (let i = 1; i <= 30; i++) {
      const isWeekend = i % 7 === 0 || i % 7 === 6
      const isPeak = i >= 15 && i <= 25 // Simulate peak period
      
      let price = basePrice
      if (isWeekend) price *= weekendMultiplier
      if (isPeak) price *= peakSeasonMultiplier
      
      // Simulate booking probability
      const bookingRate = isPeak ? 0.95 : (isWeekend ? 0.85 : 0.75)
      const isBooked = Math.random() < bookingRate
      
      if (isBooked) {
        totalRevenue += price
        bookedDays++
      }
      
      days.push({
        day: i,
        price: Math.round(price),
        booked: isBooked,
        type: isPeak ? "peak" : (isWeekend ? "weekend" : "weekday")
      })
    }
    
    return {
      days,
      totalRevenue: Math.round(totalRevenue),
      bookedDays,
      occupancyRate: Math.round((bookedDays / 30) * 100),
      avgPrice: Math.round(totalRevenue / bookedDays)
    }
  }

  const currentStrategy = simulateRevenue()
  
  // Simulate with suggested pricing
  const [, setSuggestedMultiplier] = useState(weekendMultiplier)
  const suggestedStrategy = (() => {
    const tempBase = basePrice
    const tempWeekend = 1.3
    const tempPeak = 1.6
    
    let totalRevenue = 0
    let bookedDays = 0
    
    for (let i = 1; i <= 30; i++) {
      const isWeekend = i % 7 === 0 || i % 7 === 6
      const isPeak = i >= 15 && i <= 25
      
      let price = tempBase
      if (isWeekend) price *= tempWeekend
      if (isPeak) price *= tempPeak
      
      const bookingRate = isPeak ? 0.92 : (isWeekend ? 0.82 : 0.72)
      const isBooked = Math.random() < bookingRate
      
      if (isBooked) {
        totalRevenue += price
        bookedDays++
      }
    }
    
    return {
      totalRevenue: Math.round(totalRevenue),
      bookedDays,
      occupancyRate: Math.round((bookedDays / 30) * 100),
      avgPrice: Math.round(totalRevenue / bookedDays)
    }
  })()

  const revenueDiff = suggestedStrategy.totalRevenue - currentStrategy.totalRevenue
  const revenueIncrease = ((revenueDiff / currentStrategy.totalRevenue) * 100).toFixed(1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Mô phỏng chiến lược giá</h2>
        <p className="text-muted-foreground">
          Thử nghiệm các mức giá khác nhau và xem ảnh hưởng đến doanh thu
        </p>
      </div>

      {/* Quick Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Giá hiện tại</h3>
            <Badge variant="outline">Đang áp dụng</Badge>
          </div>
          <p className="text-3xl font-bold text-foreground mb-2">
            {currentPrice.toLocaleString("vi-VN")}₫
          </p>
          <p className="text-sm text-muted-foreground">/ đêm</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-white border-2 border-green-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Giá đề xuất</h3>
            <Badge className="bg-green-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              +{priceDiff.toFixed(1)}%
            </Badge>
          </div>
          <p className="text-3xl font-bold text-green-600 mb-2">
            {suggestedPrice.toLocaleString("vi-VN")}₫
          </p>
          <p className="text-sm text-muted-foreground">/ đêm</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Doanh thu dự kiến</h3>
            <Badge variant="outline" className="text-purple-600">
              30 ngày
            </Badge>
          </div>
          <p className="text-3xl font-bold text-purple-600 mb-2">
            +{revenueIncrease}%
          </p>
          <p className="text-sm text-muted-foreground">
            +{revenueDiff.toLocaleString("vi-VN")}₫
          </p>
        </Card>
      </div>

      {/* Pricing Strategy Builder */}
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-6">Tùy chỉnh chiến lược giá</h3>

        <div className="space-y-6">
          {/* Base Price */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Giá cơ bản (ngày thường)</Label>
              <span className="font-bold text-primary">{basePrice.toLocaleString("vi-VN")}₫</span>
            </div>
            <Slider
              value={[basePrice]}
              onValueChange={(value) => setBasePrice(value[0])}
              min={1000000}
              max={5000000}
              step={50000}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>1,000,000₫</span>
              <span>5,000,000₫</span>
            </div>
          </div>

          {/* Weekend Multiplier */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Hệ số cuối tuần</Label>
              <span className="font-bold text-blue-600">×{weekendMultiplier.toFixed(1)}</span>
            </div>
            <Slider
              value={[weekendMultiplier * 10]}
              onValueChange={(value) => setWeekendMultiplier(value[0] / 10)}
              min={10}
              max={20}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>×1.0</span>
              <span>×2.0</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Giá cuối tuần: {(basePrice * weekendMultiplier).toLocaleString("vi-VN")}₫
            </p>
          </div>

          {/* Peak Season Multiplier */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Hệ số mùa cao điểm</Label>
              <span className="font-bold text-orange-600">×{peakSeasonMultiplier.toFixed(1)}</span>
            </div>
            <Slider
              value={[peakSeasonMultiplier * 10]}
              onValueChange={(value) => setPeakSeasonMultiplier(value[0] / 10)}
              min={10}
              max={25}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>×1.0</span>
              <span>×2.5</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Giá cao điểm: {(basePrice * peakSeasonMultiplier).toLocaleString("vi-VN")}₫
            </p>
          </div>

          {/* Long Stay Discount */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Giảm giá đặt dài hạn (7+ đêm)</Label>
              <span className="font-bold text-green-600">-{(minNightsDiscount * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[minNightsDiscount * 100]}
              onValueChange={(value) => setMinNightsDiscount(value[0] / 100)}
              min={0}
              max={30}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>0%</span>
              <span>30%</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Revenue Projection */}
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-6">Dự báo doanh thu 30 ngày</h3>

        <Tabs defaultValue="comparison">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="comparison">So sánh</TabsTrigger>
            <TabsTrigger value="calendar">Lịch giá</TabsTrigger>
          </TabsList>

          <TabsContent value="comparison" className="space-y-6">
            <div className="grid grid-cols-2 gap-6 mt-6">
              {/* Current Strategy */}
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                  Chiến lược hiện tại
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tổng doanh thu</span>
                    <span className="font-bold">{currentStrategy.totalRevenue.toLocaleString("vi-VN")}₫</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Số đêm đã đặt</span>
                    <span className="font-bold">{currentStrategy.bookedDays}/30</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tỷ lệ lấp đầy</span>
                    <span className="font-bold">{currentStrategy.occupancyRate}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Giá TB/đêm</span>
                    <span className="font-bold">{currentStrategy.avgPrice.toLocaleString("vi-VN")}₫</span>
                  </div>
                </div>
              </div>

              {/* Suggested Strategy */}
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  Chiến lược đề xuất
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tổng doanh thu</span>
                    <span className="font-bold text-green-600">
                      {suggestedStrategy.totalRevenue.toLocaleString("vi-VN")}₫
                      <span className="text-xs ml-1">
                        (+{revenueIncrease}%)
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Số đêm đã đặt</span>
                    <span className="font-bold">{suggestedStrategy.bookedDays}/30</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tỷ lệ lấp đầy</span>
                    <span className="font-bold">{suggestedStrategy.occupancyRate}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Giá TB/đêm</span>
                    <span className="font-bold">{suggestedStrategy.avgPrice.toLocaleString("vi-VN")}₫</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t">
              <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-900 mb-1">
                    Tăng {revenueIncrease}% doanh thu với chiến lược mới
                  </p>
                  <p className="text-sm text-green-700">
                    Bạn có thể kiếm thêm {revenueDiff.toLocaleString("vi-VN")}₫ trong 30 ngày tới
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="calendar">
            <div className="grid grid-cols-7 gap-2 mt-6">
              {currentStrategy.days.map((day) => (
                <div
                  key={day.day}
                  className={`
                    p-3 rounded-lg border text-center transition-all cursor-pointer hover:shadow-md
                    ${day.booked 
                      ? "bg-primary/10 border-primary" 
                      : "bg-muted/50 border-border"
                    }
                  `}
                >
                  <p className="text-xs text-muted-foreground mb-1">Ngày {day.day}</p>
                  <p className="text-sm font-bold">
                    {(day.price / 1000).toFixed(0)}k
                  </p>
                  {day.booked && (
                    <p className="text-xs text-primary mt-1">Đã đặt</p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center space-x-6 mt-6 pt-6 border-t">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-primary/10 border border-primary"></div>
                <span className="text-sm">Đã đặt</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-muted/50 border border-border"></div>
                <span className="text-sm">Còn trống</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="lg">
          <Calendar className="w-4 h-4 mr-2" />
          Lưu nháp
        </Button>
        <Button size="lg" className="bg-green-600 hover:bg-green-700">
          Áp dụng chiến lược này
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
