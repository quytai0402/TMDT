import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { SecretCollectionGrid, type SecretListingSummary } from "@/components/secret-collection-grid"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Lock, Crown } from "lucide-react"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getMembershipForUser } from "@/lib/membership"

async function fetchSecretListings(): Promise<SecretListingSummary[]> {
  const listings = await prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      isSecret: true,
    },
    include: {
      host: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          reviews: true,
        },
      },
    },
    orderBy: [
      { featured: "desc" },
      { averageRating: "desc" },
      { createdAt: "desc" },
    ],
  })

  return listings.map((listing) => ({
    id: listing.id,
    title: listing.title,
    location: listing.state ? `${listing.city}, ${listing.state}` : `${listing.city}, ${listing.country}`,
    price: listing.basePrice,
    rating: listing.averageRating,
    reviews: listing._count.reviews,
    image: listing.images?.[0] ?? "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80",
    host: listing.host?.name ?? "Host LuxeStay",
    guests: listing.maxGuests,
    bedrooms: listing.bedrooms,
    featured: listing.featured,
    isSecret: true,
  }))
}

export const revalidate = 300

export default async function SecretCollectionPage() {
  const session = await getServerSession(authOptions)
  const membership = session?.user?.id ? await getMembershipForUser(session.user.id) : null
  const isActiveMember = Boolean(membership?.isActive)

  const listings = isActiveMember ? await fetchSecretListings() : []

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/20">
        <div className="container mx-auto px-4 lg:px-10 py-16 space-y-12">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Badge variant="outline" className="px-4 py-1 text-sm border-primary/40 text-primary">
              <Sparkles className="inline h-4 w-4 mr-2" />
              Secret Collection
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Những homestay chỉ dành cho thành viên LuxeStay
            </h1>
            <p className="text-lg text-muted-foreground">
              Trải nghiệm các villa riêng tư, penthouse hướng biển và hideaway ẩn mình được tuyển chọn kỹ càng cho hội viên. Danh sách cập nhật mỗi tháng với ưu đãi độc quyền.
            </p>
          </div>

          {!session?.user ? (
            <Card className="max-w-2xl mx-auto border-dashed border-primary/40">
              <CardContent className="py-10 space-y-4 text-center">
                <Lock className="w-10 h-10 mx-auto text-primary" />
                <h2 className="text-2xl font-semibold">Đăng nhập để mở khóa Secret Collection</h2>
                <p className="text-muted-foreground">
                  Chỉ thành viên LuxeStay mới có thể xem và đặt các homestay trong bộ sưu tập đặc biệt này.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild size="lg">
                    <Link href="/login?callbackUrl=%2Fcollections%2Fsecret">Đăng nhập</Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link href="/membership">Tìm hiểu membership</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : !isActiveMember ? (
            <Card className="max-w-3xl mx-auto border-dashed border-primary/40 bg-primary/5">
              <CardContent className="py-10 space-y-4 text-center">
                <Crown className="w-12 h-12 mx-auto text-primary" />
                <h2 className="text-2xl font-semibold">Nâng cấp membership để xem Secret Collection</h2>
                <p className="text-muted-foreground">
                  Bạn cần trở thành hội viên LuxeStay (Gold hoặc Diamond) để truy cập bộ sưu tập này. Quyền lợi bao gồm giảm giá, quà tặng và concierge riêng.
                </p>
                <Button size="lg" asChild>
                  <Link href="/membership?reason=secret">Nâng cấp membership</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-10">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="text-left space-y-1">
                  <p className="text-sm font-semibold text-primary uppercase tracking-wide">Exclusive Members Access</p>
                  <h2 className="text-2xl font-bold">Tổng hợp {listings.length} homestay bí mật</h2>
                  <p className="text-muted-foreground">
                    Mỗi homestay đều đã được concierge LuxeStay kiểm tra thực tế, đảm bảo tiêu chuẩn tiện nghi, riêng tư và dịch vụ.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button asChild variant="outline">
                    <Link href="/experiences/members">Workshop & city tour</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/membership">Quyền lợi của tôi</Link>
                  </Button>
                </div>
              </div>

              <SecretCollectionGrid listings={listings} />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
