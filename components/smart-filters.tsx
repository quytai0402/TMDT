"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { 
  Sparkles, 
  Zap, 
  Heart,
  TrendingUp,
  Award,
  Tag,
  X
} from "lucide-react"

interface SmartFilter {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  active: boolean
  reason: string
}

export function SmartFilters() {
  const [filters, setFilters] = useState<SmartFilter[]>([
    {
      id: "perfect-match",
      name: "Perfect Match",
      description: "Khớp với sở thích của bạn 95%+",
      icon: <Sparkles className="h-4 w-4" />,
      active: true,
      reason: "Dựa trên 15 lượt xem gần đây"
    },
    {
      id: "instant-book",
      name: "Đặt ngay",
      description: "Không cần chờ duyệt",
      icon: <Zap className="h-4 w-4" />,
      active: false,
      reason: "Tiết kiệm thời gian"
    },
    {
      id: "verified-host",
      name: "Host đã xác minh",
      description: "Đánh giá 4.8+ với 50+ reviews",
      icon: <Award className="h-4 w-4" />,
      active: true,
      reason: "An toàn & tin cậy"
    },
    {
      id: "hot-deals",
      name: "Ưu đãi hot",
      description: "Giảm 15%+ trong 24h",
      icon: <Tag className="h-4 w-4" />,
      active: false,
      reason: "Tiết kiệm ngân sách"
    },
    {
      id: "trending",
      name: "Đang thịnh hành",
      description: "Top 100 được xem nhiều",
      icon: <TrendingUp className="h-4 w-4" />,
      active: false,
      reason: "Lựa chọn phổ biến"
    }
  ])

  const [priceRange, setPriceRange] = useState([1000000, 5000000])
  const [useAI, setUseAI] = useState(true)

  const toggleFilter = (id: string) => {
    setFilters(filters.map(f => 
      f.id === id ? { ...f, active: !f.active } : f
    ))
  }

  const activeFiltersCount = filters.filter(f => f.active).length

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Smart Filters
          </CardTitle>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary">
              {activeFiltersCount} đang áp dụng
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* AI Toggle */}
        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <Label htmlFor="ai-mode" className="font-semibold">
                AI Recommendations
              </Label>
            </div>
            <Switch
              id="ai-mode"
              checked={useAI}
              onCheckedChange={setUseAI}
            />
          </div>
          <p className="text-xs text-gray-600">
            Tự động lọc dựa trên sở thích và hành vi của bạn
          </p>
        </div>

        {/* Price Range */}
        <div className="space-y-3">
          <Label className="font-semibold">Khoảng giá gợi ý</Label>
          <div className="px-2">
            <Slider
              value={priceRange}
              onValueChange={setPriceRange}
              min={500000}
              max={10000000}
              step={500000}
              className="mb-4"
            />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              {priceRange[0].toLocaleString('vi-VN')} ₫
            </span>
            <span className="text-gray-600">
              {priceRange[1].toLocaleString('vi-VN')} ₫
            </span>
          </div>
          <p className="text-xs text-purple-600">
            <Sparkles className="h-3 w-3 inline mr-1" />
            Dựa trên 80% lịch sử tìm kiếm của bạn
          </p>
        </div>

        {/* Smart Filters */}
        <div className="space-y-3">
          <Label className="font-semibold">Bộ lọc thông minh</Label>
          <div className="space-y-2">
            {filters.map((filter) => (
              <div
                key={filter.id}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  filter.active
                    ? 'border-purple-300 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => toggleFilter(filter.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`${filter.active ? 'text-purple-600' : 'text-gray-400'}`}>
                      {filter.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{filter.name}</div>
                      <div className="text-xs text-gray-600">{filter.description}</div>
                    </div>
                  </div>
                  <Switch
                    checked={filter.active}
                    onCheckedChange={() => toggleFilter(filter.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                {filter.active && (
                  <div className="mt-2 text-xs text-purple-600 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    {filter.reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <Button className="w-full gap-2">
            <Sparkles className="h-4 w-4" />
            Áp dụng AI Filters
          </Button>
          {activeFiltersCount > 0 && (
            <Button 
              variant="outline" 
              className="w-full gap-2"
              onClick={() => setFilters(filters.map(f => ({ ...f, active: false })))}
            >
              <X className="h-4 w-4" />
              Xóa tất cả ({activeFiltersCount})
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="p-3 bg-gray-50 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600 mb-1">234</div>
          <div className="text-xs text-gray-600">
            Kết quả phù hợp với bạn
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
