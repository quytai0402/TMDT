"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Heart, Share2, Sparkles } from "lucide-react"
import Image from "next/image"

interface CollectionHeroProps {
  title: string
  description: string
  longDescription?: string
  image: string
  listingsCount: number
  location?: string
  tags: string[]
  curator?: {
    name: string
    avatar: string
    title: string
  }
}

export function CollectionHero({
  title,
  description,
  longDescription,
  image,
  listingsCount,
  location,
  tags,
  curator
}: CollectionHeroProps) {
  return (
    <div className="relative">
      {/* Hero Image */}
      <div className="relative h-[400px] w-full overflow-hidden rounded-2xl">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        {/* Overlay Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
          <div className="space-y-4 text-white max-w-3xl">
            <div className="flex items-center gap-2">
              <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30">
                <Sparkles className="h-3 w-3 mr-1" />
                Curated Collection
              </Badge>
              {location && (
                <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30">
                  <MapPin className="h-3 w-3 mr-1" />
                  {location}
                </Badge>
              )}
            </div>

            <h1 className="text-4xl md:text-5xl font-bold">{title}</h1>
            
            <p className="text-lg text-white/90">{description}</p>

            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="outline" className="bg-white/10 backdrop-blur-sm text-white border-white/30">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="flex items-center gap-4 pt-4">
              <span className="text-sm font-medium">{listingsCount} homestays được tuyển chọn</span>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" className="gap-2">
                  <Heart className="h-4 w-4" />
                  Lưu
                </Button>
                <Button size="sm" variant="secondary" className="gap-2">
                  <Share2 className="h-4 w-4" />
                  Chia sẻ
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Long Description & Curator Info */}
      {(longDescription || curator) && (
        <div className="mt-8 grid md:grid-cols-3 gap-8">
          {longDescription && (
            <div className="md:col-span-2 space-y-4">
              <h2 className="text-2xl font-bold">Về bộ sưu tập này</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {longDescription}
              </p>
            </div>
          )}

          {curator && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Được tuyển chọn bởi</h3>
              <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
                <Image
                  src={curator.avatar}
                  alt={curator.name}
                  width={56}
                  height={56}
                  className="rounded-full"
                />
                <div>
                  <p className="font-semibold">{curator.name}</p>
                  <p className="text-sm text-muted-foreground">{curator.title}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
