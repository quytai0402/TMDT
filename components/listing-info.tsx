import { Users, Bed, Bath, Home, ShieldCheck } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

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
  return (
    <div className="space-y-6 pb-8 border-b border-border">
      {/* Host Info */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-foreground">Chủ nhà: {host.name}</h2>
            {host.verified && (
              <Badge variant="outline" className="flex items-center gap-1 border-emerald-200 bg-emerald-50 text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" /> Đã xác thực
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
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
        <Avatar className="h-16 w-16">
          <AvatarImage src={host.avatar || "/placeholder.svg"} alt={host.name} />
          <AvatarFallback>{host.name[0]}</AvatarFallback>
        </Avatar>
      </div>

      {/* Description */}
      <div>
        <h3 className="font-semibold text-lg text-foreground mb-3">Giới thiệu</h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  )
}
