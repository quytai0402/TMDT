'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { TripHub } from "@/components/trip-hub"
import { Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function TripDetailPage() {
  const params = useParams()
  const [trip, setTrip] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTrip = async () => {
      try {
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
  const tripData = {
    id: trip.id,
    bookingCode: trip.id.slice(-8).toUpperCase(),
    status: trip.status.toLowerCase(),
    canReview: Boolean(trip.canReview),
    reviewUrl: `/trips/${trip.id}/review`,
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
    concierge: [],
    messagesUrl: `/messages`,
    directionsUrl: `https://maps.google.com/?q=${trip.listing.latitude},${trip.listing.longitude}`,
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-10 lg:px-8">
          <TripHub trip={tripData} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
