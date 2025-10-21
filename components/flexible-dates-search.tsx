'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Clock, MapPin, TrendingDown } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function FlexibleDatesSearch() {
  const router = useRouter()
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [selectedDuration, setSelectedDuration] = useState<string>('')
  const [selectedRegion, setSelectedRegion] = useState<string>('')

  const months = [
    { id: 'jan', name: 'Tháng 1', avgPrice: 850000, discount: 15 },
    { id: 'feb', name: 'Tháng 2', avgPrice: 920000, discount: 10 },
    { id: 'mar', name: 'Tháng 3', avgPrice: 780000, discount: 20 },
    { id: 'apr', name: 'Tháng 4', avgPrice: 950000, discount: 5 },
    { id: 'may', name: 'Tháng 5', avgPrice: 880000, discount: 12 },
    { id: 'jun', name: 'Tháng 6', avgPrice: 1100000, discount: 0 },
  ]

  const durations = [
    { id: '1-2', name: '1-2 đêm', icon: '🌙' },
    { id: '3-5', name: '3-5 đêm', icon: '🌟' },
    { id: '6-10', name: '6-10 đêm', icon: '✨' },
    { id: '10+', name: '10+ đêm', icon: '🎉' },
  ]

  const regions = [
    { id: 'north', name: 'Miền Bắc', cities: 'Hà Nội, Sapa, Hạ Long' },
    { id: 'central', name: 'Miền Trung', cities: 'Đà Nẵng, Hội An, Huế' },
    { id: 'south', name: 'Miền Nam', cities: 'Sài Gòn, Vũng Tàu, Đà Lạt' },
    { id: 'islands', name: 'Đảo & Biển', cities: 'Phú Quốc, Nha Trang, Côn Đảo' },
  ]

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (selectedMonth) params.append('month', selectedMonth)
    if (selectedDuration) params.append('duration', selectedDuration)
    if (selectedRegion) params.append('region', selectedRegion)
    params.append('flexible', 'true')
    router.push(`/search?${params.toString()}`)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  return (
    <section className="py-16 bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
            <Calendar className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-primary">Tìm kiếm linh hoạt</span>
          </div>
          <h2 className="font-serif text-3xl font-bold mb-2">
            Chưa quyết định ngày cụ thể?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Tìm kiếm theo tháng, theo độ dài chuyến đi để được giá tốt nhất và nhiều lựa chọn hơn
          </p>
        </div>

        <Card className="max-w-5xl mx-auto shadow-xl border-0">
          <CardContent className="p-6 md:p-8">
            <Tabs defaultValue="month" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="month">Theo tháng</TabsTrigger>
                <TabsTrigger value="duration">Độ dài chuyến</TabsTrigger>
                <TabsTrigger value="region">Vùng miền</TabsTrigger>
              </TabsList>

              <TabsContent value="month" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {months.map((month) => (
                    <button
                      key={month.id}
                      onClick={() => setSelectedMonth(month.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-left hover:border-primary hover:shadow-md ${
                        selectedMonth === month.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border'
                      }`}
                    >
                      <div className="font-semibold mb-1">{month.name}</div>
                      <div className="text-sm text-muted-foreground mb-2">
                        TB: {formatCurrency(month.avgPrice)}/đêm
                      </div>
                      {month.discount > 0 && (
                        <div className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                          <TrendingDown className="w-3 h-3" />
                          Giảm {month.discount}%
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="duration" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {durations.map((duration) => (
                    <button
                      key={duration.id}
                      onClick={() => setSelectedDuration(duration.id)}
                      className={`p-6 rounded-xl border-2 transition-all text-center hover:border-primary hover:shadow-md ${
                        selectedDuration === duration.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border'
                      }`}
                    >
                      <div className="text-3xl mb-2">{duration.icon}</div>
                      <div className="font-semibold">{duration.name}</div>
                    </button>
                  ))}
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-900">
                      <strong>Mẹo tiết kiệm:</strong> Đặt phòng từ 7 đêm trở lên thường được giảm giá từ 20-30%
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="region" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {regions.map((region) => (
                    <button
                      key={region.id}
                      onClick={() => setSelectedRegion(region.id)}
                      className={`p-5 rounded-xl border-2 transition-all text-left hover:border-primary hover:shadow-md ${
                        selectedRegion === region.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-primary mt-1" />
                        <div>
                          <div className="font-semibold text-lg mb-1">{region.name}</div>
                          <div className="text-sm text-muted-foreground">{region.cities}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-6 pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                {(selectedMonth || selectedDuration || selectedRegion) ? (
                  <span className="font-medium text-foreground">
                    ✓ Đã chọn {[selectedMonth, selectedDuration, selectedRegion].filter(Boolean).length} bộ lọc
                  </span>
                ) : (
                  'Chọn ít nhất một tùy chọn để tìm kiếm'
                )}
              </div>
              <Button
                size="lg"
                onClick={handleSearch}
                disabled={!selectedMonth && !selectedDuration && !selectedRegion}
                className="w-full md:w-auto px-8"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Tìm chỗ nghỉ linh hoạt
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
