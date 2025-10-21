'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { XCircle, Home, RefreshCcw } from 'lucide-react'
import Link from 'next/link'

export default function PaymentFailurePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const error = searchParams.get('error') || 'Thanh toán không thành công'
  const bookingId = searchParams.get('bookingId')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-4">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Thanh toán thất bại
            </h1>
            <p className="text-muted-foreground">
              {error}
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              Đơn đặt phòng của bạn vẫn được giữ trong 15 phút. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            {bookingId && (
              <Button asChild className="w-full" size="lg">
                <Link href={`/booking/${bookingId}`}>
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Thử lại
                </Link>
              </Button>
            )}
            
            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Về trang chủ
              </Link>
            </Button>
          </div>

          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-2">Cần trợ giúp?</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Nếu bạn gặp vấn đề, vui lòng liên hệ với chúng tôi
            </p>
            <Button asChild variant="link" size="sm">
              <Link href="/support">Liên hệ hỗ trợ</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
