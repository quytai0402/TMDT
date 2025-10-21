"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, MapPin } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface CollectionCardProps {
  id: string
  title: string
  description: string
  image: string
  listingsCount: number
  location?: string
  tags: string[]
  featured?: boolean
}

export function CollectionCard({
  id,
  title,
  description,
  image,
  listingsCount,
  location,
  tags,
  featured
}: CollectionCardProps) {
  return (
    <Link href={`/collections/${id}`}>
      <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer h-full">
        <div className="relative h-64 overflow-hidden">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
          {featured && (
            <div className="absolute top-4 left-4">
              <Badge className="bg-yellow-600 text-white">
                ⭐ Featured
              </Badge>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          
          {/* Tags overlay */}
          <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
            {tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="bg-white/90 backdrop-blur-sm">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <CardContent className="p-6">
          <div className="space-y-3">
            {location && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{location}</span>
              </div>
            )}

            <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
              {title}
            </h3>

            <p className="text-muted-foreground line-clamp-2">
              {description}
            </p>

            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-muted-foreground">
                {listingsCount} homestays
              </span>
              <Button variant="ghost" size="sm" className="group-hover:translate-x-1 transition-transform">
                Khám phá
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
