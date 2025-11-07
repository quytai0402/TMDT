"use client"

import { useEffect, useMemo, useState } from "react"
import { Sparkles, TrendingUp, Calculator, Target, Zap, Info, Loader2 } from "lucide-react"

import { HostLayout } from "@/components/host-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AIPricingSuggestions } from "@/components/ai-pricing-suggestions"
import { PricingSimulator } from "@/components/pricing-simulator"

type HostListing = {
  id: string
  title: string
  city?: string | null
  basePrice?: number | null
  occupancyRate?: number | null
  weekendMultiplier?: number | null
  monthlyDiscount?: number | null
}

export default function SmartPricingPage() {
  const [listings, setListings] = useState<HostListing[]>([])
  const [selectedListingId, setSelectedListingId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadListings = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch("/api/listings?hostId=me", { cache: "no-store" })
        if (!response.ok) {
          throw new Error("Không thể tải danh sách căn hộ")
        }
        const data = await response.json()
        const items = Array.isArray(data?.listings) ? (data.listings as HostListing[]) : []
        setListings(items)
        if (items.length) {
          setSelectedListingId(items[0].id)
        }
      } catch (err) {
        console.error(err)
        setError((err as Error).message)
      } finally {
        setIsLoading(false)
      }
    }

    loadListings()
  }, [])

  const selectedListing = useMemo(
    () => listings.find((listing) => listing.id === selectedListingId) ?? null,
    [listings, selectedListingId],
  )

  return (
    <HostLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <h1 className="text-3xl font-bold">Smart Pricing Assistant</h1>
              <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <Sparkles className="mr-1 h-3 w-3" />
                AI Powered
              </Badge>
            </div>
            <p className="text-muted-foreground">Tối ưu giá dựa trên dữ liệu thị trường và hiệu suất thực tế</p>
          </div>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="w-full md:w-64">
              <Select value={selectedListingId} onValueChange={setSelectedListingId} disabled={!listings.length}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn căn hộ" />
                </SelectTrigger>
                <SelectContent>
                  {listings.map((listing) => (
                    <SelectItem key={listing.id} value={listing.id}>
                      {listing.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Info className="mr-2 h-4 w-4" />
                Hướng dẫn
              </Button>
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600">
                <Zap className="mr-2 h-4 w-4" />
                Kích hoạt Auto-pricing
              </Button>
            </div>
          </div>
        </div>

        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 p-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="mb-1 font-semibold">Tăng doanh thu</h4>
                <p className="text-sm text-muted-foreground">Đề xuất dựa trên occupancy và nhu cầu</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
                <Calculator className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h4 className="mb-1 font-semibold">Giảm thời gian thao tác</h4>
                <p className="text-sm text-muted-foreground">Không cần cập nhật giá thủ công hằng ngày</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-green-500/10">
                <Target className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="mb-1 font-semibold">Giữ giá cạnh tranh</h4>
                <p className="text-sm text-muted-foreground">So sánh liên tục với thị trường xung quanh</p>
              </div>
            </div>
          </div>
        </Card>

        {error && (
          <Card className="border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </Card>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : listings.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Bạn chưa có căn hộ nào. Hãy tạo listing để sử dụng Smart Pricing.</p>
          </Card>
        ) : (
          <Tabs defaultValue="suggestions" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="suggestions" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span>Đề xuất từ AI</span>
              </TabsTrigger>
              <TabsTrigger value="simulator" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                <span>Mô phỏng chiến lược</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="suggestions">
              <AIPricingSuggestions listing={selectedListing} />
            </TabsContent>

            <TabsContent value="simulator">
              <PricingSimulator listing={selectedListing} />
            </TabsContent>
          </Tabs>
        )}

        <Card className="mt-8 p-6">
          <h3 className="mb-6 text-xl font-bold">Cách Smart Pricing hoạt động</h3>
          <div className="grid gap-6 md:grid-cols-4">
            {["Thu thập dữ liệu", "Dự đoán nhu cầu", "Tạo đề xuất", "Tự động áp dụng"].map((step, index) => (
              <div key={step} className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <span className="text-xl font-bold">{index + 1}</span>
                </div>
                <h4 className="mb-2 font-semibold">{step}</h4>
                <p className="text-sm text-muted-foreground">
                  {index === 0 && "AI phân tích đội giá đối thủ, occupancy và sự kiện địa phương"}
                  {index === 1 && "Dự báo nhu cầu, occupancy rate và xu hướng sắp tới"}
                  {index === 2 && "Đề xuất mức giá tối ưu và giải thích chi tiết"}
                  {index === 3 && "Bạn có thể áp dụng ngay hoặc kết nối auto-pricing"}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </HostLayout>
  )
}
