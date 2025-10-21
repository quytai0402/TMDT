import { Calendar, Users, MapPin, MessageCircle, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

interface TripCardProps {
  trip: {
    id: string
    bookingCode: string
    listing: {
      title: string
      location: string
      image: string
      host: string
    }
    checkIn: string
    checkOut: string
    guests: number
    total: number
    status: string
  }
}

export function TripCard({ trip }: TripCardProps) {
  const isUpcoming = trip.status === "confirmed"

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Image */}
          <Link href={`/listing/${trip.id}`} className="flex-shrink-0">
            <img
              src={trip.listing.image || "/placeholder.svg"}
              alt={trip.listing.title}
              className="w-full md:w-64 h-48 rounded-lg object-cover hover:opacity-90 transition-opacity"
            />
          </Link>

          {/* Details */}
          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <Link href={`/listing/${trip.id}`}>
                    <h3 className="font-semibold text-xl text-foreground hover:text-primary transition-colors">
                      {trip.listing.title}
                    </h3>
                  </Link>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4" />
                    <span>{trip.listing.location}</span>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    isUpcoming ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {isUpcoming ? "Đã xác nhận" : "Đã hoàn thành"}
                </span>
              </div>

              <p className="text-sm text-muted-foreground">Chủ nhà: {trip.listing.host}</p>
              <p className="text-xs text-muted-foreground mt-1">Mã đặt phòng: {trip.bookingCode}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  <span>Nhận phòng</span>
                </div>
                <p className="font-medium text-foreground">{new Date(trip.checkIn).toLocaleDateString("vi-VN")}</p>
              </div>
              <div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  <span>Trả phòng</span>
                </div>
                <p className="font-medium text-foreground">{new Date(trip.checkOut).toLocaleDateString("vi-VN")}</p>
              </div>
              <div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-1">
                  <Users className="h-4 w-4" />
                  <span>Số khách</span>
                </div>
                <p className="font-medium text-foreground">{trip.guests} khách</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div>
                <span className="text-sm text-muted-foreground">Tổng thanh toán: </span>
                <span className="font-bold text-lg text-foreground">
                  {(Number.isFinite(trip.total) ? trip.total : 0).toLocaleString("vi-VN")}₫
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/trips/${trip.id}`}>
                    <FileText className="mr-2 h-4 w-4" />
                    Chi tiết
                  </Link>
                </Button>
                <Button variant="outline" size="sm">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Nhắn tin
                </Button>
                {!isUpcoming && (
                  <Button size="sm" className="bg-primary hover:bg-primary-hover">
                    Đánh giá
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
