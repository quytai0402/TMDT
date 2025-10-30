'use client'

import { AdminLayout } from '@/components/admin-layout'
import { UserManagement } from '@/components/admin-user-management'

export default function AdminUsersPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Quản lý người dùng</h1>
          <p className="text-muted-foreground mt-2">
            Duyệt, phân quyền và theo dõi hoạt động của khách, host và quản trị viên
          </p>
        </div>
        <UserManagement />
      </div>
    </AdminLayout>
  )
}
