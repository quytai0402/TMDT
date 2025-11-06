'use client'

import { useState } from "react"
import { Users, Bed, Bath, Home, ShieldCheck } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface ListingInfoProps {
  host: {
    name: string
    avatar: string
    verified: boolean
  }
  details: {
    guests: number
    bedrooms: number
    beds: number
    bathrooms: number
  }
  description: string
}

export function ListingInfo({ host, details, description }: ListingInfoProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const shouldTruncate = description.length > 300

  return (
    <div className="space-y-6 pb-8 border-b border-border">
      {/* Host Info */}
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-semibold text-foreground">Chủ nhà: {host.name}</h2>
            {host.verified && (
              <Badge variant="outline" className="flex items-center gap-1 border-emerald-200 bg-emerald-50 text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" /> Đã xác thực
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground flex-wrap gap-y-1">
            <span className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{details.guests} khách</span>
            </span>
            <span className="flex items-center space-x-1">
              <Home className="h-4 w-4" />
              <span>{details.bedrooms} phòng ngủ</span>
            </span>
            <span className="flex items-center space-x-1">
              <Bed className="h-4 w-4" />
              <span>{details.beds} giường</span>
            </span>
            <span className="flex items-center space-x-1">
              <Bath className="h-4 w-4" />
              <span>{details.bathrooms} phòng tắm</span>
            </span>
          </div>
        </div>
        <Avatar className="h-16 w-16 flex-shrink-0 ml-4">
          <AvatarImage src={host.avatar || "/placeholder.svg"} alt={host.name} />
          <AvatarFallback>{host.name[0]}</AvatarFallback>
        </Avatar>
      </div>

      {/* Description */}
      <div>
        <h3 className="font-semibold text-lg text-foreground mb-3">Giới thiệu</h3>
        <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap break-words">
          {shouldTruncate && !isExpanded ? (
            <>
              <p>{description.slice(0, 300)}...</p>
              <Button
                variant="link"
                className="p-0 h-auto font-semibold text-foreground hover:underline mt-2"
                onClick={() => setIsExpanded(true)}
              >
                Xem thêm
              </Button>
            </>
          ) : (
            <>
              <p>{description}</p>
              {shouldTruncate && (
                <Button
                  variant="link"
                  className="p-0 h-auto font-semibold text-foreground hover:underline mt-2"
                  onClick={() => setIsExpanded(false)}
                >
                  Thu gọn
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
