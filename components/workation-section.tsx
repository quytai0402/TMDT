"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Briefcase, Wifi, Laptop, Users, MapPin, Calendar, ChevronDown, ChevronUp } from "lucide-react"
import { WiFiSpeedTest } from "@/components/wifi-speed-test"
import { WorkspaceShowcase } from "@/components/workspace-showcase"
import { CoWorkingSpacesNearby } from "@/components/coworking-spaces-nearby"
import { MonthlyStayCalculator } from "@/components/monthly-stay-calculator"
import { useEffect, useMemo, useState } from "react"

interface WorkationWorkspace {
  id: string
  name: string
  image: string
  features: string[]
}

interface WorkationSummary {
  dedicatedDesks: number
  focusZones: number
  coworkingCount: number
  minCoworkPrice?: number | null
  longStayDiscount?: number | null
  ergonomicSeating: boolean
}

interface WorkationWifi {
  download: number
  upload: number
  ping: number
  reliability: number
  lastTested: string
}

interface WorkationResponse {
  workspaces: WorkationWorkspace[]
  summary: WorkationSummary | null
  wifi: WorkationWifi | null
  coworkingSpaces: Array<{
    id: string
    name: string
    images?: string[]
    basePrice?: number | null
    currency?: string | null
    averageRating?: number | null
    totalReviews?: number | null
    distanceKm?: number | null
    city?: string | null
    latitude?: number | null
    longitude?: number | null
    amenities?: string[]
    features?: string[]
  }>
}

interface WorkationSectionProps {
  listingId: string
  dailyPrice: number
  listingCity?: string
  listingLat?: number
  listingLng?: number
  wifiSpeed?: {
    download: number
    upload: number
    ping: number
    lastTested?: string
  }
}

