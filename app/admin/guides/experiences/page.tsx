'use client'

import { AdminLayout } from '@/components/admin-layout'
import { AdminGuideExperienceModeration } from '@/components/admin-guide-experience-moderation'

export default function AdminGuideExperiencesModerationPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Trải nghiệm hướng dẫn viên</h1>
          <p className="text-muted-foreground">
            Duyệt và quản lý trải nghiệm do hướng dẫn viên gửi lên trước khi hiển thị cho khách hàng
          </p>
        </div>
        <AdminGuideExperienceModeration />
      </div>
    </AdminLayout>
  )
}
