import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HostSidebar } from "@/components/host-sidebar"
import { CalendarView } from "@/components/calendar-view"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function HostCalendarPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <HostSidebar />

            <div className="flex-1 space-y-6">
              <div>
                <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Lịch đặt phòng</h1>
                <p className="text-muted-foreground">Quản lý lịch trống và booking của các listing</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Tháng 1, 2025</CardTitle>
                </CardHeader>
                <CardContent>
                  <CalendarView />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Booking sắp tới</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div>
                          <p className="font-semibold text-foreground">Villa sang trọng view biển</p>
                          <p className="text-sm text-muted-foreground">15/01/2025 - 20/01/2025 • Thanh Hương</p>
                        </div>
                        <Badge>Đã xác nhận</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
