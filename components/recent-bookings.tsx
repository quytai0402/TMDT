import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const recentBookings = [
  {
    id: "1",
    guest: {
      name: "Thanh Hương",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    listing: "Villa sang trọng view biển",
    checkIn: "2025-01-15",
    status: "confirmed",
    amount: 19000000,
  },
  {
    id: "2",
    guest: {
      name: "Đức Minh",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    listing: "Villa sang trọng view biển",
    checkIn: "2025-01-22",
    status: "pending",
    amount: 15000000,
  },
  {
    id: "3",
    guest: {
      name: "Lan Anh",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    listing: "Villa sang trọng view biển",
    checkIn: "2025-02-05",
    status: "confirmed",
    amount: 21000000,
  },
]

export function RecentBookings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking gần đây</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentBookings.map((booking) => (
            <div key={booking.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src={booking.guest.avatar || "/placeholder.svg"} alt={booking.guest.name} />
                  <AvatarFallback>{booking.guest.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground">{booking.guest.name}</p>
                  <p className="text-sm text-muted-foreground">{booking.listing}</p>
                  <p className="text-xs text-muted-foreground">
                    Nhận phòng: {new Date(booking.checkIn).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground mb-1">{booking.amount.toLocaleString("vi-VN")}₫</p>
                <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>
                  {booking.status === "confirmed" ? "Đã xác nhận" : "Chờ xác nhận"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
