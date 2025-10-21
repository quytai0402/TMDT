"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, MapPin, Clock, Users, Heart, Share2, Calendar } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

interface ExperienceHeroProps {
  title: string
  description: string
  images: string[]
  host: {
    name: string
    avatar: string
    verified?: boolean
    bio?: string
  }
  category: string
  location: string
  duration: string
  groupSize: string
  languages: string[]
  rating: number
  reviewCount: number
}

export function ExperienceHero({
  title,
  description,
  images,
  host,
  category,
  location,
  duration,
  groupSize,
  languages,
  rating,
  reviewCount
}: ExperienceHeroProps) {
  const [isLiked, setIsLiked] = useState(false)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{category}</Badge>
          <div className="flex items-center gap-1 text-sm">
            <MapPin className="h-4 w-4" />
            <span>{location}</span>
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold">{title}</h1>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-orange-600 text-orange-600" />
              <span className="font-bold">{rating}</span>
              <span className="text-muted-foreground">({reviewCount} đánh giá)</span>
            </div>
            <span className="text-muted-foreground">•</span>
            <div className="flex items-center gap-2">
              <Image
                src={host.avatar}
                alt={host.name}
                width={24}
                height={24}
                className="rounded-full"
              />
              <span>Hướng dẫn bởi <span className="font-medium">{host.name}</span></span>
              {host.verified && <Badge variant="secondary" className="h-5 px-1.5 text-xs">✓</Badge>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => setIsLiked(!isLiked)}
            >
              <Heart className={`h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
              Lưu
            </Button>
            <Button size="sm" variant="outline" className="gap-2">
              <Share2 className="h-4 w-4" />
              Chia sẻ
            </Button>
          </div>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="grid grid-cols-4 gap-2 h-[400px]">
        <div className="col-span-2 row-span-2 relative rounded-l-2xl overflow-hidden">
          <Image
            src={images[0]}
            alt={title}
            fill
            className="object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
          />
        </div>
        <div className="relative rounded-tr-2xl overflow-hidden">
          <Image
            src={images[1] || images[0]}
            alt={title}
            fill
            className="object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
          />
        </div>
        <div className="relative rounded-tr-2xl overflow-hidden">
          <Image
            src={images[2] || images[0]}
            alt={title}
            fill
            className="object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
          />
        </div>
        <div className="relative overflow-hidden">
          <Image
            src={images[3] || images[0]}
            alt={title}
            fill
            className="object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
          />
        </div>
        <div className="relative rounded-br-2xl overflow-hidden">
          <Image
            src={images[4] || images[0]}
            alt={title}
            fill
            className="object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
          />
          {images.length > 5 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white font-semibold">+{images.length - 5} ảnh</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Info */}
      <div className="flex flex-wrap gap-6 p-6 bg-muted/30 rounded-xl">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Thời gian</p>
            <p className="text-sm text-muted-foreground">{duration}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Quy mô nhóm</p>
            <p className="text-sm text-muted-foreground">{groupSize}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Ngôn ngữ</p>
            <p className="text-sm text-muted-foreground">{languages.join(", ")}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
