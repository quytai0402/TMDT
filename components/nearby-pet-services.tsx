"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Navigation, Clock, Phone, Star, ExternalLink, Loader2 } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"

interface PetService {
  id: string
  name: string
  category: string
  images: string[]
  address: string
  city: string
  latitude: number
  longitude: number
  phone?: string
  openHours: string
  averageRating: number
  totalReviews: number
  features: string[]
  basePrice?: number
  currency: string
  isBookable: boolean
}

const categoryInfo: Record<string, { label: string; color: string }> = {
  PET_VET: { label: "Phòng khám thú y", color: "bg-red-100 text-red-700 border-red-200" },
  PET_PARK: { label: "Công viên", color: "bg-green-100 text-green-700 border-green-200" },
  PET_STORE: { label: "Cửa hàng pet", color: "bg-blue-100 text-blue-700 border-blue-200" },
  PET_GROOMING: { label: "Spa thú cưng", color: "bg-purple-100 text-purple-700 border-purple-200" },
  PET_HOTEL: { label: "Khách sạn thú cưng", color: "bg-orange-100 text-orange-700 border-orange-200" }
}

interface NearbyPetServicesProps {
  listingCity?: string
  listingLat?: number
  listingLng?: number
  maxServices?: number
}

export default function NearbyPetServices({
  listingCity,
  listingLat,
  listingLng,
  maxServices = 6
}: NearbyPetServicesProps) {
  const [services, setServices] = useState<PetService[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    fetchServices()
  }, [listingCity, listingLat, listingLng, selectedCategory])

  async function fetchServices() {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: maxServices.toString(),
        isBookable: 'true'
      })

      // Add category filter if selected
      if (selectedCategory) {
        params.append('category', selectedCategory)
      }

      // Add location filters if available
      if (listingCity) {
        params.append('city', listingCity)
      }
      if (listingLat && listingLng) {
        params.append('lat', listingLat.toString())
        params.append('lng', listingLng.toString())
        params.append('radius', '10') // 10km radius
      }

      const response = await fetch(`/api/services?${params}`)
      const data = await response.json()

      if (data.success) {
        // Filter for pet services only if no category selected
        let petServices = data.data
        if (!selectedCategory) {
          petServices = data.data.filter((s: PetService) => 
            s.category.startsWith('PET_')
          )
        }
        setServices(petServices.slice(0, maxServices))
      }
    } catch (error) {
      console.error('Error fetching pet services:', error)
    } finally {
      setLoading(false)
    }
  }

  function calculateDistance(service: PetService): string {
    if (!listingLat || !listingLng) return 'N/A'
    
    const R = 6371 // Earth's radius in km
    const dLat = toRad(service.latitude - listingLat)
    const dLon = toRad(service.longitude - listingLng)
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(listingLat)) *
        Math.cos(toRad(service.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c
    
    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`
  }

  function toRad(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  function formatPrice(service: PetService): string {
    if (!service.basePrice || service.basePrice === 0) return 'Miễn phí'
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: service.currency || 'VND'
    }).format(service.basePrice)
  }

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold mb-1">Dịch vụ thú cưng gần đây</h3>
          <p className="text-sm text-muted-foreground">
            {listingCity ? `Các dịch vụ dành cho thú cưng tại ${listingCity}` : 'Các dịch vụ dành cho thú cưng'}
          </p>
        </div>
        <Button variant="outline" size="sm">
          <MapPin className="w-4 h-4 mr-2" />
          Xem bản đồ
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Empty State */}
      {!loading && services.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Không tìm thấy dịch vụ thú cưng nào gần đây</p>
        </div>
      )}

      {/* Services List */}
      {!loading && services.length > 0 && (
        <div className="space-y-4">
          {services.map((service) => (
            <div
              key={service.id}
              className="flex gap-4 p-4 border border-border rounded-lg hover:border-primary/50 hover:shadow-md transition-all"
            >
              {/* Image */}
              <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                <Image
                  src={service.images[0] || 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=800'}
                  alt={service.name}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                {/* Category Badge */}
                <Badge 
                  variant="outline" 
                  className={`mb-2 ${categoryInfo[service.category]?.color || 'bg-gray-100 text-gray-700'}`}
                >
                  {categoryInfo[service.category]?.label || service.category}
                </Badge>

                {/* Name & Rating */}
                <div className="mb-2">
                  <h4 className="font-semibold mb-1">{service.name}</h4>
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{service.averageRating.toFixed(1)}</span>
                    </div>
                    <span className="text-muted-foreground">({service.totalReviews} đánh giá)</span>
                  </div>
                </div>

                {/* Distance & Time */}
                <div className="flex items-center space-x-4 mb-2 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Navigation className="w-4 h-4" />
                    <span>{calculateDistance(service)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{service.openHours}</span>
                  </div>
                  {service.basePrice !== undefined && (
                    <div className="flex items-center space-x-1 font-medium text-primary">
                      <span>{formatPrice(service)}</span>
                    </div>
                  )}
                </div>

                {/* Features */}
                {service.features && service.features.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {service.features.slice(0, 3).map((item, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {item}
                      </Badge>
                    ))}
                    {service.features.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{service.features.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center space-x-2 mt-3">
                  {service.phone && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={`tel:${service.phone}`}>
                        <Phone className="w-3 h-3 mr-1" />
                        Gọi ngay
                      </a>
                    </Button>
                  )}
                  <Button size="sm" variant="outline" asChild>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${service.latitude},${service.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Chỉ đường
                    </a>
                  </Button>
                  {service.isBookable && (
                    <Button size="sm" variant="default">
                      Đặt dịch vụ
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category Filter */}
      <div className="mt-6 pt-6 border-t border-border">
        <h4 className="font-medium text-sm mb-3">Lọc theo loại dịch vụ</h4>
        <div className="flex flex-wrap gap-2">
          <Badge 
            variant="outline" 
            className={`cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors ${!selectedCategory ? 'bg-primary text-primary-foreground' : ''}`}
            onClick={() => setSelectedCategory(null)}
          >
            Tất cả
          </Badge>
          {Object.entries(categoryInfo).map(([key, info]) => (
            <Badge 
              key={key}
              variant="outline" 
              className={`cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors ${info.color} ${selectedCategory === key ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedCategory(key)}
            >
              {info.label}
            </Badge>
          ))}
        </div>
      </div>
    </Card>
  )
}
