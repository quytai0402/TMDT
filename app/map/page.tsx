"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { MapView } from "@/components/map-view"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Map, Filter, X, Search } from "lucide-react"

interface Listing {
  id: string
  title: string
  basePrice: number
  averageRating: number
  totalReviews: number
  images: string[]
  latitude: number
  longitude: number
  city: string
  state: string
  propertyType: string
  guestCapacity: number
  instantBookable: boolean
  featured: boolean
}

export default function MapPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [filteredListings, setFilteredListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  
  // Filter states
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000000])
  const [propertyType, setPropertyType] = useState<string>("all")
  const [minGuests, setMinGuests] = useState<number>(1)
  const [instantBookOnly, setInstantBookOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchListings()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [listings, priceRange, propertyType, minGuests, instantBookOnly, searchQuery])

  async function fetchListings() {
    try {
      const res = await fetch("/api/search?limit=150")
      const data = await res.json()
      setListings(data.listings || [])
    } catch (error) {
      console.error("Error fetching listings:", error)
    } finally {
      setLoading(false)
    }
  }

  function applyFilters() {
    let filtered = [...listings]

    // Price filter
    filtered = filtered.filter(
      (listing) =>
        listing.basePrice >= priceRange[0] && listing.basePrice <= priceRange[1]
    )

    // Property type filter
    if (propertyType !== "all") {
      filtered = filtered.filter((listing) => listing.propertyType === propertyType)
    }

    // Guest capacity filter
    filtered = filtered.filter((listing) => listing.guestCapacity >= minGuests)

    // Instant book filter
    if (instantBookOnly) {
      filtered = filtered.filter((listing) => listing.instantBookable)
    }

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (listing) =>
          listing.title.toLowerCase().includes(query) ||
          listing.city.toLowerCase().includes(query) ||
          listing.state?.toLowerCase().includes(query)
      )
    }

    setFilteredListings(filtered)
  }

  function clearFilters() {
    setPriceRange([0, 10000000])
    setPropertyType("all")
    setMinGuests(1)
    setInstantBookOnly(false)
    setSearchQuery("")
  }

  const activeFiltersCount =
    (priceRange[0] > 0 || priceRange[1] < 10000000 ? 1 : 0) +
    (propertyType !== "all" ? 1 : 0) +
    (minGuests > 1 ? 1 : 0) +
    (instantBookOnly ? 1 : 0) +
    (searchQuery ? 1 : 0)

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 relative">
        {/* Filter Sidebar */}
        <div
          className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-80 bg-white shadow-lg z-40 transform transition-transform duration-300 overflow-y-auto ${
            showFilters ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Bộ lọc
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Search */}
              <div>
                <Label>Tìm kiếm</Label>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Tìm theo tên, thành phố..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Price Range */}
              <div>
                <Label>Khoảng giá (VNĐ/đêm)</Label>
                <div className="mt-4">
                  <Slider
                    min={0}
                    max={10000000}
                    step={100000}
                    value={priceRange}
                    onValueChange={(value) => setPriceRange(value as [number, number])}
                  />
                  <div className="flex justify-between mt-2 text-sm text-gray-600">
                    <span>{priceRange[0].toLocaleString("vi-VN")}đ</span>
                    <span>{priceRange[1].toLocaleString("vi-VN")}đ</span>
                  </div>
                </div>
              </div>

              {/* Property Type */}
              <div>
                <Label>Loại hình</Label>
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="ENTIRE_PLACE">Toàn bộ nhà</SelectItem>
                    <SelectItem value="PRIVATE_ROOM">Phòng riêng</SelectItem>
                    <SelectItem value="SHARED_ROOM">Phòng chung</SelectItem>
                    <SelectItem value="HOTEL_ROOM">Phòng khách sạn</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Guest Capacity */}
              <div>
                <Label>Số khách tối thiểu</Label>
                <Select
                  value={minGuests.toString()}
                  onValueChange={(value) => setMinGuests(parseInt(value))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 8, 10].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} khách
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Instant Book */}
              <div className="flex items-center justify-between">
                <Label>Đặt phòng ngay</Label>
                <Button
                  variant={instantBookOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setInstantBookOnly(!instantBookOnly)}
                >
                  {instantBookOnly ? "Bật" : "Tắt"}
                </Button>
              </div>

              {/* Clear Filters */}
              {activeFiltersCount > 0 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={clearFilters}
                >
                  Xóa tất cả bộ lọc ({activeFiltersCount})
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Toggle Button */}
        <Button
          className="fixed top-20 left-4 z-30 shadow-lg"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Bộ lọc
          {activeFiltersCount > 0 && (
            <Badge className="ml-2 bg-red-500">{activeFiltersCount}</Badge>
          )}
        </Button>

        {/* Results Counter */}
        <div className="fixed top-20 right-4 z-30 bg-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <Map className="h-4 w-4 text-primary" />
            <span className="font-semibold">
              {filteredListings.length} chỗ nghỉ
            </span>
          </div>
        </div>

        {/* Map View */}
        {loading ? (
          <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Đang tải bản đồ...</p>
            </div>
          </div>
        ) : (
          <MapView listings={filteredListings} />
        )}
      </main>
    </div>
  )
}
