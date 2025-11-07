import { AdminLayout } from "@/components/admin-layout"
import { AdminGuideServicesDashboard } from "@/components/admin-guide-services-dashboard"

export default function AdminGuideServicesPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Dịch vụ HDV</h1>
          <p className="text-muted-foreground">
            Quản lý các booking trải nghiệm do khách đặt, xác nhận thanh toán và hỗ trợ hướng dẫn viên giống như quy trình host.
          </p>
        </div>
        <AdminGuideServicesDashboard />
      </div>
    </AdminLayout>
  )
}
