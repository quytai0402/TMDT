"use client"

import { GuideDashboardLayout } from "@/components/guide-dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export default function GuideSettingsPage() {
  const [notifications, setNotifications] = useState(true)
  const [autoAccept, setAutoAccept] = useState(false)

  return (
    <GuideDashboardLayout>
      <div className="mx-auto max-w-3xl space-y-8">
        <section className="space-y-2">
          <h1 className="font-serif text-3xl font-bold">Cài đặt hướng dẫn viên</h1>
          <p className="text-sm text-muted-foreground">
            Tuỳ chỉnh trải nghiệm vận hành và cách LuxeStay gửi thông báo cho bạn.
          </p>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Thông báo & liên hệ</CardTitle>
            <CardDescription>Kiểm soát các kênh LuxeStay sẽ cập nhật cho bạn</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-semibold text-foreground">Thông báo real-time</p>
                <p className="text-xs">Nhận thông báo ngay khi có booking mới, đánh giá hoặc tin nhắn từ khách.</p>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-semibold text-foreground">Tự động giữ chỗ</p>
                <p className="text-xs">Tự động chuyển booking sang trạng thái chờ thanh toán khi khách đặt.</p>
              </div>
              <Switch checked={autoAccept} onCheckedChange={setAutoAccept} />
            </div>
            <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-xs">
              Các cài đặt nâng cao (payout, đồng bộ lịch, API) đang được LuxeStay hoàn thiện. Liên hệ concierge để được hỗ trợ ngay.
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button disabled>Lưu thay đổi (sắp ra mắt)</Button>
        </div>
      </div>
    </GuideDashboardLayout>
  )
}
