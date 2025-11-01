"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import {
  MapPin,
  Navigation,
  Clock,
  Wifi,
  Coffee,
  Users,
  Star,
  Loader2,
} from "lucide-react"

interface CoWorkingSpace {
  id: string
  name: string
  image?: string
  images?: string[]
  address?: string
  walkTime?: string
  city?: string
  averageRating?: number
  totalReviews?: number
  rating?: number
  reviews?: number
  basePrice?: number
  pricePerDay?: number
  currency?: string
  amenities?: string[]
  features?: string[]
  openHours?: string
  latitude?: number
  longitude?: number
  isBookable?: boolean
  category?: string
  distanceKm?: number | null
}

interface CoWorkingSpacesNearbyProps {
  listingCity?: string
  listingLat?: number
  listingLng?: number
  maxSpaces?: number
  initialSpaces?: CoWorkingSpace[]
  isLoading?: boolean
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180
}

function computeDistanceKm(
  space: CoWorkingSpace,
  listingLat?: number,
  listingLng?: number,
): number | null {
  if (space.distanceKm !== undefined && space.distanceKm !== null) {
    return space.distanceKm
  }

  if (
    typeof listingLat !== "number" ||
    typeof listingLng !== "number" ||
    typeof space.latitude !== "number" ||
    typeof space.longitude !== "number"
  ) {
    return null
  }

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
  return R * c
}

function formatDistance(km: number | null): string {
  if (km === null) return "N/A"
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`
}

function formatPrice(space: CoWorkingSpace): string {
  const price = space.pricePerDay ?? space.basePrice
  if (!price) return "Liên hệ"

  return (
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: space.currency || "VND",
      maximumFractionDigits: 0,
    }).format(price) + "/ngày"
  )
}

function resolveRating(space: CoWorkingSpace): number | null {
  if (typeof space.averageRating === "number") return space.averageRating
  if (typeof space.rating === "number") return space.rating
  return null
}

function resolveReviews(space: CoWorkingSpace): number | null {
  if (typeof space.totalReviews === "number") return space.totalReviews
  if (typeof space.reviews === "number") return space.reviews
  return null
}

export function CoWorkingSpacesNearby({
  listingCity,
  listingLat,
  listingLng,
  maxSpaces = 5,
  initialSpaces,
  isLoading,
}: CoWorkingSpacesNearbyProps) {
  const hasInitial = initialSpaces !== undefined
  const [spaces, setSpaces] = useState<CoWorkingSpace[]>(
    initialSpaces?.slice(0, maxSpaces) ?? [],
  )
  const [loading, setLoading] = useState<boolean>(isLoading ?? !hasInitial)

  useEffect(() => {
    if (initialSpaces !== undefined) {
      setSpaces(initialSpaces.slice(0, maxSpaces))
      setLoading(isLoading ?? false)
      return
    }

    async function fetchSpaces() {
      try {
        setLoading(true)
        const params = new URLSearchParams({ limit: maxSpaces.toString() })

        if (listingCity) params.append("city", listingCity)
        if (listingLat && listingLng) {
          params.append("lat", listingLat.toString())
          params.append("lng", listingLng.toString())
          params.append("radius", "5")
        }

        const response = await fetch(`/api/services?${params.toString()}`)
        const data = await response.json()

        if (data.success) {
          const coworkingSpaces = (data.data as CoWorkingSpace[]).filter(
            (service) =>
              service.category === "COWORKING_SPACE" ||
              service.category === "WORKSPACE",
          )

          setSpaces(coworkingSpaces.slice(0, maxSpaces))
        } else {
          setSpaces([])
        }
      } catch (error) {
        console.error("Error fetching coworking spaces:", error)
        setSpaces([])
      } finally {
        setLoading(false)
      }
    }

    fetchSpaces()
  }, [initialSpaces, isLoading, listingCity, listingLat, listingLng, maxSpaces])

  const displaySpaces = useMemo(
    () => spaces.slice(0, maxSpaces),
    [spaces, maxSpaces],
  )

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
            <Users className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Co-working gần chỗ ở</h3>
            <p className="text-sm text-muted-foreground">
              {listingCity
                ? `Không gian làm việc chung tại ${listingCity}`
                : "Không gian làm việc chung"}
            </p>
          </div>
        </div>
      </div>

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

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {!loading && displaySpaces.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Không tìm thấy co-working space nào gần đây</p>
        </div>
      )}

      {!loading && displaySpaces.length > 0 && (
        <div className="space-y-4">
          {displaySpaces.map((space) => {
            const distanceLabel = formatDistance(
              computeDistanceKm(space, listingLat, listingLng),
            )
            const priceLabel = formatPrice(space)
            const rating = resolveRating(space)
            const reviews = resolveReviews(space)

            const imageSrc =
              space.images?.[0] ||
              space.image ||
              "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800"

            return (
              <div
                key={space.id}
                className="flex gap-4 p-4 border border-border rounded-lg hover:border-primary/50 hover:shadow-md transition-all"
              >
                <div className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden">
                  <Image src={imageSrc} alt={space.name} fill className="object-cover" />
                </div>

                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="font-semibold text-base mb-1 truncate">{space.name}</h4>
                      <div className="flex items-center flex-wrap gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Navigation className="w-4 h-4 text-blue-500" />
                          <span>{distanceLabel}</span>
                        </span>
                        {rating !== null && (
                          <span className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span>
                              {rating.toFixed(1)}
                              {reviews ? ` (${reviews} đánh giá)` : ""}
                            </span>
                          </span>
                        )}
                        {space.walkTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{space.walkTime}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" className="flex-shrink-0">
                      {priceLabel}
                    </Badge>
                  </div>

                  {space.amenities?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {space.amenities.slice(0, 4).map((amenity, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {amenity === "WiFi" && <Wifi className="w-3 h-3 mr-1" />}
                          {amenity === "Coffee" && <Coffee className="w-3 h-3 mr-1" />}
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  ) : space.features?.length ? (
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {space.features.slice(0, 4).map((feature, idx) => (
                        <span key={idx} className="px-2 py-1 bg-muted/70 rounded-full">
                          {feature}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {space.openHours && (
                    <div className="text-xs text-muted-foreground">
                      Giờ mở cửa: {space.openHours}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

