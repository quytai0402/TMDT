import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CollectionHero } from "@/components/collection-hero"
import { CollectionListingsGrid } from "@/components/collection-listings-grid"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Lock } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { evaluateCollectionAccess, getCuratedCollectionBySlug } from "@/lib/curated-collections"

export const dynamic = "force-dynamic"

const curatorFallbackAvatar = "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop"

export default async function CollectionDetailPage({ params }: { params: { id: string } }) {
  const rawId = params?.id ?? ""
  let slug = rawId

  if (typeof rawId !== "string" || rawId.length === 0) {
    notFound()
  }

  try {
    slug = decodeURIComponent(rawId)
  } catch (error) {
    console.warn("Invalid collection slug encoding", { rawId, error })
    notFound()
  }

  const collection = await getCuratedCollectionBySlug(slug)

  if (!collection) {
    notFound()
  }

  const session = await getServerSession(authOptions)
  const membershipStatus = session?.user?.membershipStatus ?? null
  const membershipPlanSlug = session?.user?.membershipPlan?.slug ?? null
  const accessMeta = evaluateCollectionAccess(collection.tags ?? [], membershipStatus, membershipPlanSlug)

  const listingsForGrid = collection.listings.map((listing) => ({
    id: listing.id,
    title: listing.title,
    city: listing.city,
    country: listing.country,
    basePrice: listing.basePrice,
    averageRating: listing.averageRating,
    totalReviews: listing.totalReviews ?? 0,
    images: listing.images ?? [],
    maxGuests: listing.maxGuests ?? 0,
    bedrooms: listing.bedrooms ?? 0,
    host: {
      name: listing.host?.name ?? null,
    },
  }))

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <div className="mb-6">
            <Link href="/collections">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại Collections
              </Button>
            </Link>
          </div>

          {/* Hero Section */}
          <CollectionHero
            title={collection.title}
            description={collection.subtitle}
            longDescription={collection.description}
            image={collection.heroImage}
            listingsCount={collection.listings.length}
            location={collection.location ?? undefined}
            tags={collection.tags}
            membersOnly={accessMeta.membersOnly}
            requiredLabel={accessMeta.requiredLabel}
            locked={accessMeta.locked}
            curator={collection.curatorName
              ? {
                  name: collection.curatorName,
                  avatar: collection.curatorAvatar ?? curatorFallbackAvatar,
                  title: collection.curatorTitle ?? "Travel Curator",
                }
              : undefined}
          />

          {/* Listings / Membership Gate */}
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{collection.listings.length} homestays trong bộ sưu tập</h2>
            </div>

            {accessMeta.locked ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-10 py-12 text-center">
                <Lock className="h-10 w-10 text-amber-500" />
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-amber-800">
                    Bộ sưu tập dành riêng cho {accessMeta.requiredLabel ?? "hội viên"}
                  </h3>
                  <p className="max-w-2xl text-sm text-amber-700">
                    Đăng ký membership để mở khóa toàn bộ homestay trong bộ sưu tập, nhận concierge riêng và ưu đãi độc quyền từ host.
                  </p>
                </div>
                <Button asChild className="bg-amber-500 text-amber-950 hover:bg-amber-400">
                  <Link href="/membership">Nâng cấp membership</Link>
                </Button>
              </div>
            ) : (
              <CollectionListingsGrid listings={listingsForGrid} />
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
