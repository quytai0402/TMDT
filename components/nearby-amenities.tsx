'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  MapPin, 
  Navigation2, 
  Coffee, 
  UtensilsCrossed, 
  ShoppingBag,
  Camera,
  Bus,
  Star
} from 'lucide-react'

interface NearbyPlace {
  id: string
  name: string
  category: 'restaurant' | 'cafe' | 'shopping' | 'attraction' | 'transport'
  distance: number // meters
  rating: number
  priceLevel: number // 1-4
  walkingTime: number // minutes
  image: string
  description: string
}

interface ListingLocation {
  address: string
  city: string
  district: string
  coordinates: {
    lat: number
    lng: number
  }
}

export function NearbyAmenities({ location }: { location: ListingLocation }) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const nearbyPlaces: NearbyPlace[] = [
    {
      id: '1',
      name: 'Nhà hàng Hải Sản Biển Đông',
      category: 'restaurant',
      distance: 200,
      rating: 4.5,
      priceLevel: 3,
      walkingTime: 3,
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200',
      description: 'Hải sản tươi sống, không gian rộng rãi',
    },
    {
      id: '2',
      name: 'The Coffee House',
      category: 'cafe',
      distance: 150,
      rating: 4.7,
      priceLevel: 2,
      walkingTime: 2,
      image: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=200',
      description: 'Cà phê ngon, wifi tốc độ cao',
    },
    {
      id: '3',
      name: 'Bãi Sau (Back Beach)',
      category: 'attraction',
      distance: 500,
      rating: 4.8,
      priceLevel: 0,
      walkingTime: 7,
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=200',
      description: 'Bãi biển đẹp, nước trong xanh',
    },
    {
      id: '4',
      name: 'Siêu thị Co.opMart',
      category: 'shopping',
      distance: 300,
      rating: 4.3,
      priceLevel: 2,
      walkingTime: 4,
      image: 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=200',
      description: 'Siêu thị lớn, đầy đủ tiện ích',
    },
    {
      id: '5',
      name: 'Bến xe Vũng Tàu',
      category: 'transport',
      distance: 800,
      rating: 4.0,
      priceLevel: 0,
      walkingTime: 11,
      image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=200',
      description: 'Xe khách đi các tỉnh',
    },
    {
      id: '6',
      name: 'Chợ đêm Vũng Tàu',
      category: 'attraction',
      distance: 600,
      rating: 4.6,
      priceLevel: 1,
      walkingTime: 8,
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200',
      description: 'Ẩm thực đường phố phong phú',
    },
  ]

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'restaurant': return UtensilsCrossed
      case 'cafe': return Coffee
      case 'shopping': return ShoppingBag
      case 'attraction': return Camera
      case 'transport': return Bus
      default: return MapPin
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'restaurant': return 'text-orange-600 bg-orange-100'
      case 'cafe': return 'text-brown-600 bg-amber-100'
      case 'shopping': return 'text-blue-600 bg-blue-100'
      case 'attraction': return 'text-green-600 bg-green-100'
      case 'transport': return 'text-purple-600 bg-purple-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getPriceLevelText = (level: number) => {
    if (level === 0) return 'Miễn phí'
    return '₫'.repeat(level)
  }

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${meters}m`
    return `${(meters / 1000).toFixed(1)}km`
  }

  const filteredPlaces = selectedCategory === 'all' 
    ? nearbyPlaces 
    : nearbyPlaces.filter(p => p.category === selectedCategory)

  const categories = [
    { id: 'all', label: 'Tất cả', icon: MapPin },
    { id: 'restaurant', label: 'Nhà hàng', icon: UtensilsCrossed },
    { id: 'cafe', label: 'Quán cà phê', icon: Coffee },
    { id: 'shopping', label: 'Mua sắm', icon: ShoppingBag },
    { id: 'attraction', label: 'Điểm đến', icon: Camera },
    { id: 'transport', label: 'Di chuyển', icon: Bus },
  ]

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Địa điểm lân cận</h2>
        <p className="text-muted-foreground">
          Khám phá những gì xung quanh chỗ nghỉ
        </p>
      </div>

      {/* Category Tabs */}
      <div className="mb-6">
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid grid-cols-3 lg:grid-cols-6 w-full">
            {categories.map((cat) => (
              <TabsTrigger key={cat.id} value={cat.id} className="gap-2">
                <cat.icon className="w-4 h-4" />
                <span className="hidden md:inline">{cat.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Places Grid */}
      <div className="space-y-4">
        {filteredPlaces.map((place) => {
          const CategoryIcon = getCategoryIcon(place.category)
          const colorClass = getCategoryColor(place.category)

          return (
            <div
              key={place.id}
              className="flex gap-4 p-4 rounded-lg border hover:border-primary hover:shadow-md transition-all"
            >
              <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                <img
                  src={place.image}
                  alt={place.name}
                  className="w-full h-full object-cover"
                />
                <div className={`absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
                  <CategoryIcon className="w-4 h-4" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold mb-1 truncate">{place.name}</h3>
                <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                  {place.description}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{place.rating}</span>
                  </div>

                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Navigation2 className="w-4 h-4" />
                    <span>{formatDistance(place.distance)}</span>
                  </div>

                  <div className="text-muted-foreground">
                    🚶 {place.walkingTime} phút đi bộ
                  </div>

                  {place.priceLevel > 0 && (
                    <Badge variant="outline">
                      {getPriceLevelText(place.priceLevel)}
                    </Badge>
                  )}

                  {place.priceLevel === 0 && (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                      Miễn phí
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center">
                <Button variant="outline" size="sm" className="gap-2">
                  <Navigation2 className="w-4 h-4" />
                  Chỉ đường
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Map Preview */}
      <div className="mt-6 pt-6 border-t">
        <Button variant="outline" className="w-full gap-2">
          <MapPin className="w-5 h-5" />
          Xem tất cả trên bản đồ
        </Button>
      </div>
    </Card>
  )
}
