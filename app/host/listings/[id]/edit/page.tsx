"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, Loader2 } from "lucide-react"

import { HostLayout } from "@/components/host-layout"
import { HostListingForm } from "@/components/host-listing-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/lib/toast"
import { useListings, type CreateListingData } from "@/hooks/use-listings"

interface ListingDetails extends Partial<CreateListingData> {
  id?: string
  status?: string | null
  slug?: string | null
}

export default function HostEditListingPage() {
  const params = useParams()
  const router = useRouter()
  const { getListing } = useListings()
  const [initialData, setInitialData] = useState<ListingDetails | null>(null)
  const [isFetching, setIsFetching] = useState(true)

  const listingId = useMemo(() => {
    const raw = params?.id
    if (!raw) return null
    return Array.isArray(raw) ? raw[0] : raw
  }, [params?.id])

  useEffect(() => {
    if (!listingId) return

    const fetchListing = async () => {
      try {
        setIsFetching(true)
        const response = await getListing(listingId)
        const listing = response?.listing

        if (!listing) {
          toast.error("Không tìm thấy listing")
          router.push("/host/listings")
          return
        }

        const normalized: ListingDetails = {
          id: listing.id ?? listing._id,
          status: listing.status,
          slug: listing.slug,
          title: listing.title ?? "",
          description: listing.description ?? "",
          propertyType: listing.propertyType ?? "APARTMENT",
          roomType: listing.roomType ?? "ENTIRE_PLACE",
          maxGuests: listing.maxGuests ?? 1,
          bedrooms: listing.bedrooms ?? 1,
          beds: listing.beds ?? 1,
          bathrooms: listing.bathrooms ?? 1,
          country: listing.country ?? "",
          city: listing.city ?? "",
          address: listing.address ?? "",
          latitude: listing.latitude ?? 0,
          longitude: listing.longitude ?? 0,
          basePrice: listing.basePrice ?? listing.pricePerNight ?? 0,
          cleaningFee: listing.cleaningFee ?? undefined,
          images: Array.isArray(listing.images) ? listing.images : Array.isArray(listing.photos) ? listing.photos : [],
          amenities: Array.isArray(listing.amenities)
            ? listing.amenities
            : Array.isArray(listing.verifiedAmenities)
              ? listing.verifiedAmenities
              : [],
        }

        setInitialData(normalized)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Không thể tải dữ liệu listing"
        toast.error(message)
        router.push("/host/listings")
      } finally {
        setIsFetching(false)
      }
    }

    void fetchListing()
  }, [getListing, listingId, router])

  if (!listingId) {
    return (
      <HostLayout>
        <div className="flex h-full flex-col items-center justify-center gap-3">
          <p className="text-sm text-muted-foreground">Không xác định được listing.</p>
          <Button asChild variant="outline">
            <Link href="/host/listings">Quay lại danh sách</Link>
          </Button>
        </div>
      </HostLayout>
    )
  }

  if (isFetching) {
    return (
      <HostLayout>
        <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Đang tải dữ liệu listing...</span>
        </div>
      </HostLayout>
    )
  }

  if (!initialData) {
    return (
      <HostLayout>
        <div className="flex h-full flex-col items-center justify-center gap-3">
          <p className="text-sm text-muted-foreground">Không tìm thấy dữ liệu listing.</p>
          <Button asChild variant="outline">
            <Link href="/host/listings">Quay lại danh sách</Link>
          </Button>
        </div>
      </HostLayout>
    )
  }

  return (
    <HostLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/host/listings">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Quay lại</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Chỉnh sửa listing</h1>
            <p className="text-sm text-muted-foreground">
              Cập nhật thông tin để đồng bộ tức thì sang phía khách và admin. Các thay đổi quan trọng có thể cần duyệt lại.
            </p>
          </div>
        </div>

        {initialData.status === "PENDING_REVIEW" ? (
          <Card>
            <CardContent className="py-4 text-sm text-muted-foreground">
              Listing đang chờ duyệt. Mọi chỉnh sửa sẽ được gửi lại cho quản trị viên để kiểm tra trước khi bật cho khách đặt.
            </CardContent>
          </Card>
        ) : null}

        <HostListingForm mode="edit" listingId={listingId} initialData={initialData} />
      </div>
    </HostLayout>
  )
}
