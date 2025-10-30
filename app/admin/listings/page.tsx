'use client'

import { AdminLayout } from '@/components/admin-layout'
import { ListingModeration } from '@/components/admin-listing-moderation'

export default function AdminListingsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Quản lý chỗ nghỉ</h1>
          <p className="text-muted-foreground mt-2">
            Duyệt bài đăng mới, cập nhật trạng thái và theo dõi hiệu suất từng listing
          </p>
        </div>
        <ListingModeration />
      </div>
    </AdminLayout>
  )
}
