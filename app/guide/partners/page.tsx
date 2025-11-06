"use client"

import { GuideDashboardLayout } from "@/components/guide-dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"

export default function GuidePartnersPage() {
  return (
    <GuideDashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="space-y-2">
          <h1 className="font-serif text-3xl font-bold">Đối tác & đội ngũ</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý host bảo trợ, cộng tác viên và đội ngũ hỗ trợ khách trong từng tour.
          </p>
        </section>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" /> Tính năng đang được hoàn thiện
            </CardTitle>
            <CardDescription>
              Chúng tôi sẽ sớm cập nhật bảng điều phối đội ngũ, phân quyền nhiệm vụ và nhật ký hoạt động.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Trong thời gian chờ, hãy liên hệ LuxeStay để được hỗ trợ thêm trong việc phân công nhân sự.</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Quản lý host bảo trợ</Badge>
              <Badge variant="secondary">Theo dõi hoa hồng</Badge>
              <Badge variant="secondary">Lịch làm việc đội ngũ</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </GuideDashboardLayout>
  )
}
