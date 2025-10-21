"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Calendar, TrendingDown, CheckCircle2, Sparkles } from "lucide-react"
import { useState } from "react"
import { Separator } from "@/components/ui/separator"

interface MonthlyStayCalculatorProps {
  dailyPrice: number
  currency?: string
}

export function MonthlyStayCalculator({ 
  dailyPrice,
  currency = "VND" 
}: MonthlyStayCalculatorProps) {
  const [nights, setNights] = useState(30)

  // Calculate discounts based on stay duration
  const getDiscount = (nights: number) => {
    if (nights >= 90) return 30
    if (nights >= 60) return 25
    if (nights >= 30) return 20
    if (nights >= 14) return 10
    if (nights >= 7) return 5
    return 0
  }

  const discount = getDiscount(nights)
  const normalTotal = dailyPrice * nights
  const discountAmount = normalTotal * (discount / 100)
  const finalTotal = normalTotal - discountAmount
  const pricePerNight = finalTotal / nights

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(Math.round(price))
  }

  const discountTiers = [
    { nights: 7, discount: 5, label: "1 tuần" },
    { nights: 14, discount: 10, label: "2 tuần" },
    { nights: 30, discount: 20, label: "1 tháng" },
    { nights: 60, discount: 25, label: "2 tháng" },
    { nights: 90, discount: 30, label: "3 tháng" }
  ]

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
            <Calendar className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Ưu đãi lưu trú dài hạn</h3>
            <p className="text-sm text-muted-foreground">
              Tiết kiệm đến 30% khi ở từ 3 tháng trở lên
            </p>
          </div>
        </div>
        <Badge className="bg-gradient-to-r from-purple-600 to-pink-600">
          <Sparkles className="w-3 h-3 mr-1" />
          Workation
        </Badge>
      </div>

      {/* Nights Slider */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Số đêm lưu trú</label>
          <div className="text-right">
            <span className="text-2xl font-bold">{nights}</span>
            <span className="text-sm text-muted-foreground ml-1">đêm</span>
          </div>
        </div>
        <Slider
          value={[nights]}
          onValueChange={(value) => setNights(value[0])}
          min={1}
          max={90}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1 đêm</span>
          <span>90 đêm</span>
        </div>
      </div>

      {/* Current Discount */}
      {discount > 0 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingDown className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-green-900 dark:text-green-100">
              Giảm giá {discount}% cho {nights >= 30 ? Math.floor(nights / 30) : ''}
              {nights >= 30 && nights < 60 ? ' tháng' : ''}
              {nights >= 60 && nights < 90 ? ' tháng' : ''}
              {nights >= 90 ? ' tháng' : ''}
              {nights < 30 ? ` ${nights} đêm` : ''}
            </span>
          </div>
          <p className="text-sm text-green-700 dark:text-green-300">
            Tiết kiệm được: {formatPrice(discountAmount)}₫
          </p>
        </div>
      )}

      {/* Price Breakdown */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {formatPrice(dailyPrice)}₫ x {nights} đêm
          </span>
          <span className="font-medium">{formatPrice(normalTotal)}₫</span>
        </div>
        
        {discount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-600 dark:text-green-400">
              Giảm giá lưu trú dài ({discount}%)
            </span>
            <span className="font-medium text-green-600 dark:text-green-400">
              -{formatPrice(discountAmount)}₫
            </span>
          </div>
        )}

        <Separator />

        <div className="flex items-center justify-between">
          <span className="font-semibold">Tổng cộng</span>
          <div className="text-right">
            <div className="text-2xl font-bold">{formatPrice(finalTotal)}₫</div>
            {discount > 0 && (
              <div className="text-xs text-muted-foreground line-through">
                {formatPrice(normalTotal)}₫
              </div>
            )}
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          ≈ {formatPrice(pricePerNight)}₫/đêm
        </div>
      </div>

      {/* Discount Tiers */}
      <div className="mb-6">
        <h4 className="font-medium text-sm mb-3">Mức giảm giá theo thời gian</h4>
        <div className="space-y-2">
          {discountTiers.map((tier) => (
            <div
              key={tier.nights}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                nights >= tier.nights
                  ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                  : 'border-border bg-muted/30'
              }`}
            >
              <div className="flex items-center space-x-2">
                {nights >= tier.nights && (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                )}
                <span className={`text-sm ${nights >= tier.nights ? 'font-medium' : ''}`}>
                  {tier.label}+
                </span>
              </div>
              <Badge
                variant={nights >= tier.nights ? "default" : "outline"}
                className={nights >= tier.nights ? "bg-green-600" : ""}
              >
                Giảm {tier.discount}%
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Button */}
      <Button className="w-full" size="lg">
        <Calendar className="w-4 h-4 mr-2" />
        Đặt {nights} đêm ngay
      </Button>

      {/* Additional Benefits */}
      <div className="mt-6 space-y-2">
        <h4 className="font-medium text-sm">Ưu đãi thêm khi ở dài hạn</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-muted-foreground">Dọn phòng 2 lần/tuần miễn phí</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-muted-foreground">Giặt ủi miễn phí (1 lần/tuần)</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-muted-foreground">Hủy linh hoạt (hoàn tiền 50% nếu hủy trước 7 ngày)</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-muted-foreground">Hỗ trợ ưu tiên 24/7</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
