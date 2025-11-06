'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { TripHub } from "@/components/trip-hub"
import { BookingActionsDialog } from "@/components/booking-actions-dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Calendar, X } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function TripDetailPage() {
  const params = useParams()
  const [trip, setTrip] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionMode, setActionMode] = useState<'reschedule' | 'cancel' | null>(null)

  const fetchTrip = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/bookings/${params.id}`)
      if (!res.ok) throw new Error('Không thể tải thông tin chuyến đi')
      
      const data = await res.json()
      setTrip(data)
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrip()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Đang tải thông tin chuyến đi...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <Alert variant="destructive" className="max-w-md">
            <AlertDescription>
              {error || 'Không tìm thấy chuyến đi'}
            </AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    )
  }

  // Transform API data to TripHub format
  const services: Array<{
    id: string
    name: string
    quantityLabel?: string
    totalPrice: number
    status?: string
    updatedAt?: string | null
  }> =
    Array.isArray(trip.additionalServices) && trip.additionalServices.length > 0
      ? trip.additionalServices.map((service: any) => ({
          id: service.id,
          name: service.name,
          quantityLabel: service.quantityLabel,
          totalPrice: Number(service.totalPrice) || 0,
          status: (service.status || 'PENDING').toString().toUpperCase(),
          updatedAt: service.updatedAt ?? null,
        }))
      : []

  const conciergePlans = Array.isArray(trip.conciergePlans)
    ? trip.conciergePlans.map((plan: any) => ({
        id: plan.id,
        status: plan.status,
        loyaltyOffer: plan.loyaltyOffer,
        hostNotes: plan.hostNotes,
        guestNotes: plan.guestNotes,
        createdAt: plan.createdAt,
        partnerInfo: plan.partnerInfo ?? [],
      }))
    : []

  const packingChecklist = [
    "Kiểm tra lại giấy tờ cá nhân và thông tin đặt phòng.",
    "Chuẩn bị tiền mặt hoặc thẻ cho chi phí phát sinh.",
    "Tải ứng dụng LuxeStay để nhận thông báo check-in.",
    ...(services.some((service) => service.id === "airport-pickup")
      ? ["Xác nhận giờ đón sân bay với concierge."]
      : []),
    ...(services.some((service) => service.id === "pet-stay")
      ? ["Mang sổ tiêm chủng và đồ dùng cần thiết cho thú cưng."]
      : []),
  ]

  const upsellExperiences = [
    {
      title: "Gợi ý trải nghiệm địa phương",
      description: "Lên lịch city tour, lớp nấu ăn hoặc tour ẩm thực đêm với concierge.",
      cta: "/experiences",
    },
    {
      title: "Nâng cấp đặc quyền",
      description: "Đổi điểm thưởng để nhận nâng hạng phòng, dịch vụ spa và quà chào mừng.",
      cta: "/rewards/catalog",
    },
  ]

  const tripData = {
    id: trip.id,
    bookingCode: trip.id.slice(-8).toUpperCase(),
    status: trip.status.toLowerCase(),
    canReview: Boolean(trip.canReview),
    reviewUrl: trip.canReview ? `/trips/${trip.id}/review` : undefined,
    listing: {
      title: trip.listing.title,
      location: `${trip.listing.city}, ${trip.listing.state}`,
      image: trip.listing.images[0] || '/placeholder.svg',
      host: {
        name: trip.listing.host.name || 'Host',
        avatar: trip.listing.host.image || '/placeholder.svg',
        phone: trip.listing.host.phone || '+84',
        language: 'Việt/English',
        responseRate: trip.listing.host.hostProfile?.responseRate || 90,
      },
    },
    checkIn: trip.checkIn,
    checkOut: trip.checkOut,
    guests: trip.adults + (trip.children || 0),
    total: trip.totalPrice,
    smartLock: trip.listing.hasSmartLock
      ? {
          code: trip.listing.smartLockCode || '****',
          validFrom: trip.checkIn,
          validTo: trip.checkOut,
        }
      : {
          code: 'Liên hệ chủ nhà để nhận mã',
          validFrom: trip.checkIn,
          validTo: trip.checkOut,
        },
    wifi: {
      name: trip.listing.wifiName || 'WiFi',
      password: trip.listing.wifiPassword || '********',
    },
    arrivalGuide: [
      {
        title: "Đỗ xe & liên hệ",
        description: `Địa chỉ: ${trip.listing.address}. Liên hệ chủ nhà khi đến.`,
        icon: "map" as const,
      },
      {
        title: "Check-in",
        description: `Check-in từ ${trip.listing.checkInTime || '14:00'}. Xuất trình mã đặt phòng.`,
        icon: "door" as const,
      },
      ...(trip.listing.hasSmartLock ? [{
        title: "Sử dụng khóa thông minh",
        description: `Nhập mã ${trip.listing.smartLockCode} để mở cửa.`,
        icon: "key" as const,
      }] : []),
    ],
    houseRules: trip.listing.houseRules?.split('\n') || [
      "Giữ vệ sinh chung",
      "Tôn trọng hàng xóm",
      `Check-out trước ${trip.listing.checkOutTime || '11:00'}`,
    ],
    services,
    servicesTotal:
      Number(trip.additionalServicesTotal) ||
      services.reduce((sum: number, service: { totalPrice: number }) => sum + service.totalPrice, 0),
    conciergePlans,
    packingChecklist,
    upsellExperiences,
    messagesUrl: trip.host?.id
      ? `/messages?participant=${trip.host.id}&listing=${trip.listing.id}`
      : `/messages`,
    directionsUrl: `https://maps.google.com/?q=${trip.listing.latitude},${trip.listing.longitude}`,
  }

  // Check if user can modify booking
  const canModify = 
    trip.status !== 'CANCELLED' && 
    trip.status !== 'COMPLETED' &&
    new Date(trip.checkIn) > new Date()

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-10 lg:px-8">
          {/* Action Buttons */}
          {canModify && (
            <div className="mb-6 flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setActionMode('reschedule')}
                className="gap-2"
              >
                <Calendar className="h-4 w-4" />
                Thay đổi ngày
              </Button>
              <Button
                variant="destructive"
                onClick={() => setActionMode('cancel')}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Hủy phòng
              </Button>
            </div>
          )}

          <TripHub trip={tripData} membershipTier={trip.guest?.loyaltyTier ?? null} />
        </div>
      </main>
      <Footer />

      {/* Booking Actions Dialog */}
      {trip && (
        <BookingActionsDialog
          booking={{
            id: trip.id,
            checkIn: trip.checkIn,
            checkOut: trip.checkOut,
            totalPrice: trip.totalPrice,
            status: trip.status,
            listing: {
              title: trip.listing.title,
              cancellationPolicy: trip.listing.cancellationPolicy,
            },
            guest: {
              membershipStatus: trip.guest?.membershipStatus,
              loyaltyTier: trip.guest?.loyaltyTier,
            },
          }}
          open={actionMode !== null}
          onOpenChange={(open) => !open && setActionMode(null)}
          mode={actionMode!}
          onSuccess={() => {
            fetchTrip()
            setActionMode(null)
          }}
        />
      )}
    </div>
  )
}
