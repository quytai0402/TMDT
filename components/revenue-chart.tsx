"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface RevenuePoint {
  label: string
  revenue: number
}

interface RevenueChartProps {
  data: RevenuePoint[]
  loading?: boolean
}

export function RevenueChart({ data, loading = false }: RevenueChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Doanh thu 6 tháng gần đây</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-60 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Doanh thu 6 tháng gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Chưa có dữ liệu doanh thu. Khi bookings được xác nhận, biểu đồ sẽ cập nhật tự động.
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map((point) => ({ month: point.label, revenue: point.revenue }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Doanh thu 6 tháng gần đây</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => `${Number(value).toLocaleString("vi-VN")}`} />
            <Tooltip
              formatter={(value: number) => `${value.toLocaleString("vi-VN")}₫`}
              contentStyle={{ backgroundColor: "white", border: "1px solid #e5e5e5" }}
            />
            <Bar dataKey="revenue" fill="#2d5f5d" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
