import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HostSidebar } from "@/components/host-sidebar"
import { ListingManagementCard } from "@/components/listing-management-card"
import { Button } from "@/components/ui/button"
import { Plus, Filter } from "lucide-react"

const allListings = [
  {
    id: "1",
    title: "Villa sang trọng view biển Nha Trang",
    location: "Nha Trang, Khánh Hòa",
    image: "/placeholder.svg?height=200&width=300",
    status: "active",
    price: 3500000,
    bookings: 24,
    revenue: 84000000,
    rating: 4.9,
    reviews: 127,
  },
  {
    id: "2",
    title: "Penthouse hiện đại trung tâm Sài Gòn",
    location: "Quận 1, TP. Hồ Chí Minh",
    image: "/placeholder.svg?height=200&width=300",
    status: "active",
    price: 4200000,
    bookings: 18,
    revenue: 75600000,
    rating: 5.0,
    reviews: 203,
  },
  {
    id: "3",
    title: "Biệt thự vườn Hội An",
    location: "Hội An, Quảng Nam",
    image: "/placeholder.svg?height=200&width=300",
    status: "draft",
    price: 2900000,
    bookings: 0,
    revenue: 0,
    rating: 0,
    reviews: 0,
  },
]

export default function HostListingsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <HostSidebar />

            <div className="flex-1 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Quản lý Listings</h1>
                  <p className="text-muted-foreground">Tổng cộng {allListings.length} listings</p>
                </div>
                <div className="flex items-center space-x-3">
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Lọc
                  </Button>
                  <Button className="bg-primary hover:bg-primary-hover">
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo listing mới
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {allListings.map((listing) => (
                  <ListingManagementCard key={listing.id} listing={listing} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
