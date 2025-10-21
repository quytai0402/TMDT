import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Eye, MoreVertical, TrendingUp } from "lucide-react"

const listings = [
  {
    id: "1",
    title: "Villa sang trọng view biển Nha Trang",
    image: "/placeholder.svg?height=100&width=150",
    status: "active",
    price: 3500000,
    bookings: 24,
    revenue: 84000000,
    rating: 4.9,
  },
  {
    id: "2",
    title: "Penthouse hiện đại trung tâm Sài Gòn",
    image: "/placeholder.svg?height=100&width=150",
    status: "active",
    price: 4200000,
    bookings: 18,
    revenue: 75600000,
    rating: 5.0,
  },
]

export function HostListings() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Listings của bạn</CardTitle>
          <Button variant="outline" size="sm">
            Xem tất cả
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {listings.map((listing) => (
            <div key={listing.id} className="flex items-center space-x-4 p-4 border border-border rounded-lg">
              <img
                src={listing.image || "/placeholder.svg"}
                alt={listing.title}
                className="w-32 h-24 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">{listing.title}</h3>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>{listing.price.toLocaleString("vi-VN")}₫ / đêm</span>
                  <span>•</span>
                  <span>{listing.bookings} bookings</span>
                  <span>•</span>
                  <span>⭐ {listing.rating}</span>
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">
                    {listing.revenue.toLocaleString("vi-VN")}₫ doanh thu
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Xem
                </Button>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Sửa
                </Button>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
