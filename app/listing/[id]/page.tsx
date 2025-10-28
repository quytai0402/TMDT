import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ListingGallery } from "@/components/listing-gallery"
import { PremiumListingGallery } from "@/components/premium-listing-gallery"
import { ListingInfo } from "@/components/listing-info"
import { BookingWidget } from "@/components/booking-widget"
import { AmenitiesSection } from "@/components/amenities-section"
import { ReviewsSection } from "@/components/reviews-section"
import { HostCard } from "@/components/host-card"
import { LocationMap } from "@/components/location-map"
import { SimilarListings } from "@/components/similar-listings"
import { ListingDigitalExperiences } from "@/components/listing-digital-experiences"
import { ListingVerifiedAmenities } from "@/components/listing-verified-amenities"
import { ReviewAiSummary } from "@/components/review-ai-summary"
import { WishlistButton } from "@/components/wishlist-button"
import { ReviewHighlights } from "@/components/review-highlights"
import { SentimentChart } from "@/components/sentiment-chart"
import { NearbyAmenities } from "@/components/nearby-amenities"
import { ImmersiveMediaSection } from "@/components/immersive-media-section"
import { WorkationSection } from "@/components/workation-section"
import { PetFriendlySection } from "@/components/pet-friendly-section"
import { NearbyPlaces } from "@/components/nearby-places"
import { AIReviewAnalysis } from "@/components/ai-review-analysis"
import { ListingViewTracker } from "@/components/listing-view-tracker"
import { ShareButton } from "@/components/share-button"
import { ListingLoyaltyPerks } from "@/components/listing-loyalty-perks"
import { ListingTrustPanel } from "@/components/listing-trust-panel"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

