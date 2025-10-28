"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, Clock, Users, MapPin, Heart } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

interface ExperienceCardProps {
  id: string
  title: string
  description: string
  image: string
  host: {
    name: string
    avatar: string
    verified?: boolean
  }
  category: string
  location: string
  duration: string
  groupSize: string
  price: number
  rating: number
  reviewCount: number
  tags: string[]
  featured?: boolean
  membersOnly?: boolean
}

export function ExperienceCard({
  id,
  title,
  description,
  image,
  host,
  category,
  location,
  duration,
  groupSize,
  price,
  rating,
  reviewCount,
  tags,
  featured,
  membersOnly,
}: ExperienceCardProps) {
  const [isLiked, setIsLiked] = useState(false)

  return (
    <Link href={`/experiences/${id}`}>
      <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer h-full">
        <div className="relative h-56 overflow-hidden">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
          {(featured || membersOnly) && (
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {membersOnly && (
                <Badge className="bg-purple-600 text-white shadow-md">
                  Member Only
                </Badge>
              )}
              {featured && (
                <Badge className="bg-orange-600 text-white">
                  ⭐ Nổi bật
                </Badge>
              )}
            </div>
          )}
          <div className="absolute top-4 right-4">
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 rounded-full bg-white/90 hover:bg-white"
              onClick={(e) => {
                e.preventDefault()
                setIsLiked(!isLiked)
              }}
            >
              <Heart className={`h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
            </Button>
          </div>
          <div className="absolute bottom-4 left-4">
            <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm">
              {category}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          {/* Rating & Location */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-orange-600">
              <Star className="h-3.5 w-3.5 fill-current" />
              <span className="font-bold">{rating}</span>
              <span className="text-muted-foreground">({reviewCount})</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{location}</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-base group-hover:text-primary transition-colors line-clamp-2">
            {title}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>

          {/* Host */}
          <div className="flex items-center gap-2 pt-1">
            <Image
              src={host.avatar}
              alt={host.name}
              width={24}
              height={24}
              className="rounded-full"
            />
            <span className="text-xs text-muted-foreground">
              Hướng dẫn bởi <span className="font-medium text-foreground">{host.name}</span>
              {host.verified && " ✓"}
            </span>
          </div>

          {/* Details */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{duration}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              <span>{groupSize}</span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <div className="flex items-center justify-between w-full">
            <div>
              <span className="text-xs text-muted-foreground">Từ</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold">
                  {(Number.isFinite(price) ? price : 0).toLocaleString("vi-VN")}₫
                </span>
                <span className="text-xs text-muted-foreground">/người</span>
              </div>
            </div>
            <Button size="sm" variant="outline" className="group-hover:bg-primary group-hover:text-white transition-colors">
              Đặt ngay
            </Button>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
