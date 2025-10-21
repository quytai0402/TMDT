'use client'

import { useEffect, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Navigation, Maximize2, Minus, Plus, X } from 'lucide-react'
import Link from 'next/link'

interface MapListing {
  id: string
  title: string
  price: number
  latitude: number
  longitude: number
  image: string
  rating: number
  reviews: number
}

interface NearbyPlace {
  name: string
  type: 'restaurant' | 'cafe' | 'attraction' | 'shopping'
  distance: string
}

export function InteractiveMapView() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [selectedListing, setSelectedListing] = useState<MapListing | null>(null)
  const [hoveredListing, setHoveredListing] = useState<string | null>(null)
  const [zoomLevel, setZoomLevel] = useState(13)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Mock listings data (in production, fetch from API)
  const listings: MapListing[] = [
    {
      id: '1',
      title: 'Villa sang trọng view biển',
      price: 2500000,
      latitude: 10.3445,
      longitude: 107.0841,
      image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400',
      rating: 4.9,
      reviews: 124,
    },
    {
      id: '2',
      title: 'Homestay ấm cúng trung tâm',
      price: 850000,
      latitude: 10.3524,
      longitude: 107.0923,
      image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400',
      rating: 4.7,
      reviews: 89,
    },
    {
      id: '3',
      title: 'Căn hộ hiện đại gần bãi biển',
      price: 1200000,
      latitude: 10.3389,
      longitude: 107.0756,
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400',
      rating: 4.8,
      reviews: 156,
    },
    {
      id: '4',
      title: 'Biệt thự vườn yên tĩnh',
      price: 1800000,
      latitude: 10.3498,
      longitude: 107.0812,
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400',
      rating: 5.0,
      reviews: 203,
    },
  ]

  const nearbyPlaces: NearbyPlace[] = [
    { name: 'Nhà hàng Hải Sản Biển Đông', type: 'restaurant', distance: '200m' },
    { name: 'The Coffee House', type: 'cafe', distance: '150m' },
    { name: 'Bãi Sau (Back Beach)', type: 'attraction', distance: '500m' },
    { name: 'Siêu thị Co.opMart', type: 'shopping', distance: '300m' },
  ]

  const getPlaceIcon = (type: string) => {
    switch (type) {
      case 'restaurant': return '🍽️'
      case 'cafe': return '☕'
      case 'attraction': return '🎯'
      case 'shopping': return '🛒'
      default: return '📍'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 1, 18))
  }

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 1, 8))
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  return (
    <section className={`${isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'relative'}`}>
      <div className={`${isFullscreen ? 'h-screen' : 'h-[600px]'} relative`}>
        {/* Map Container (Simulated) */}
        <div
          ref={mapRef}
          className="w-full h-full bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 relative overflow-hidden"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        >
          {/* Map Markers */}
          {listings.map((listing, index) => (
            <div
              key={listing.id}
              className="absolute transition-all duration-300"
              style={{
                left: `${30 + index * 15}%`,
                top: `${35 + (index % 2 === 0 ? 10 : -5)}%`,
                transform: hoveredListing === listing.id ? 'scale(1.2)' : 'scale(1)',
              }}
              onMouseEnter={() => setHoveredListing(listing.id)}
              onMouseLeave={() => setHoveredListing(null)}
            >
              <button
                onClick={() => setSelectedListing(listing)}
                className={`relative transition-all ${
                  selectedListing?.id === listing.id
                    ? 'z-20'
                    : hoveredListing === listing.id
                    ? 'z-10'
                    : 'z-0'
                }`}
              >
                <div
                  className={`px-4 py-2 rounded-full font-semibold shadow-lg transition-all ${
                    selectedListing?.id === listing.id
                      ? 'bg-primary text-white scale-110'
                      : 'bg-white text-foreground hover:shadow-xl'
                  }`}
                >
                  {formatCurrency(listing.price)}
                </div>
                {/* Pin pointer */}
                <div className="absolute left-1/2 -translate-x-1/2 top-full">
                  <div className="w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-primary" />
                </div>
              </button>
            </div>
          ))}

          {/* Nearby Places Icons */}
          <div className="absolute top-20 right-20 bg-white/90 backdrop-blur rounded-lg p-2 shadow-lg">
            <div className="text-xs font-semibold mb-1">Địa điểm lân cận</div>
            <div className="flex gap-1">
              {['🍽️', '☕', '🎯', '🛒'].map((icon, i) => (
                <div key={i} className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-lg">
                  {icon}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={handleZoomIn}
            className="shadow-lg bg-white hover:bg-gray-100"
          >
            <Plus className="w-5 h-5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={handleZoomOut}
            className="shadow-lg bg-white hover:bg-gray-100"
          >
            <Minus className="w-5 h-5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="shadow-lg bg-white hover:bg-gray-100"
          >
            <Navigation className="w-5 h-5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={toggleFullscreen}
            className="shadow-lg bg-white hover:bg-gray-100"
          >
            {isFullscreen ? <X className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </Button>
        </div>

        {/* Zoom Level Indicator */}
        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-medium shadow-lg">
          Zoom: {zoomLevel}x
        </div>

        {/* Selected Listing Card */}
        {selectedListing && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
            <Card className="overflow-hidden shadow-2xl border-2 border-primary/20">
              <div className="relative">
                <button
                  onClick={() => setSelectedListing(null)}
                  className="absolute top-2 right-2 z-10 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <img
                  src={selectedListing.image}
                  alt={selectedListing.title}
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-semibold text-lg line-clamp-1">
                    {selectedListing.title}
                  </h3>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-yellow-500">★</span>
                    <span className="font-semibold">{selectedListing.rating}</span>
                    <span className="text-sm text-muted-foreground">
                      ({selectedListing.reviews})
                    </span>
                  </div>
                </div>

                <div className="text-xl font-bold text-primary mb-3">
                  {formatCurrency(selectedListing.price)}
                  <span className="text-sm font-normal text-muted-foreground">/đêm</span>
                </div>

                {/* Nearby Places */}
                <div className="mb-4">
                  <div className="text-xs font-semibold text-muted-foreground mb-2">
                    Địa điểm gần đây:
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {nearbyPlaces.slice(0, 4).map((place, i) => (
                      <div key={i} className="flex items-center gap-1 text-xs">
                        <span>{getPlaceIcon(place.type)}</span>
                        <span className="truncate">{place.name}</span>
                        <Badge variant="secondary" className="text-xs px-1 py-0">
                          {place.distance}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link href={`/listing/${selectedListing.id}`} className="flex-1">
                    <Button className="w-full">
                      <MapPin className="w-4 h-4 mr-2" />
                      Xem chi tiết
                    </Button>
                  </Link>
                  <Button variant="outline" className="flex-1">
                    Hướng dẫn đường đi
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </section>
  )
}
