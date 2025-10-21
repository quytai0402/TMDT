"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BookingSummary } from "@/components/booking-summary"
import { GuestInfoForm } from "@/components/guest-info-form"
import { PaymentMethods } from "@/components/payment-methods"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Lock, Shield, CheckCircle2, Loader2 } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptCancellation, setAcceptCancellation] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [guestInfo, setGuestInfo] = useState<any>(null)
  const [paymentMethod, setPaymentMethod] = useState("credit-card")
  const [bookingData, setBookingData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBookingData = async () => {
      const bookingId = searchParams.get('bookingId')
      
      if (!bookingId) {
        setError("Thiếu thông tin đặt phòng")
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`/api/bookings/${bookingId}`)
        if (!res.ok) throw new Error('Không thể tải thông tin đặt phòng')
        
        const data = await res.json()
        setBookingData(data)
      } catch (err: any) {
        setError(err.message || 'Đã xảy ra lỗi')
      } finally {
        setLoading(false)
      }
    }

    fetchBookingData()
  }, [searchParams])

  const handleConfirmBooking = async () => {
    if (!acceptTerms || !acceptCancellation) {
      alert("Vui lòng đồng ý với điều khoản và chính sách hủy")
      return
    }

    if (!guestInfo?.fullName || !guestInfo?.phone || !guestInfo?.email) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc")
      return
    }

    setIsProcessing(true)

    try {
      // Update booking with payment info
      const res = await fetch(`/api/bookings/${bookingData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'CONFIRMED',
          guestInfo,
          paymentMethod,
        })
      })

      if (!res.ok) throw new Error('Không thể xác nhận đặt phòng')

      // Redirect to success page
      router.push(`/booking/success?id=${bookingData.id}`)
    } catch (err: any) {
      alert(err.message || 'Đã xảy ra lỗi')
    } finally {
      setIsProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Đang tải thông tin đặt phòng...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !bookingData) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Alert variant="destructive" className="max-w-md">
            <AlertDescription>
              {error || "Không tìm thấy thông tin đặt phòng"}
            </AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          {/* Back Button */}
          <Link href={`/listing/${bookingData.listing.id}`}>
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold mb-2">Xác nhận và thanh toán</h1>
            <p className="text-muted-foreground">
              Hoàn tất thông tin để đặt phòng của bạn
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Forms */}
            <div className="lg:col-span-2 space-y-6">
              {/* Guest Information */}
              <GuestInfoForm onInfoChange={setGuestInfo} />

              {/* Payment Methods */}
              <PaymentMethods 
                bookingId={bookingData.id}
                amount={bookingData.totalPrice}
              />

              {/* Terms & Conditions */}
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Điều khoản và chính sách</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox 
                      id="terms" 
                      checked={acceptTerms}
                      onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                    />
                    <label
                      htmlFor="terms"
                      className="text-sm leading-relaxed cursor-pointer"
                    >
                      Tôi đồng ý với{" "}
                      <Link href="/terms" className="text-primary underline">
                        Điều khoản sử dụng
                      </Link>{" "}
                      và{" "}
                      <Link href="/privacy" className="text-primary underline">
                        Chính sách bảo mật
                      </Link>{" "}
                      của Homestay Booking
                    </label>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Checkbox 
                      id="cancellation" 
                      checked={acceptCancellation}
                      onCheckedChange={(checked) => setAcceptCancellation(checked as boolean)}
                    />
                    <label
                      htmlFor="cancellation"
                      className="text-sm leading-relaxed cursor-pointer"
                    >
                      Tôi đã đọc và hiểu{" "}
                      <Link href="/cancellation-policy" className="text-primary underline">
                        Chính sách hủy phòng
                      </Link>. 
                      Hủy miễn phí trước 48 giờ, sau đó hoàn 50% nếu hủy trước 24 giờ.
                    </label>
                  </div>
                </div>
              </Card>

              {/* Confirm Button */}
              <Button 
                size="lg" 
                className="w-full text-lg py-6"
                onClick={handleConfirmBooking}
                disabled={isProcessing || !acceptTerms || !acceptCancellation}
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5 mr-2" />
                    Xác nhận và thanh toán
                  </>
                )}
              </Button>

              {/* Security Notice */}
              <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200">
                <Shield className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-sm text-green-700 dark:text-green-300">
                  <div className="space-y-1">
                    <p className="font-medium">Thanh toán an toàn với Homestay Booking</p>
                    <ul className="text-xs space-y-0.5 ml-4 list-disc">
                      <li>Mã hóa SSL 256-bit</li>
                      <li>Tuân thủ chuẩn PCI DSS</li>
                      <li>Không lưu trữ thông tin thẻ</li>
                      <li>Hoàn tiền nếu có sự cố</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            </div>

            {/* Right Column - Booking Summary */}
            <div className="lg:col-span-1">
              <BookingSummary
                listing={{
                  id: bookingData.listing.id,
                  title: bookingData.listing.title,
                  location: `${bookingData.listing.city}, ${bookingData.listing.state}`,
                  price: bookingData.basePrice / bookingData.nights,
                  image: bookingData.listing.images[0] || '',
                  rating: bookingData.listing.averageRating,
                  reviews: bookingData.listing.totalReviews,
                  host: {
                    name: bookingData.listing.host.name,
                    avatar: bookingData.listing.host.image,
                  }
                }}
                checkIn={new Date(bookingData.checkIn).toISOString().split('T')[0]}
                checkOut={new Date(bookingData.checkOut).toISOString().split('T')[0]}
                guests={bookingData.adults + (bookingData.children || 0)}
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
