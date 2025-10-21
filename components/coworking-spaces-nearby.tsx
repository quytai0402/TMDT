"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  MapPin,
  Navigation,
  Clock,
  DollarSign,
  Wifi,
  Coffee,
  Users,
  Star,
  Loader2,
} from "lucide-react"

interface CoWorkingSpace {
  id: string
  name: string
  image: string
  images: string[]
  distance: string
  address: string
  walkTime: string
  city: string
  rating: number
  reviews: number
  pricePerDay: number
  amenities: string[]
  openHours: string
  averageRating: number
  totalReviews: number
  latitude: number
  longitude: number
  basePrice?: number
  currency?: string
  features?: string[]
  isBookable?: boolean
  category?: string
}

interface CoWorkingSpacesNearbyProps {
  listingCity?: string
  listingLat?: number
  listingLng?: number
  maxSpaces?: number
}

export function CoWorkingSpacesNearby({
  listingCity,
  listingLat,
  listingLng,
  maxSpaces = 5,
}: CoWorkingSpacesNearbyProps) {
  const [spaces, setSpaces] = useState<CoWorkingSpace[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSpaces() {
      try {
        setLoading(true)
        const params = new URLSearchParams({ limit: maxSpaces.toString() })

        if (listingCity) params.append("city", listingCity)
        if (listingLat && listingLng) {
          params.append("lat", listingLat.toString())
          params.append("lng", listingLng.toString())
          params.append("radius", "5") // 5km radius
        }

        const response = await fetch(`/api/services?${params}`)
        const data = await response.json()

        if (data.success) {
          const coworkingSpaces = data.data.filter(
            (s: CoWorkingSpace) =>
              s.category === "COWORKING_SPACE" || s.category === "WORKSPACE"
          )
          setSpaces(coworkingSpaces.slice(0, maxSpaces))
        }
      } catch (error) {
        console.error("Error fetching coworking spaces:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSpaces()
  }, [listingCity, listingLat, listingLng, maxSpaces])

  function toRad(degrees: number): number {
    return (degrees * Math.PI) / 180
  }

  function calculateDistance(space: CoWorkingSpace): string {
    if (!listingLat || !listingLng) return "N/A"
    const R = 6371
    const dLat = toRad(space.latitude - listingLat)
    const dLon = toRad(space.longitude - listingLng)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(listingLat)) *
        Math.cos(toRad(space.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c
    return distance < 1
      ? `${Math.round(distance * 1000)}m`
      : `${distance.toFixed(1)}km`
  }

  function formatPrice(space: CoWorkingSpace): string {
    if (!space.basePrice) return "Liên hệ"
    return (
      new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: space.currency || "VND",
      }).format(space.basePrice) + "/ngày"
    )
  }

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
            <Users className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">
              Co-working Spaces gần đây
            </h3>
            <p className="text-sm text-muted-foreground">
              {listingCity
                ? `Không gian làm việc chung tại ${listingCity}`
                : "Không gian làm việc chung"}
            </p>
          </div>
        </div>
      </div>

      {/* Map Preview */}
      <div className="relative h-48 bg-muted rounded-lg mb-6 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200"
          alt="Map of coworking spaces"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <Button variant="secondary" className="w-full">
            <MapPin className="w-4 h-4 mr-2" />
            Xem bản đồ đầy đủ
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Empty State */}
      {!loading && spaces.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Không tìm thấy co-working space nào gần đây</p>
        </div>
      )}

      {/* Spaces List */}
      {!loading && spaces.length > 0 && (
        <div className="space-y-4">
          {spaces.map((space) => (
            <div
              key={space.id}
              className="flex gap-4 p-4 border border-border rounded-lg hover:border-primary/50 hover:shadow-md transition-all"
            >
              {/* Image */}
              <div className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden">
                <Image
                  src={
                    space.images?.[0] ||
                    space.image ||
                    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800"
                  }
                  alt={space.name}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                {/* Name & Rating */}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold mb-1">{space.name}</h4>
                    <div className="flex items-center space-x-2 text-sm">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{space.rating}</span>
                      </div>
                      <span className="text-muted-foreground">
                        ({space.reviews} đánh giá)
                      </span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="flex-shrink-0">
                    {space.pricePerDay.toLocaleString("vi-VN")}₫/ngày
                  </Badge>
                </div>

                {/* Distance & Time */}
                <div className="flex items-center space-x-4 mb-3 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Navigation className="w-4 h-4" />
                    <span>{calculateDistance(space)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{space.walkTime}</span>
                  </div>
                </div>

                {/* Amenities */}
                {space.amenities?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {space.amenities.slice(0, 4).map((amenity, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {amenity === "WiFi" && (
                          <Wifi className="w-3 h-3 mr-1" />
                        )}
                        {amenity === "Coffee" && (
                          <Coffee className="w-3 h-3 mr-1" />
                        )}
                        {amenity}
                      </Badge>
                    ))}
                    {space.amenities.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{space.amenities.length - 4}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline" asChild>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${space.latitude},${space.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MapPin className="w-3 h-3 mr-1" />
                      Chỉ đường
                    </a>
                  </Button>
                  {space.isBookable && (
                    <Button size="sm" variant="default">
                      Đặt chỗ
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View All */}
      {!loading && spaces.length > 0 && (
        <div className="mt-4 text-center">
          <Button variant="ghost" size="sm">
            Xem tất cả không gian làm việc →
          </Button>
        </div>
      )}
    </Card>
  )
}
