'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { ReviewForm } from '@/components/review-form'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, ArrowLeft } from 'lucide-react'

interface ReviewPageProps {
  params: {
    id: string
  }
}

export default function ReviewPage({ params }: ReviewPageProps) {
  const router = useRouter()
  const { status } = useSession()
  const [trip, setTrip] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const res = await fetch(`/api/bookings/${params.id}`)
        if (!res.ok) {
          throw new Error('Không thể tải thông tin chuyến đi')
        }

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

  const handleBack = () => {
    router.back()
  }

  const handleSuccess = () => {
    router.replace(`/trips/${params.id}`)
  }

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Đang tải thông tin đánh giá...</p>
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
          <div className="w-full max-w-md space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{error || 'Không tìm thấy chuyến đi'}</AlertDescription>
            </Alert>
            <Button onClick={() => router.replace('/trips')}>Quay lại danh sách chuyến đi</Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!trip.canReview) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md space-y-4 text-center">
            <Card>
              <CardContent className="p-6 space-y-3">
                <h2 className="text-lg font-semibold">Bạn không thể đánh giá chuyến đi này</h2>
                <p className="text-sm text-muted-foreground">
                  {trip.hasReview
                    ? 'Bạn đã gửi đánh giá cho chuyến đi này.'
                    : 'Chỉ có thể đánh giá sau khi hoàn thành chuyến đi với tài khoản đã đặt.'}
                </p>
                <Button onClick={() => router.replace(`/trips/${params.id}`)}>Xem chi tiết chuyến đi</Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-10 max-w-3xl space-y-6">
          <Button variant="ghost" className="w-fit" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
          </Button>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-foreground">Đánh giá trải nghiệm</h1>
            <p className="text-sm text-muted-foreground">
              Chia sẻ cảm nhận của bạn về kỳ nghỉ tại {trip.listing?.title || 'chỗ ở này'}.
            </p>
          </div>

          <ReviewForm
            bookingId={trip.id}
            reviewType="GUEST_TO_LISTING"
            targetId={trip.listing?.id || trip.hostId}
            targetName={trip.listing?.title || 'chuyến đi này'}
            onSuccess={handleSuccess}
          />
        </div>
      </main>
      <Footer />
    </div>
  )
}
