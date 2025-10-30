'use client'

import { AdminLayout } from '@/components/admin-layout'
import { AdminBookingsDashboard } from '@/components/admin-bookings-dashboard'

export default function AdminBookingsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Quản lý đặt phòng</h1>
          <p className="text-muted-foreground mt-2">
            Theo dõi tất cả đơn đặt phòng, trạng thái thanh toán và lịch sử khách
          </p>
        </div>
        <AdminBookingsDashboard />
      </div>
    </AdminLayout>
  )
}
