"use client"

import { useState, useCallback } from "react"
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, MapPin, Users, Zap } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

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

interface MapViewProps {
  listings: Listing[]
}

const mapContainerStyle = {
  width: "100%",
  height: "calc(100vh - 4rem)",
}

const defaultCenter = {
  lat: 16.0544, // Vietnam center
  lng: 108.2022,
}

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  styles: [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
  ],
}

export function MapView({ listings }: MapViewProps) {
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map)
    
    // Fit bounds to show all listings
    if (listings.length > 0) {
      const bounds = new google.maps.LatLngBounds()
      listings.forEach((listing) => {
        bounds.extend(new google.maps.LatLng(listing.latitude, listing.longitude))
      })
      map.fitBounds(bounds)
    }
  }, [listings])

  const onUnmount = useCallback(() => {
    setMap(null)
  }, [])

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-100">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Google Maps không khả dụng</h3>
            <p className="text-gray-600">
              Vui lòng cấu hình NEXT_PUBLIC_GOOGLE_MAPS_API_KEY trong .env
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={6}
        options={mapOptions}
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        {listings.map((listing) => (
          <Marker
            key={listing.id}
            position={{
              lat: listing.latitude,
              lng: listing.longitude,
            }}
            onClick={() => setSelectedListing(listing)}
            icon={{
              url: listing.featured
                ? "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTE1IDBDOS40NzcgMCA1IDQuNDc3IDUgMTBjMCA3LjUgMTAgMjAgMTAgMjBzMTAtMTIuNSAxMC0yMGMwLTUuNTIzLTQuNDc3LTEwLTEwLTEweiIgZmlsbD0iI2ZmZDA0YSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48Y2lyY2xlIGN4PSIxNSIgY3k9IjEwIiByPSI0IiBmaWxsPSIjZmZmIi8+PC9zdmc+"
                : "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTE1IDBDOS40NzcgMCA1IDQuNDc3IDUgMTBjMCA3LjUgMTAgMjAgMTAgMjBzMTAtMTIuNSAxMC0yMGMwLTUuNTIzLTQuNDc3LTEwLTEwLTEweiIgZmlsbD0iIzI1NjNlYiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48Y2lyY2xlIGN4PSIxNSIgY3k9IjEwIiByPSI0IiBmaWxsPSIjZmZmIi8+PC9zdmc+",
              scaledSize: new google.maps.Size(30, 40),
              anchor: new google.maps.Point(15, 40),
            }}
          />
        ))}

        {selectedListing && (
          <InfoWindow
            position={{
              lat: selectedListing.latitude,
              lng: selectedListing.longitude,
            }}
            onCloseClick={() => setSelectedListing(null)}
          >
            <div className="max-w-xs">
              <Link href={`/listing/${selectedListing.id}`}>
                <div className="cursor-pointer hover:opacity-90 transition-opacity">
                  {/* Image */}
                  <div className="relative w-full h-40 mb-2 rounded-lg overflow-hidden">
                    <Image
                      src={selectedListing.images[0] || "/placeholder.jpg"}
                      alt={selectedListing.title}
                      fill
                      className="object-cover"
                    />
                    {selectedListing.featured && (
                      <Badge className="absolute top-2 left-2 bg-yellow-500 text-black">
                        <Star className="h-3 w-3 mr-1" />
                        Nổi bật
                      </Badge>
                    )}
                    {selectedListing.instantBookable && (
                      <Badge className="absolute top-2 right-2 bg-blue-600">
                        <Zap className="h-3 w-3 mr-1" />
                        Đặt ngay
                      </Badge>
                    )}
                  </div>

                  {/* Info */}
                  <div>
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                      {selectedListing.title}
                    </h3>
                    
                    <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                      <MapPin className="h-3 w-3" />
                      <span>
                        {selectedListing.city}
                        {selectedListing.state && `, ${selectedListing.state}`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {selectedListing.averageRating > 0 && (
                          <>
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-semibold">
                              {selectedListing.averageRating.toFixed(1)}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({selectedListing.totalReviews})
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Users className="h-3 w-3" />
                        <span>{selectedListing.guestCapacity}</span>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-lg font-bold text-primary">
                            {selectedListing.basePrice.toLocaleString("vi-VN")}đ
                          </span>
                          <span className="text-xs text-gray-500 ml-1">/đêm</span>
                        </div>
                        <Button size="sm" variant="outline">
                          Xem chi tiết
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </LoadScript>
  )
}
