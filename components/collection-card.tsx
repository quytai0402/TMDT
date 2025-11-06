"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Lock, MapPin } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { evaluateCollectionAccess } from "@/lib/curated-collections"

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
  const { data: session } = useSession()
  const membershipStatus = session?.user?.membershipStatus ?? null
  const membershipPlanSlug = session?.user?.membershipPlan?.slug ?? null
  const accessMeta = evaluateCollectionAccess(tags, membershipStatus, membershipPlanSlug)
  const href = accessMeta.locked ? "/membership" : `/collections/${id}`
  const actionLabel = accessMeta.locked ? "Nâng cấp" : "Khám phá"

  return (
    <Link href={href}>
      <Card className="group relative h-full cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-xl">
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

          <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
            {tags.slice(0, 3).map((tag) => {
              const isMembershipTag = tag.toLowerCase().includes("members")
              return (
                <Badge
                  key={tag}
                  variant="secondary"
                  className={`backdrop-blur-sm ${isMembershipTag ? "bg-amber-200 text-amber-900" : "bg-white/90"}`}
                >
                  {tag}
                </Badge>
              )
            })}
          </div>

          {accessMeta.locked && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/70 p-4 text-center text-slate-100 backdrop-blur-sm">
              <Lock className="h-8 w-8 text-amber-300" />
              <div className="text-sm">
                Chỉ dành cho {accessMeta.requiredLabel ?? "hội viên"} <br /> Đăng ký để mở khóa
              </div>
              <span className="text-xs text-amber-200">Bấm để nâng cấp membership</span>
            </div>
          )}
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
                {actionLabel}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
