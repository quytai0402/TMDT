import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Eye, MoreVertical, TrendingUp, Calendar, Star } from "lucide-react"

interface ListingManagementCardProps {
  listing: {
    id: string
    title: string
    location: string
    image: string
    status: string
    price: number
    bookings: number
    revenue: number
    rating: number
    reviews: number
  }
}

export function ListingManagementCard({ listing }: ListingManagementCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <img
            src={listing.image || "/placeholder.svg"}
            alt={listing.title}
            className="w-full md:w-64 h-48 rounded-lg object-cover"
          />

          <div className="flex-1 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="font-semibold text-xl text-foreground">{listing.title}</h3>
                  <Badge variant={listing.status === "active" ? "default" : "secondary"}>
                    {listing.status === "active" ? "Đang hoạt động" : "Bản nháp"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{listing.location}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Giá / đêm</p>
                <p className="font-semibold text-foreground">{listing.price.toLocaleString("vi-VN")}₫</p>
              </div>
              <div>
                <div className="flex items-center space-x-1 mb-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Bookings</p>
                </div>
                <p className="font-semibold text-foreground">{listing.bookings}</p>
              </div>
              <div>
                <div className="flex items-center space-x-1 mb-1">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Doanh thu</p>
                </div>
                <p className="font-semibold text-foreground">{listing.revenue.toLocaleString("vi-VN")}₫</p>
              </div>
              <div>
                <div className="flex items-center space-x-1 mb-1">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Đánh giá</p>
                </div>
                <p className="font-semibold text-foreground">
                  {listing.rating > 0 ? `${listing.rating} (${listing.reviews})` : "Chưa có"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-4 border-t border-border">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Xem
              </Button>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Chỉnh sửa
              </Button>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Lịch
              </Button>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
