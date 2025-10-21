"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const data = [
  { month: "T1", revenue: 25000000 },
  { month: "T2", revenue: 32000000 },
  { month: "T3", revenue: 28000000 },
  { month: "T4", revenue: 35000000 },
  { month: "T5", revenue: 42000000 },
  { month: "T6", revenue: 45000000 },
]

export function RevenueChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Doanh thu 6 tháng gần đây</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
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
