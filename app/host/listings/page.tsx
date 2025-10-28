import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HostSidebar } from "@/components/host-sidebar"
import { ListingManagementCard } from "@/components/listing-management-card"
import { Button } from "@/components/ui/button"
import { Plus, Filter } from "lucide-react"
import { DESTINATIONS } from "@/data/destinations"

const pseudoRandom = (seed: string) => {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

const curatedListings = DESTINATIONS.flatMap((destination) =>
  destination.stays.slice(0, 1).map((stay, index) => {
    const seed = `${destination.slug}-${stay.slug}-${index}`
    const randomBase = pseudoRandom(seed)
    const price = stay.pricePerNight
    const bookings = (randomBase % 40) + 12
    const revenue = bookings * price * 0.75
    const reviews = (randomBase % 150) + 24
    const rating = 4.4 + ((randomBase % 6) * 0.1)

    return {
      id: `${destination.slug}-${stay.slug}`,
      title: stay.title,
      location: `${stay.city}, ${stay.state}`,
      image: stay.images[0] ?? destination.heroImage,
      status: "active",
      price,
      bookings,
      revenue,
      rating: Math.min(4.9, parseFloat(rating.toFixed(1))),
      reviews,
    }
  })
)

export default function HostListingsPage() {
  const totalListings = curatedListings.length

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
                  <p className="text-muted-foreground">Tổng cộng {totalListings} listings đã được seed sẵn</p>
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
                {curatedListings.map((listing) => (
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