export function WorkationSection({ 
  listingId,
  dailyPrice,
  listingCity,
  listingLat,
  listingLng,
  wifiSpeed 
}: WorkationSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [workationData, setWorkationData] = useState<WorkationResponse | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let ignore = false

    const fetchWorkation = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/listings/${listingId}/workspaces`, {
          cache: "no-store",
        })

        if (!res.ok) {
          throw new Error("Failed to load workation data")
        }

        const data: WorkationResponse = await res.json()
        if (!ignore) {
          setWorkationData(data)
        }
      } catch (error) {
        console.error("Error fetching workation data:", error)
        if (!ignore) {
          setWorkationData(null)
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    fetchWorkation()

    return () => {
      ignore = true
    }
  }, [listingId])

  const wifiData: WorkationWifi = useMemo(() => {
    if (wifiSpeed) {
      return {
        download: wifiSpeed.download,
        upload: wifiSpeed.upload,
        ping: wifiSpeed.ping,
        reliability: 98,
        lastTested: wifiSpeed.lastTested ?? "Gần đây",
      }
    }

    if (workationData?.wifi) {
      return workationData.wifi
    }

    return {
      download: 287,
      upload: 145,
      ping: 12,
      reliability: 98,
      lastTested: "5 ngày trước",
    }
  }, [wifiSpeed, workationData?.wifi])

  const summary = workationData?.summary
  const coworkingSpaces = useMemo(
    () => workationData?.coworkingSpaces ?? [],
    [workationData?.coworkingSpaces],
  )

  const coworkingCount = summary?.coworkingCount ?? coworkingSpaces.length
  const focusZones = summary?.focusZones ?? 3
  const deskCount = summary?.dedicatedDesks ?? 4
  const longStayDiscount = summary?.longStayDiscount ?? null
  const minCoworkPrice = useMemo(() => {
    if (summary?.minCoworkPrice && summary.minCoworkPrice > 0) {
      return summary.minCoworkPrice
    }

    const candidates = coworkingSpaces
      .map((space) => space.basePrice ?? null)
      .filter((value): value is number => typeof value === "number" && value > 0)

    if (candidates.length === 0) return null
    return Math.min(...candidates)
  }, [summary?.minCoworkPrice, coworkingSpaces])

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value)

  return (
    <div className="space-y-6">
      {/* Compact Header - Always Visible */}
      <Card 
        className="p-6 cursor-pointer hover:shadow-md transition-all"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="p-2 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
              <Briefcase className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="font-semibold text-lg">Bạn cần không gian làm việc?</h3>
                <Badge className="bg-gradient-to-r from-purple-600 to-blue-600">
                  <Briefcase className="w-3 h-3 mr-1" />
                  Workation Ready
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Không gian làm việc chuyên nghiệp với WiFi cao tốc và đầy đủ tiện nghi.
                {!isExpanded && " Nhấn để xem chi tiết."}
              </p>
              {!isExpanded && (
                <div className="flex items-center space-x-4 mt-3 text-sm">
                  <span className="flex items-center space-x-1">
                    <Wifi className="w-4 h-4 text-blue-600" />
                    <span>{wifiData.download} Mbps</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Laptop className="w-4 h-4 text-purple-600" />
                    <span>
                      {deskCount} bàn làm việc
                    </span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4 text-green-600" />
                    <span>
                      {longStayDiscount
                        ? `Giảm ${longStayDiscount}% ở dài hạn`
                        : minCoworkPrice
                        ? `Coworking từ ${formatCurrency(minCoworkPrice)}`
                        : "Hỗ trợ Workation"}
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" className="ml-4">
            {isExpanded ? (
              <>
                <ChevronUp className="w-5 h-5" />
              </>
            ) : (
              <>
                <ChevronDown className="w-5 h-5" />
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
          {/* Feature Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 text-center hover:shadow-md transition-shadow">
              <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-3">
                <Wifi className="w-6 h-6 text-blue-600" />
              </div>
              <p className="font-semibold mb-1">
                {loading ? "…" : `${wifiData.download} Mbps`}
              </p>
              <p className="text-xs text-muted-foreground">Tốc độ Internet</p>
            </Card>

            <Card className="p-4 text-center hover:shadow-md transition-shadow">
              <div className="mx-auto w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mb-3">
                <Laptop className="w-6 h-6 text-purple-600" />
              </div>
              <p className="font-semibold mb-1">
                {loading ? "…" : `${focusZones} khu vực`}
              </p>
              <p className="text-xs text-muted-foreground">Không gian làm việc chuyên dụng</p>
            </Card>

            <Card className="p-4 text-center hover:shadow-md transition-shadow">
              <div className="mx-auto w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mb-3">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <p className="font-semibold mb-1">
                {loading ? "…" : `${coworkingCount} đối tác`}
              </p>
              <p className="text-xs text-muted-foreground">Co-working trong bán kính 5km</p>
            </Card>

            <Card className="p-4 text-center hover:shadow-md transition-shadow">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-3">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <p className="font-semibold mb-1">
                {loading
                  ? "…"
                  : longStayDiscount
                  ? `Giảm ${longStayDiscount}%`
                  : minCoworkPrice
                  ? formatCurrency(minCoworkPrice)
                  : `Ưu đãi Workation`}
              </p>
              <p className="text-xs text-muted-foreground">
                {longStayDiscount ? "Ở từ 1 tháng" : "Vé ngày coworking đối tác"}
              </p>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="wifi" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="wifi" className="text-xs md:text-sm">
                <Wifi className="w-4 h-4 mr-2" />
                WiFi
              </TabsTrigger>
              <TabsTrigger value="workspace" className="text-xs md:text-sm">
                <Laptop className="w-4 h-4 mr-2" />
                Workspace
              </TabsTrigger>
              <TabsTrigger value="coworking" className="text-xs md:text-sm">
                <MapPin className="w-4 h-4 mr-2" />
                Co-working
              </TabsTrigger>
              <TabsTrigger value="pricing" className="text-xs md:text-sm">
                <Calendar className="w-4 h-4 mr-2" />
                Dài hạn
              </TabsTrigger>
            </TabsList>

            <TabsContent value="wifi" className="mt-6">
              <WiFiSpeedTest
                downloadSpeed={wifiData.download}
                uploadSpeed={wifiData.upload}
                ping={wifiData.ping}
                lastTested={wifiData.lastTested}
                reliability={wifiData.reliability}
              />
            </TabsContent>

            <TabsContent value="workspace" className="mt-6">
              <WorkspaceShowcase
                workspaces={workationData?.workspaces ?? []}
                isLoading={loading}
              />
            </TabsContent>

          <TabsContent value="coworking" className="mt-6">
            <CoWorkingSpacesNearby
              listingCity={listingCity}
              listingLat={listingLat}
              listingLng={listingLng}
              initialSpaces={coworkingSpaces}
              isLoading={loading}
            />
          </TabsContent>

            <TabsContent value="pricing" className="mt-6">
              <MonthlyStayCalculator dailyPrice={dailyPrice} />
            </TabsContent>
          </Tabs>

          {/* Additional Info */}
          <Card className="p-6 bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-900/10 dark:via-blue-900/10 dark:to-indigo-900/10 border-purple-200 dark:border-purple-800">
            <h3 className="font-semibold mb-3 flex items-center">
              <Briefcase className="w-5 h-5 mr-2 text-purple-600" />
              Tại sao chọn nơi này cho Workation?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">✓ Internet ổn định:</span> Được kiểm tra định kỳ, đảm bảo không bị gián đoạn
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">✓ Không gian yên tĩnh:</span> Phòng riêng biệt, cách âm tốt
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">✓ Thiết bị đầy đủ:</span> {summary?.ergonomicSeating
                    ? "Ghế công thái học, màn hình phụ, đèn bàn"
                    : "Bàn lớn, đèn bàn và ổ cắm đa năng"}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">✓ Cộng đồng gần đây:</span> {coworkingCount > 0
                    ? `Kết nối ${coworkingCount} coworking partner xung quanh`
                    : "Dễ dàng networking với digital nomads khác"}
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">✓ Giá ưu đãi dài hạn:</span> Giảm đến 30% cho lưu trú 3 tháng+
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">✓ Hỗ trợ 24/7:</span> Chủ nhà luôn sẵn sàng hỗ trợ technical issues
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
