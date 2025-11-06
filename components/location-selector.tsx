"use client"

import { useState, useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { MapPin, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Location {
  id: string
  city: string
  state: string
  country: string
  latitude?: number
  longitude?: number
  description?: string
}

interface LocationSelectorProps {
  value?: {
    city: string
    state: string
    country: string
    latitude?: number
    longitude?: number
  }
  onChange: (location: {
    city: string
    state: string
    country: string
    latitude?: number
    longitude?: number
  }) => void
  disabled?: boolean
}

export function LocationSelector({ value, onChange, disabled }: LocationSelectorProps) {
  const { toast } = useToast()
  const [locations, setLocations] = useState<Location[]>([])
  const [states, setStates] = useState<string[]>([])
  const [selectedState, setSelectedState] = useState<string>("")
  const [selectedCity, setSelectedCity] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLocations()
  }, [])

  useEffect(() => {
    if (value?.city && value?.state) {
      setSelectedState(value.state)
      setSelectedCity(value.city)
    }
  }, [value])

  const fetchLocations = async () => {
    try {
      const response = await fetch("/api/locations?country=Vietnam")
      const data = await response.json()
      
      setLocations(data.locations || [])
      setStates(data.states || [])
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách khu vực",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const citiesInState = locations.filter((loc) => loc.state === selectedState)

  const handleStateChange = (state: string) => {
    setSelectedState(state)
    setSelectedCity("")
  }

  const handleCityChange = (city: string) => {
    setSelectedCity(city)
    const location = locations.find((loc) => loc.city === city && loc.state === selectedState)
    
    if (location) {
      onChange({
        city: location.city,
        state: location.state,
        country: location.country,
        latitude: location.latitude,
        longitude: location.longitude,
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Khu vực</Label>
          <div className="text-sm text-muted-foreground">Đang tải...</div>
        </div>
        <div className="h-10 bg-muted animate-pulse rounded-md"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Khu vực
        </Label>
      </div>

      {locations.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-2">
            Chưa có khu vực nào được cấu hình
          </p>
          <p className="text-xs text-muted-foreground">
            Vui lòng liên hệ admin để thêm khu vực mới
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="state">Tỉnh/Thành phố *</Label>
              <Select
                value={selectedState}
                onValueChange={handleStateChange}
                disabled={disabled}
              >
                <SelectTrigger id="state">
                  <SelectValue placeholder="Chọn tỉnh/thành phố" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Thành phố/Quận/Huyện *</Label>
              <Select
                value={selectedCity}
                onValueChange={handleCityChange}
                disabled={disabled || !selectedState}
              >
                <SelectTrigger id="city">
                  <SelectValue placeholder={selectedState ? "Chọn thành phố" : "Chọn tỉnh trước"} />
                </SelectTrigger>
                <SelectContent>
                  {citiesInState.map((location) => (
                    <SelectItem key={location.id} value={location.city}>
                      <div className="flex items-center gap-2">
                        <span>{location.city}</span>
                        {location.description && (
                          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {location.description}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3">
            <div className="flex gap-2">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">Lưu ý về khu vực:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Chỉ có thể chọn từ các khu vực đã được admin phê duyệt</li>
                  <li>Nếu không tìm thấy khu vực bạn muốn, vui lòng liên hệ admin</li>
                  <li>Tọa độ khu vực sẽ được sử dụng để hiển thị trên bản đồ</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
