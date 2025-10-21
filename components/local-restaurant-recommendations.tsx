"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  MapPin,
  Star,
  Clock,
  Phone,
  Globe,
  Utensils,
  Wine,
  Coffee,
  UtensilsCrossed
} from "lucide-react"

interface Restaurant {
  id: string
  name: string
  cuisine: string
  rating: number
  reviews: number
  priceRange: string
  distance: string
  image: string
  openNow: boolean
  hours: string
  phone: string
  specialties: string[]
}

export function LocalRestaurantRecommendations() {
  const restaurants: Restaurant[] = [
    {
      id: "1",
      name: "Nhà Hàng Hải Sản Biển Đông",
      cuisine: "Hải sản Việt Nam",
      rating: 4.8,
      reviews: 324,
      priceRange: "200,000 - 500,000₫",
      distance: "0.5 km",
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600",
      openNow: true,
      hours: "10:00 - 22:00",
      phone: "0901 234 567",
      specialties: ["Cua hấp", "Tôm nướng", "Cá lăng"],
    },
    {
      id: "2",
      name: "BBQ Garden Đà Lạt",
      cuisine: "BBQ & Nướng",
      rating: 4.6,
      reviews: 256,
      priceRange: "150,000 - 400,000₫",
      distance: "0.8 km",
      image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600",
      openNow: true,
      hours: "17:00 - 23:00",
      phone: "0902 345 678",
      specialties: ["BBQ buffet", "Nướng than hoa", "Lẩu nướng"],
    },
    {
      id: "3",
      name: "Quán Phở Hà Nội",
      cuisine: "Phở & Bún",
      rating: 4.9,
      reviews: 489,
      priceRange: "50,000 - 80,000₫",
      distance: "0.3 km",
      image: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600",
      openNow: true,
      hours: "6:00 - 14:00",
      phone: "0903 456 789",
      specialties: ["Phở bò", "Bún chả", "Nem rán"],
    },
    {
      id: "4",
      name: "The Cafe Rooftop",
      cuisine: "Cafe & Dessert",
      rating: 4.7,
      reviews: 412,
      priceRange: "30,000 - 120,000₫",
      distance: "1.2 km",
      image: "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=600",
      openNow: true,
      hours: "7:00 - 23:00",
      phone: "0904 567 890",
      specialties: ["Cà phê phin", "Bánh ngọt", "View đẹp"],
    },
    {
      id: "5",
      name: "Nhà Hàng Lẩu Thái",
      cuisine: "Thái Lan",
      rating: 4.5,
      reviews: 198,
      priceRange: "180,000 - 350,000₫",
      distance: "1.5 km",
      image: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=600",
      openNow: false,
      hours: "11:00 - 22:00",
      phone: "0905 678 901",
      specialties: ["Lẩu Tom Yum", "Pad Thai", "Mango Sticky Rice"],
    },
    {
      id: "6",
      name: "Wine & Dine Restaurant",
      cuisine: "Fine Dining",
      rating: 4.9,
      reviews: 567,
      priceRange: "500,000 - 1,500,000₫",
      distance: "2.0 km",
      image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600",
      openNow: true,
      hours: "18:00 - 00:00",
      phone: "0906 789 012",
      specialties: ["Bít tết Úc", "Pasta Ý", "Wine collection"],
    },
  ]

  const getCuisineIcon = (cuisine: string) => {
    if (cuisine.includes("Hải sản")) return Utensils
    if (cuisine.includes("BBQ")) return UtensilsCrossed
    if (cuisine.includes("Phở")) return Coffee
    if (cuisine.includes("Cafe")) return Coffee
    if (cuisine.includes("Fine Dining")) return Wine
    return Utensils
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Nhà hàng được đề xuất</h2>
        <p className="text-muted-foreground">
          Những nhà hàng tốt nhất gần chỗ nghỉ của bạn
        </p>
      </div>

      {/* Filter Badges */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        <Badge variant="default">Tất cả</Badge>
        <Badge variant="outline">Hải sản</Badge>
        <Badge variant="outline">BBQ</Badge>
        <Badge variant="outline">Phở</Badge>
        <Badge variant="outline">Cafe</Badge>
        <Badge variant="outline">Fine Dining</Badge>
      </div>

      {/* Restaurant Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {restaurants.map(restaurant => {
          const Icon = getCuisineIcon(restaurant.cuisine)
          
          return (
            <Card key={restaurant.id} className="overflow-hidden hover:shadow-xl transition-shadow">
              <div className="relative aspect-[16/10]">
                <img
                  src={restaurant.image}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3">
                  {restaurant.openNow ? (
                    <Badge className="bg-green-500">Đang mở cửa</Badge>
                  ) : (
                    <Badge variant="destructive">Đã đóng cửa</Badge>
                  )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <div className="flex items-center space-x-2 text-white text-sm">
                    <Icon className="w-4 h-4" />
                    <span>{restaurant.cuisine}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-lg mb-1">{restaurant.name}</h3>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                      <span className="font-medium">{restaurant.rating}</span>
                      <span className="text-muted-foreground">({restaurant.reviews})</span>
                    </div>
                    <span className="text-muted-foreground">•</span>
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{restaurant.distance}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{restaurant.hours}</span>
                </div>

                <div className="text-sm">
                  <span className="font-medium">Giá: </span>
                  <span className="text-muted-foreground">{restaurant.priceRange}</span>
                </div>

                {/* Specialties */}
                <div className="flex flex-wrap gap-2">
                  {restaurant.specialties.map((specialty, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 pt-2">
                  <Button className="flex-1">
                    <Utensils className="w-4 h-4 mr-2" />
                    Đặt bàn
                  </Button>
                  <Button variant="outline" size="icon">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Globe className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <Card className="p-6 bg-gradient-to-r from-primary/10 to-blue-500/10">
        <h3 className="font-semibold mb-3">Cần trợ giúp thêm?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button variant="outline" className="w-full">
            <Phone className="w-4 h-4 mr-2" />
            Gọi concierge
          </Button>
          <Button variant="outline" className="w-full">
            <MapPin className="w-4 h-4 mr-2" />
            Xem trên bản đồ
          </Button>
          <Button variant="outline" className="w-full">
            <Utensils className="w-4 h-4 mr-2" />
            Đề xuất thêm
          </Button>
        </div>
      </Card>
    </div>
  )
}
