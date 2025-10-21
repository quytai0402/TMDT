'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { X } from 'lucide-react'

interface AdvancedFiltersProps {
  onApply: (filters: any) => void
  onReset: () => void
}

const propertyTypes = [
  'Căn hộ',
  'Nhà riêng',
  'Villa',
  'Biệt thự',
  'Khách sạn',
  'Homestay',
  'Studio',
]

const amenities = [
  'Wifi',
  'Bãi đỗ xe',
  'Hồ bơi',
  'Bếp',
  'Điều hòa',
  'Máy giặt',
  'TV',
  'Ban công',
  'Thang máy',
  'Gym',
  'Bảo vệ 24/7',
  'Cho phép thú cưng',
]

export function AdvancedFilters({ onApply, onReset }: AdvancedFiltersProps) {
  const [priceRange, setPriceRange] = useState([0, 10000000])
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>([])
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [bedrooms, setBedrooms] = useState<number | null>(null)
  const [bathrooms, setBathrooms] = useState<number | null>(null)
  const [instantBookable, setInstantBookable] = useState(false)
  const [allowPets, setAllowPets] = useState(false)

  const togglePropertyType = (type: string) => {
    setSelectedPropertyTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    )
  }

  const handleApply = () => {
    const filters: any = {}

    if (priceRange[0] > 0 || priceRange[1] < 10000000) {
      filters.minPrice = priceRange[0]
      filters.maxPrice = priceRange[1]
    }

    if (selectedPropertyTypes.length > 0) {
      filters.propertyTypes = selectedPropertyTypes
    }

    if (selectedAmenities.length > 0) {
      filters.amenities = selectedAmenities
    }

    if (bedrooms !== null) {
      filters.bedrooms = bedrooms
    }

    if (bathrooms !== null) {
      filters.bathrooms = bathrooms
    }

    if (instantBookable) {
      filters.instantBookable = true
    }

    if (allowPets) {
      filters.allowPets = true
    }

    onApply(filters)
  }

  const handleReset = () => {
    setPriceRange([0, 10000000])
    setSelectedPropertyTypes([])
    setSelectedAmenities([])
    setBedrooms(null)
    setBathrooms(null)
    setInstantBookable(false)
    setAllowPets(false)
    onReset()
  }

  const activeFiltersCount =
    (priceRange[0] > 0 || priceRange[1] < 10000000 ? 1 : 0) +
    selectedPropertyTypes.length +
    selectedAmenities.length +
    (bedrooms !== null ? 1 : 0) +
    (bathrooms !== null ? 1 : 0) +
    (instantBookable ? 1 : 0) +
    (allowPets ? 1 : 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Bộ lọc
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount}</Badge>
            )}
          </CardTitle>
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <X className="h-4 w-4 mr-1" />
              Xóa tất cả
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-6">
            {/* Price Range */}
            <div className="space-y-3">
              <Label>Khoảng giá (₫/đêm)</Label>
              <div className="px-2">
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  min={0}
                  max={10000000}
                  step={100000}
                  className="my-4"
                />
              </div>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  value={priceRange[0]}
                  onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                  placeholder="Tối thiểu"
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="number"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 10000000])}
                  placeholder="Tối đa"
                />
              </div>
            </div>

            <Separator />

            {/* Property Type */}
            <div className="space-y-3">
              <Label>Loại chỗ ở</Label>
              <div className="grid grid-cols-2 gap-2">
                {propertyTypes.map((type) => (
                  <Button
                    key={type}
                    variant={selectedPropertyTypes.includes(type) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => togglePropertyType(type)}
                    className="justify-start"
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Rooms */}
            <div className="space-y-3">
              <Label>Phòng ngủ</Label>
              <div className="grid grid-cols-5 gap-2">
                {[null, 1, 2, 3, 4].map((num) => (
                  <Button
                    key={num || 'any'}
                    variant={bedrooms === num ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setBedrooms(num)}
                  >
                    {num || 'Bất kỳ'}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Phòng tắm</Label>
              <div className="grid grid-cols-5 gap-2">
                {[null, 1, 2, 3, 4].map((num) => (
                  <Button
                    key={num || 'any'}
                    variant={bathrooms === num ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setBathrooms(num)}
                  >
                    {num || 'Bất kỳ'}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Amenities */}
            <div className="space-y-3">
              <Label>Tiện nghi</Label>
              <div className="space-y-2">
                {amenities.map((amenity) => (
                  <div key={amenity} className="flex items-center space-x-2">
                    <Checkbox
                      id={amenity}
                      checked={selectedAmenities.includes(amenity)}
                      onCheckedChange={() => toggleAmenity(amenity)}
                    />
                    <label
                      htmlFor={amenity}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {amenity}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Additional Options */}
            <div className="space-y-3">
              <Label>Tùy chọn khác</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="instant-bookable"
                    checked={instantBookable}
                    onCheckedChange={(checked) => setInstantBookable(checked as boolean)}
                  />
                  <label
                    htmlFor="instant-bookable"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Đặt phòng ngay lập tức
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="allow-pets"
                    checked={allowPets}
                    onCheckedChange={(checked) => setAllowPets(checked as boolean)}
                  />
                  <label
                    htmlFor="allow-pets"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Cho phép thú cưng
                  </label>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="mt-6 space-y-2">
          <Button onClick={handleApply} className="w-full">
            Áp dụng bộ lọc
          </Button>
          {activeFiltersCount > 0 && (
            <Button onClick={handleReset} variant="outline" className="w-full">
              Đặt lại
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
