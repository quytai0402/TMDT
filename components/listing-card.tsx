"use client"

import { Heart, Star, MapPin, Users, Bed } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useState } from "react"

interface ListingCardProps {
  id: string
  title: string
  location: string
  price: number
  rating: number
  reviews: number
  image: string
  host: string
  guests?: number
  bedrooms?: number
  featured?: boolean
  isSecret?: boolean
  nearbyPlacesCount?: number
}

export function ListingCard({
  id,
  title,
  location,
  price,
  rating,
  reviews,
  image,
  host,
  guests = 4,
  bedrooms = 2,
  featured = false,
  isSecret = false,
  nearbyPlacesCount,
}: ListingCardProps) {
  const [isFavorite, setIsFavorite] = useState(false)

  return (
    <Link href={`/listing/${id}`} className="group block">
      <div className="space-y-3">
        {/* Image */}
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-md group-hover:shadow-xl transition-shadow bg-gradient-to-br from-blue-100 to-blue-200">
          <img
            src={image || `https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&h=400&fit=crop&auto=format`}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              const target = e.target as HTMLImageElement
            target.src = `https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&h=400&fit=crop&auto=format`
          }}
        />
          {(isSecret || featured) && (
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              {isSecret && <Badge className="bg-purple-600 text-white font-semibold shadow-lg">Secret</Badge>}
              {featured && <Badge className="bg-accent text-white font-semibold">Nổi bật</Badge>}
            </div>
          )}
        <Button
          size="icon"
          variant="ghost"
            className={`absolute top-3 right-3 h-9 w-9 rounded-full backdrop-blur-sm transition-all ${
              isFavorite ? "bg-white text-red-500 hover:bg-white" : "bg-white/90 hover:bg-white hover:scale-110"
            }`}
            onClick={(e) => {
              e.preventDefault()
              setIsFavorite(!isFavorite)
            }}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
          </Button>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <div className="flex items-center space-x-4 text-white text-sm">
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>{guests} khách</span>
              </div>
              <div className="flex items-center space-x-1">
                <Bed className="h-4 w-4" />
                <span>{bedrooms} phòng ngủ</span>
              </div>
              {nearbyPlacesCount && nearbyPlacesCount > 0 && (
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{nearbyPlacesCount} địa điểm</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-foreground truncate group-hover:text-primary transition-colors">
                {title}
              </h3>
              <div className="flex items-center space-x-1 text-muted-foreground mt-1">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <p className="text-sm truncate">{location}</p>
              </div>
            </div>
            <div className="flex items-center space-x-1 bg-foreground text-white px-2 py-1 rounded-lg">
              <Star className="h-3.5 w-3.5 fill-current" />
              <span className="text-sm font-bold">{rating}</span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Chủ nhà: <span className="font-medium text-foreground">{host}</span> • {reviews} đánh giá
          </p>

          <div className="pt-1 flex items-baseline space-x-1">
            <span className="text-xl font-bold text-foreground">{price.toLocaleString("vi-VN")}₫</span>
            <span className="text-sm text-muted-foreground">/ đêm</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
