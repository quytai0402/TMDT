'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Star, ChevronDown, ChevronUp, Navigation } from 'lucide-react'

interface NearbyPlace {
  name: string
  type: string
  distance: number | string // Support both number and formatted string
  rating?: number
  lat?: number
  lng?: number
  address?: string
  placeId?: string
}

interface NearbyPlacesProps {
  listingId: string
  city: string
  lat: number
  lng: number
  savedPlaces?: any[] // Pre-saved nearby places from database
}

const placeTypeLabels: Record<string, string> = {
  restaurant: 'Nhà hàng',
  cafe: 'Quán cà phê',
  atm: 'ATM',
  hospital: 'Bệnh viện',
  pharmacy: 'Nhà thuốc',
  supermarket: 'Siêu thị',
  beach: 'Bãi biển',
  attraction: 'Địa điểm du lịch',
  transport: 'Giao thông',
}

const placeTypeColors: Record<string, string> = {
  restaurant: 'bg-orange-100 text-orange-700',
  cafe: 'bg-amber-100 text-amber-700',
  atm: 'bg-green-100 text-green-700',
  hospital: 'bg-red-100 text-red-700',
  pharmacy: 'bg-pink-100 text-pink-700',
  supermarket: 'bg-blue-100 text-blue-700',
  beach: 'bg-cyan-100 text-cyan-700',
  attraction: 'bg-purple-100 text-purple-700',
  transport: 'bg-gray-100 text-gray-700',
}

export function NearbyPlaces({ listingId, city, lat, lng, savedPlaces }: NearbyPlacesProps) {
  const [places, setPlaces] = useState<NearbyPlace[]>([])
  const [loading, setLoading] = useState(!savedPlaces || savedPlaces.length === 0)
  const [isExpanded, setIsExpanded] = useState(false)

  // Memoize savedPlaces to prevent infinite loop
  const hasSavedPlaces = useMemo(() => savedPlaces && savedPlaces.length > 0, [savedPlaces?.length])

  useEffect(() => {
    // If we have saved places from database, use them directly
    if (hasSavedPlaces && savedPlaces) {
      setPlaces(savedPlaces as NearbyPlace[])
      setLoading(false)
      return
    }

    // Otherwise fetch from API
    async function fetchNearbyPlaces() {
      try {
        const res = await fetch(
          `/api/listings/${listingId}/nearby?city=${encodeURIComponent(city)}&lat=${lat}&lng=${lng}`
        )
        const data = await res.json()
        setPlaces(data.places || [])
      } catch (error) {
        console.error('Error fetching nearby places:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNearbyPlaces()
  }, [listingId, city, lat, lng, hasSavedPlaces])

  const summaryPlaces = useMemo(() => places.slice(0, 3), [places])
  const expandedPlaces = useMemo(() => places.slice(0, 12), [places])

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">Địa điểm lân cận</h3>
            <p className="text-sm text-muted-foreground">Đang tải dữ liệu gần {city}...</p>
          </div>
        </div>
      </Card>
    )
  }

  if (places.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">Địa điểm lân cận</h3>
            <p className="text-sm text-muted-foreground">Chưa có dữ liệu khu vực này</p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card
        className="p-6 cursor-pointer hover:shadow-md transition-all"
        onClick={() => setIsExpanded((prev) => !prev)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-lg">Địa điểm lân cận</h3>
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                Thực tế tại {city}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {places.length} địa điểm tiện ích quanh chỗ ở. Nhấn để xem chi tiết.
            </p>
          </div>
          <Button variant="ghost" size="sm" className="-mr-2">
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </Button>
        </div>

        {!isExpanded && summaryPlaces.length > 0 && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            {summaryPlaces.map((place, index) => (
              <div
                key={`${place.name}-${index}`}
                className="flex items-center gap-3 rounded-lg border border-border p-3 hover:border-primary/40 transition-colors"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium line-clamp-1">{place.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {typeof place.distance === 'string' 
                        ? place.distance 
                        : place.distance >= 1000
                          ? `${(place.distance / 1000).toFixed(1)} km`
                          : `${place.distance}m`}
                    </span>
                    <Badge className={`text-xs ${placeTypeColors[place.type] || 'bg-gray-100 text-gray-700'}`}>
                      {placeTypeLabels[place.type] || place.type}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {isExpanded && (
        <Card className="p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-base">Chi tiết địa điểm lân cận</CardTitle>
            <CardDescription>
              Các địa điểm tiện ích quanh chỗ ở (dữ liệu thực tế từ {city})
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="space-y-4">
              {expandedPlaces.map((place, index) => (
                <div
                  key={`${place.name}-${index}`}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/60 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <h4 className="font-medium">{place.name}</h4>
                      <Badge className={placeTypeColors[place.type] || 'bg-gray-100'}>
                        {placeTypeLabels[place.type] || place.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>
                        {typeof place.distance === 'string' 
                          ? place.distance 
                          : place.distance >= 1000
                            ? `${(place.distance / 1000).toFixed(1)} km`
                            : `${place.distance}m`}
                      </span>
                      {place.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{place.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {place.lat && place.lng ? (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=${place.lat},${place.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:underline whitespace-nowrap ml-4"
                    >
                      <Navigation className="h-3 w-3" />
                      Tìm đường
                    </a>
                  ) : (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=${encodeURIComponent(place.name + ', ' + city)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:underline whitespace-nowrap ml-4"
                    >
                      <Navigation className="h-3 w-3" />
                      Tìm đường
                    </a>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
