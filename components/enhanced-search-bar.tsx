"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  CalendarIcon,
  Users,
  MapPin,
  Sparkles,
  BrainCircuit,
  Compass,
  Coffee,
  HeartPulse,
  Briefcase,
} from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useSearch } from "@/hooks/use-search"
import { useRouter } from "next/navigation"

type FlexibleWindowOption = "weekend" | "week" | "month"

export function EnhancedSearchBar() {
  const router = useRouter()
  const { semanticSearch, loading } = useSearch()
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('')
  const [checkIn, setCheckIn] = useState<Date>()
  const [checkOut, setCheckOut] = useState<Date>()
  const [guests, setGuests] = useState(2)
  const [useAI, setUseAI] = useState(false)
  const [stayMode, setStayMode] = useState<'exact' | 'flexible'>('exact')
  const [flexibleWindow, setFlexibleWindow] = useState<FlexibleWindowOption | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)

  const smartPresets = useMemo(
    () => [
      {
        id: 'coastal-retreat',
        label: 'Nghỉ dưỡng biển',
        description: 'Biệt thự gần biển, hồ bơi riêng',
        icon: Compass,
        prompt: 'Biệt thự ven biển có hồ bơi riêng, phù hợp nhóm bạn cuối tuần',
      },
      {
        id: 'executive-workation',
        label: 'Workation cao cấp',
        description: 'Wifi mạnh, bàn làm việc, gần trung tâm',
        icon: Briefcase,
        prompt: 'Căn hộ cao cấp cho workation, wifi mạnh, gần trung tâm, yên tĩnh',
      },
      {
        id: 'wellness-retreat',
        label: 'Chăm sóc sức khỏe',
        description: 'Resort có spa, yoga, detox',
        icon: HeartPulse,
        prompt: 'Resort nghỉ dưỡng có spa, yoga, bữa sáng lành mạnh cho 2 người',
      },
      {
        id: 'family-fun',
        label: 'Gia đình & trẻ nhỏ',
        description: 'Nhiều phòng ngủ, tiện ích cho bé',
        icon: Coffee,
        prompt: 'Villa rộng rãi cho gia đình 6 người, gần khu vui chơi trẻ em',
      },
    ],
    []
  )

  const presetMeta = selectedPreset
    ? smartPresets.find((preset) => preset.id === selectedPreset)
    : null

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (useAI && query) {
      try {
        await semanticSearch(query)
        router.push(`/search?q=${encodeURIComponent(query)}`)
      } catch (err) {
        console.error('Search failed:', err)
      }
    } else {
      const params: Record<string, string | number> = {}

      if (city) params.city = city
      if (checkIn) params.checkIn = format(checkIn, 'yyyy-MM-dd')
      if (checkOut) params.checkOut = format(checkOut, 'yyyy-MM-dd')
      if (guests) params.guests = guests
      if (stayMode === 'flexible') {
        params.flexible = 'true'
        if (flexibleWindow) {
          params.flexibleWindow = flexibleWindow
        }
      }
      if (selectedPreset) {
        params.intent = selectedPreset
      }

      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        searchParams.append(key, String(value))
      })
      router.push(`/search?${searchParams.toString()}`)
    }
  }

  const handlePresetSelect = (presetId: string, presetPrompt: string) => {
    setSelectedPreset((current) => (current === presetId ? null : presetId))

    const nextValue = selectedPreset === presetId ? '' : presetPrompt
    setUseAI(true)
    setQuery(nextValue)
  }

  return (
    <form onSubmit={handleSearch} className="w-full">
      <div className="rounded-3xl border border-gray-200 bg-white/70 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col gap-3 p-4 md:p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <BrainCircuit className="h-4 w-4 text-primary" />
                Trợ lý tìm kiếm thông minh
              </p>
              <p className="text-xs text-gray-500">
                Cá nhân hóa theo mục đích chuyến đi, đề xuất bởi AI.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {[
                { id: 'exact' as const, label: 'Theo ngày cụ thể' },
                { id: 'flexible' as const, label: 'Tôi linh hoạt' },
              ].map((mode) => (
                <Button
                  key={mode.id}
                  type="button"
                  variant={stayMode === mode.id ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'rounded-full border border-gray-200',
                    stayMode === mode.id && 'border-primary text-white'
                  )}
                  onClick={() => setStayMode(mode.id)}
                >
                  {mode.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {smartPresets.map((preset) => {
              const Icon = preset.icon
              const isActive = selectedPreset === preset.id
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetSelect(preset.id, preset.prompt)}
                  className={cn(
                    'flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition',
                    'hover:border-primary/60 hover:bg-primary/5',
                    isActive && 'border-primary bg-gradient-to-r from-primary/10 to-pink-100 text-primary'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{preset.label}</span>
                </button>
              )
            })}
          </div>

          <div className="bg-white/80 rounded-2xl border border-gray-100 p-2 flex flex-col md:flex-row gap-2 md:gap-0">
            {/* Location */}
            <div className="flex-1 px-4 py-3 border-b md:border-b-0 md:border-r border-gray-200">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Điểm đến
              </label>
              <div className="relative">
                <MapPin className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Tìm kiếm thành phố, địa điểm..."
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="border-0 p-0 pl-6 focus-visible:ring-0 text-sm"
                />
              </div>
            </div>

            {/* Check-in */}
            <div className="flex-1 px-4 py-3 border-b md:border-b-0 md:border-r border-gray-200">
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" className="w-full text-left">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Nhận phòng
                    </label>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                      <span
                        className={cn(
                          'text-sm',
                          !checkIn && 'text-gray-400'
                        )}
                      >
                        {checkIn ? format(checkIn, 'dd/MM/yyyy', { locale: vi }) : 'Chọn ngày'}
                      </span>
                    </div>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={checkIn}
                    onSelect={setCheckIn}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Check-out */}
            <div className="flex-1 px-4 py-3 border-b md:border-b-0 md:border-r border-gray-200">
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" className="w-full text-left">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Trả phòng
                    </label>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                      <span
                        className={cn(
                          'text-sm',
                          !checkOut && 'text-gray-400'
                        )}
                      >
                        {checkOut ? format(checkOut, 'dd/MM/yyyy', { locale: vi }) : 'Chọn ngày'}
                      </span>
                    </div>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={checkOut}
                    onSelect={setCheckOut}
                    disabled={(date) => {
                      if (checkIn) {
                        return date <= checkIn
                      }
                      return date < new Date()
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Guests */}
            <div className="flex-1 px-4 py-3">
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" className="w-full text-left">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Khách
                    </label>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{guests} khách</span>
                    </div>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="start">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">Số khách</div>
                        <div className="text-sm text-gray-500">Tối đa bao nhiêu người?</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setGuests(Math.max(1, guests - 1))}
                          disabled={guests <= 1}
                        >
                          -
                        </Button>
                        <span className="w-8 text-center">{guests}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setGuests(Math.min(20, guests + 1))}
                          disabled={guests >= 20}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Search Button */}
            <div className="flex gap-2 px-2">
              <Button
                type="button"
                variant={useAI ? 'default' : 'outline'}
                size="icon"
                className="rounded-full"
                onClick={() => setUseAI(!useAI)}
                title="Tìm kiếm bằng AI"
              >
                <Sparkles className={cn('h-5 w-5', useAI && 'text-white')} />
              </Button>
              <Button
                type="submit"
                size="icon"
                className="bg-primary hover:bg-primary-hover rounded-full h-12 w-12"
                disabled={loading}
              >
                <Search className="h-5 w-5 text-white" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {stayMode === 'flexible' && (
        <div className="mt-4">
          <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4">
            <p className="text-sm font-semibold text-primary mb-2">AI gợi ý theo khung thời gian linh hoạt</p>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'weekend', label: 'Cuối tuần đẹp trời (6-8 ngày nữa)' },
                { id: 'week', label: 'Tuần làm việc nhẹ nhàng' },
                { id: 'month', label: 'Trong 30 ngày tới' },
              ].map((option) => (
                <Button
                  key={option.id}
                  type="button"
                  variant={flexibleWindow === option.id ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-full"
                  onClick={() =>
                    setFlexibleWindow((current) =>
                      current === option.id ? null : (option.id as FlexibleWindowOption)
                    )
                  }
                >
                  {option.label}
                </Button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Chúng tôi sẽ ưu tiên những lịch nhận phòng phù hợp với độ linh hoạt bạn chọn.
            </p>
          </div>
        </div>
      )}

      {useAI && (
        <div className="mt-4">
          <div className="rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 via-white to-pink-50 p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="text-base font-semibold text-purple-900">Tìm kiếm thông minh với AI</h3>
                  <p className="text-sm text-purple-700">
                    Mô tả chi tiết nhu cầu; chúng tôi sẽ phân tích và đề xuất danh sách phù hợp.
                  </p>
                </div>
                <Input
                  type="text"
                  placeholder="VD: Villa có hồ bơi riêng cho 10 người gần biển Vũng Tàu cuối tuần này"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="bg-white"
                />
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-white text-purple-700">
                    GPT-powered semantic search
                  </Badge>
                  {presetMeta && (
                    <Badge variant="outline" className="border-purple-300 text-purple-700">
                      Đang áp dụng: {presetMeta.label}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {presetMeta && (
        <div className="mt-4">
          <div className="rounded-2xl border border-primary/40 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary mt-1" />
              <div>
                <h4 className="font-semibold text-gray-900">Chiến lược tìm kiếm AI</h4>
                <p className="text-sm text-gray-600">
                  {presetMeta.description}. AI sẽ ưu tiên các tiện ích và địa điểm liên quan khi tìm kiếm.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Bạn có thể tinh chỉnh thêm bằng cách chỉnh sửa mô tả hoặc các bộ lọc phía trên.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}
