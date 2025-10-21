"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  MapPin,
  Calendar,
  Users,
  SlidersHorizontal,
  BadgeCheck,
  Sparkles,
  Compass,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"

const MIN_PRICE = 100_000
const MAX_PRICE = 10_000_000

export function SearchBar() {
  const router = useRouter()
  const { toast } = useToast()
  const [location, setLocation] = useState("")
  const [checkIn, setCheckIn] = useState("")
  const [checkOut, setCheckOut] = useState("")
  const [guests, setGuests] = useState(1)
  const [priceRange, setPriceRange] = useState<[number, number]>([MIN_PRICE, 5_000_000])
  const [amenities, setAmenities] = useState<string[]>([])
  const [experiences, setExperiences] = useState<string[]>([])
  const [policies, setPolicies] = useState<string[]>([])
  const [searchIntent, setSearchIntent] = useState("")
  const [dateFlex, setDateFlex] = useState("weekends")
  const [tripLength, setTripLength] = useState("3-5")
  const [searching, setSearching] = useState(false)

  const handleSearch = async () => {
    if (searching) return

    setSearching(true)
    const params = new URLSearchParams()

    let aiParams: {
      location?: string
      propertyType?: string
      guests?: number
      priceRange?: { min?: number; max?: number }
      amenities?: string[]
    } = {}

    try {
      if (searchIntent.trim()) {
        const response = await fetch('/api/ai/search-semantic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: searchIntent.trim() }),
        })

        if (response.ok) {
          const data = await response.json()
          aiParams = data.parsedParams || {}
        } else {
          toast({
            variant: 'destructive',
            title: 'Không thể phân tích câu hỏi',
            description: 'Hệ thống sẽ dùng bộ lọc hiện có.',
          })
        }
      }

      const effectiveLocation = (aiParams.location || location).trim()
      if (effectiveLocation) {
        params.set('city', effectiveLocation)
      }

      if (checkIn) {
        params.set('checkIn', checkIn)
      }

      if (checkOut) {
        params.set('checkOut', checkOut)
      }

      const effectiveGuests = aiParams.guests && aiParams.guests > 0 ? aiParams.guests : guests
      if (effectiveGuests > 0) {
        params.set('guests', String(effectiveGuests))
      }

      const effectiveMinPrice = aiParams.priceRange?.min ?? priceRange[0]
      const effectiveMaxPrice = aiParams.priceRange?.max ?? priceRange[1]

      if (effectiveMinPrice > MIN_PRICE) {
        params.set('minPrice', String(Math.round(effectiveMinPrice)))
      }

      if (effectiveMaxPrice < MAX_PRICE) {
        params.set('maxPrice', String(Math.round(effectiveMaxPrice)))
      }

      const combinedAmenities = Array.from(new Set([...(amenities ?? []), ...(aiParams.amenities ?? [])]))
      if (combinedAmenities.length > 0) {
        params.set('amenities', combinedAmenities.join(','))
      }

      if (experiences.length > 0) {
        params.set('experiences', experiences.join(','))
      }

      if (policies.length > 0) {
        params.set('policies', policies.join(','))
      }

      const propertyType = aiParams.propertyType?.toUpperCase()
      if (propertyType) {
        params.set('propertyTypes', propertyType)
      }

      if (searchIntent.trim()) {
        params.set('q', searchIntent.trim())
      }

      if (dateFlex !== 'weekends') {
        params.set('flexMode', dateFlex)
      }

      if (tripLength !== '3-5') {
        params.set('tripLength', tripLength)
      }

      router.push(`/search?${params.toString()}`)
    } catch (error) {
      console.error('Intelligent search failed:', error)
      toast({
        variant: 'destructive',
        title: 'Không thể thực hiện tìm kiếm thông minh',
        description: 'Vui lòng kiểm tra kết nối và thử lại.',
      })
    } finally {
      setSearching(false)
    }
  }

  const toggleValue = (
    isChecked: boolean,
    currentValues: string[],
    setValues: (next: string[]) => void,
    value: string,
  ) => {
    if (isChecked) {
      setValues([...currentValues, value])
    } else {
      setValues(currentValues.filter((item) => item !== value))
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="rounded-3xl border border-border bg-gradient-to-br from-white via-slate-50 to-white shadow-[0_40px_80px_-60px_rgba(15,23,42,0.45)]">
        <div className="flex flex-col gap-5 p-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Trợ lý tìm kiếm thông minh</span>
              </div>
              <Button variant="ghost" size="sm" className="gap-2 text-primary">
                <Compass className="h-4 w-4" />
                Bản đồ tương tác
              </Button>
            </div>
            <Input
              value={searchIntent}
              onChange={(event) => setSearchIntent(event.target.value)}
              placeholder="Ví dụ: Biệt thự có hồ bơi riêng cho 10 người gần biển Vũng Tàu cuối tuần này"
              className="h-14 rounded-2xl border border-slate-200 bg-white/90 px-6 text-base shadow-inner focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <Tabs defaultValue="calendar" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-2xl border bg-white/80 p-1">
              <TabsTrigger value="calendar" className="rounded-xl text-sm font-semibold">
                Theo ngày cụ thể
              </TabsTrigger>
              <TabsTrigger value="flexible" className="rounded-xl text-sm font-semibold">
                Tôi linh hoạt
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calendar" className="pt-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                <div className="flex items-center space-x-3 rounded-xl border border-slate-200 bg-white/90 px-5 py-4 hover:bg-slate-50">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div className="min-w-0 flex-1">
                    <label className="mb-1 block text-xs font-bold text-slate-700">Địa điểm</label>
                    <input
                      type="text"
                      placeholder="Bạn muốn đi đâu?"
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                      className="w-full border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3 rounded-xl border border-slate-200 bg-white/90 px-5 py-4 hover:bg-slate-50">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div className="min-w-0 flex-1">
                    <label className="mb-1 block text-xs font-bold text-slate-700">Nhận phòng</label>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(event) => setCheckIn(event.target.value)}
                      className="w-full border-none bg-transparent text-sm text-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3 rounded-xl border border-slate-200 bg-white/90 px-5 py-4 hover:bg-slate-50">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div className="min-w-0 flex-1">
                    <label className="mb-1 block text-xs font-bold text-slate-700">Trả phòng</label>
                    <input
                      type="date"
                      value={checkOut}
                      onChange={(event) => setCheckOut(event.target.value)}
                      className="w-full border-none bg-transparent text-sm text-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3 rounded-xl border border-slate-200 bg-white/90 px-5 py-4 hover:bg-slate-50">
                  <Users className="h-5 w-5 text-primary" />
                  <div className="min-w-0 flex-1">
                    <label className="mb-1 block text-xs font-bold text-slate-700">Khách</label>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setGuests(Math.max(1, guests - 1))}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-sm font-semibold hover:border-primary"
                        aria-label="Giảm số lượng khách"
                      >
                        -
                      </button>
                      <span className="min-w-[2ch] text-center text-sm font-semibold text-slate-900">{guests}</span>
                      <button
                        onClick={() => setGuests(guests + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-sm font-semibold hover:border-primary"
                        aria-label="Tăng số lượng khách"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-14 w-14 rounded-xl border-slate-200 bg-white/90 hover:bg-slate-100"
                      >
                        <SlidersHorizontal className="h-5 w-5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[380px] space-y-6" align="end">
                      <div>
                        <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <BadgeCheck className="h-4 w-4 text-primary" />
                          Khoảng giá (VNĐ/đêm)
                        </h4>
                        <Slider
                          value={priceRange}
                          onValueChange={setPriceRange}
                          min={MIN_PRICE}
                          max={MAX_PRICE}
                          step={100000}
                          className="mb-2"
                        />
                        <div className="flex justify-between text-sm text-slate-500">
                          <span>{priceRange[0].toLocaleString("vi-VN")}₫</span>
                          <span>{priceRange[1].toLocaleString("vi-VN")}₫</span>
                        </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div>
                          <h4 className="mb-3 text-sm font-semibold text-slate-700">Tiện nghi nổi bật</h4>
                          <div className="space-y-3">
                            {["Wi-Fi tốc độ cao", "Bể bơi riêng", "Không gian làm việc", "Bếp đủ dụng cụ", "Máy pha cà phê", "Lối đi cho xe lăn"].map(
                              (amenity) => (
                                <div key={amenity} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={amenity}
                                    checked={amenities.includes(amenity)}
                                    onCheckedChange={(checked: boolean | string) =>
                                      toggleValue(checked === true, amenities, setAmenities, amenity)
                                    }
                                  />
                                  <Label htmlFor={amenity} className="text-sm text-slate-600">
                                    {amenity}
                                  </Label>
                                </div>
                              ),
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="mb-3 text-sm font-semibold text-slate-700">Trải nghiệm</h4>
                          <div className="space-y-3">
                            {["Gia đình", "Cặp đôi", "Tiệc & sự kiện", "BBQ ngoài trời", "View biển", "View núi"].map((experience) => (
                              <div key={experience} className="flex items-center space-x-2">
                                <Checkbox
                                  id={experience}
                                  checked={experiences.includes(experience)}
                                  onCheckedChange={(checked: boolean | string) =>
                                    toggleValue(checked === true, experiences, setExperiences, experience)
                                  }
                                />
                                <Label htmlFor={experience} className="text-sm text-slate-600">
                                  {experience}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="mb-3 text-sm font-semibold text-slate-700">Chính sách</h4>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          {["Mang thú cưng", "Hủy linh hoạt", "Check-in muộn", "Check-out muộn", "Thanh toán chia sẻ", "Thanh toán trả góp"].map(
                            (policy) => (
                              <div key={policy} className="flex items-center space-x-2">
                                <Checkbox
                                  id={policy}
                                  checked={policies.includes(policy)}
                                  onCheckedChange={(checked: boolean | string) =>
                                    toggleValue(checked === true, policies, setPolicies, policy)
                                  }
                                />
                                <Label htmlFor={policy} className="text-sm text-slate-600">
                                  {policy}
                                </Label>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Button
                    type="button"
                    onClick={handleSearch}
                    disabled={searching}
                    size="lg"
                    className="flex-1 rounded-xl bg-primary px-6 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
                  >
                    {searching ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-5 w-5" />
                        Tìm kiếm
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="flexible" className="pt-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white/90 p-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary">Khoảng thời gian</p>
                  <div className="grid gap-2">
                    {["Cuối tuần", "Tuần", "Tháng", "Bất kỳ thời điểm nào"].map((option) => {
                      const value = option === "Cuối tuần" ? "weekends" : option === "Tuần" ? "weeks" : option === "Tháng" ? "months" : "any"
                      return (
                        <Button
                          key={option}
                          variant={dateFlex === value ? "default" : "outline"}
                          onClick={() => setDateFlex(value)}
                          className="justify-start rounded-xl text-sm"
                        >
                          {option}
                        </Button>
                      )
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white/90 p-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary">Độ dài chuyến đi</p>
                  <div className="grid gap-2">
                    {["1-2 đêm", "3-5 đêm", "1 tuần", "Trên 1 tuần"].map((option) => {
                      const value = option === "1-2 đêm" ? "1-2" : option === "3-5 đêm" ? "3-5" : option === "1 tuần" ? "7" : "7+"
                      return (
                        <Button
                          key={option}
                          variant={tripLength === value ? "default" : "outline"}
                          onClick={() => setTripLength(value)}
                          className="justify-start rounded-xl text-sm"
                        >
                          {option}
                        </Button>
                      )
                    })}
                  </div>
                </div>

                <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white/90 p-5">
                  <div className="space-y-3 text-sm text-slate-600">
                    <p>Chúng tôi sẽ đề xuất thời gian lưu trú phù hợp nhất dựa trên ngân sách, xu hướng giá và lịch trống thực tế.</p>
                    <p>Đừng quên chọn thêm tiện nghi hoặc trải nghiệm mong muốn để có kết quả chính xác hơn.</p>
                  </div>
                  <Button
                    onClick={handleSearch}
                    size="lg"
                    className="mt-5 rounded-xl bg-primary px-6 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
                  >
                    <Search className="mr-2 h-5 w-5" />
                    Khám phá đề xuất
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