async function getListingData(id: string) {
  const listing = await prisma.listing.findUnique({
    where: { id, status: 'ACTIVE' },
    include: {
      host: {
        select: {
          id: true,
          name: true,
          image: true,
          bio: true,
          languages: true,
          isVerified: true,
          isSuperHost: true,
          createdAt: true,
          hostProfile: {
            select: {
              responseRate: true,
              responseTime: true,
              totalReviews: true,
              averageRating: true,
            },
          },
        },
      },
      reviews: {
        include: {
          reviewer: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  })

  if (!listing) {
    return null
  }

  // Fetch amenity names if amenities are ObjectIds
  let amenityNames: string[] = listing.amenities as string[]
  if (listing.amenities && listing.amenities.length > 0 && listing.amenities[0].length === 24) {
    // Looks like ObjectId, fetch names
    try {
      const amenities = await prisma.amenity.findMany({
        where: {
          id: { in: listing.amenities }
        },
        select: {
          nameVi: true,
          name: true,
        }
      })
      amenityNames = amenities.map(a => a.nameVi || a.name)
    } catch (e) {
      console.error('Error fetching amenities:', e)
      // Fallback to displaying IDs or empty
      amenityNames = []
    }
  }

  // Calculate average rating from reviews
  const avgRating =
    listing.reviews.length > 0
      ? listing.reviews.reduce((sum, r) => sum + r.overallRating, 0) / listing.reviews.length
      : 0

  // Build location string
  const locationString = `${listing.city}, ${listing.state || listing.country}`

  return {
    ...listing,
    amenities: amenityNames,
    averageRating: avgRating,
    locationString,
  }
}

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const listing = await getListingData(id)

  if (!listing) {
    notFound()
  }

  const session = await getServerSession(authOptions)
  const canViewInsights = Boolean(
    session?.user &&
    (session.user.role === 'ADMIN' || session.user.id === listing.host.id)
  )

  // Extract city from location for nearby places
  const city = listing.city
  const reviewHighlightsData = listing.reviews.map((review) => ({
    id: review.id,
    reviewer: {
      id: review.reviewer?.id ?? 'anonymous',
      name: review.reviewer?.name ?? 'Khách ẩn danh',
      image: review.reviewer?.image ?? null,
    },
    overallRating: review.overallRating,
    comment: review.comment ?? '',
    createdAt: review.createdAt,
    cleanlinessRating: review.cleanlinessRating ?? undefined,
    communicationRating: review.communicationRating ?? undefined,
    locationRating: review.locationRating ?? undefined,
    valueRating: review.valueRating ?? undefined,
  }))

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <ListingViewTracker listingId={listing.id} />
      <main className="flex-1">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          {/* Title */}
          <div className="mb-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">
                  {listing.title}
                </h1>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="flex items-center space-x-1">
                    <span className="font-semibold">{listing.averageRating.toFixed(1)}</span>
                    <span className="text-muted-foreground">({listing.reviews.length} đánh giá)</span>
                  </span>
                  <span className="text-muted-foreground">{listing.locationString}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <ShareButton 
                  listingId={listing.id}
                  title={listing.title}
                />
                <WishlistButton listingId={listing.id} size="lg" />
              </div>
            </div>
          </div>

          {/* Gallery - Use real images from database */}
          <PremiumListingGallery 
            images={listing.images.map((url, idx) => ({
              id: String(idx + 1),
              url,
              type: 'photo' as const,
              title: `${listing.title} - Ảnh ${idx + 1}`,
              thumbnail: url,
            }))}
            title={listing.title} 
          />

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            {/* Left Column - Info */}
            <div className="lg:col-span-2 space-y-8">
              <ListingInfo
                host={{
                  name: listing.host.name || 'Host',
                  avatar: listing.host.image || '/placeholder.svg',
                  verified: listing.host.isVerified,
                }}
                details={{
                  guests: listing.maxGuests,
                  bedrooms: listing.bedrooms,
                  beds: listing.beds,
                  bathrooms: listing.bathrooms,
                }}
                description={listing.description}
              />

              <ListingTrustPanel
                hostName={listing.host.name || 'Host'}
                hostVerified={listing.host.isVerified}
                isSuperHost={listing.host.isSuperHost}
                verifiedAmenities={listing.verifiedAmenities}
                hasSmartLock={listing.hasSmartLock}
                wifiName={listing.wifiName}
                wifiPassword={listing.wifiPassword}
              />

              <AmenitiesSection 
                amenities={[
                  {
                    category: 'Tiện nghi',
                    items: listing.amenities as string[],
                  },
                ]}
              />

              <WorkationSection 
                listingId={id}
                dailyPrice={listing.basePrice}
                wifiSpeed={{
                  download: 287,
                  upload: 145,
                  ping: 12,
                  lastTested: "5 ngày trước"
                }}
              />

              {/* NEW: Nearby Places with Google Maps */}
              <NearbyPlaces
                listingId={listing.id}
                city={city}
                lat={listing.latitude}
                lng={listing.longitude}
              />

              <LocationMap 
                coordinates={{
                  lat: listing.latitude,
                  lng: listing.longitude,
                }}
                address={listing.address}
              />

              {/* NEW: AI Review Analysis */}
              {canViewInsights && (
                <AIReviewAnalysis
                  listingId={listing.id}
                  city={city}
                />
              )}

              <ReviewHighlights 
                reviews={reviewHighlightsData}
                averageRating={listing.averageRating}
                totalReviews={listing.reviews.length}
              />
            </div>

            {/* Right Column - Booking Widget */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                <BookingWidget 
                  listingId={listing.id}
                  price={listing.basePrice} 
                  rating={listing.averageRating} 
                  reviews={listing.reviews.length}
                  instantBookable={listing.instantBookable}
                />
                <ListingLoyaltyPerks
                  listingId={listing.id}
                  hostName={listing.host.name || 'Host'}
                  isSuperHost={listing.host.isSuperHost}
                />
              </div>
            </div>
          </div>

          {/* Host Card - Real host data */}
          <div className="mt-12">
            <HostCard 
              host={{
                id: listing.host.id,
                name: listing.host.name || 'Host',
                avatar: listing.host.image || '/placeholder.svg',
                joinedDate: new Date(listing.host.createdAt).getFullYear().toString(),
                verified: listing.host.isVerified,
                responseRate: listing.host.hostProfile?.responseRate || 0,
                responseTime: String(listing.host.hostProfile?.responseTime || 'chưa rõ'),
              }}
              listingId={listing.id}
            />
          </div>

          {/* Similar Listings - ML Algorithm */}
          <div className="mt-16">
            <SimilarListings currentListingId={listing.id} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
