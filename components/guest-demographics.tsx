"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Users, MapPin, Calendar, Briefcase, Heart } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

const ageData = [
  { name: "18-24", value: 15, color: "#8b5cf6" },
  { name: "25-34", value: 35, color: "#3b82f6" },
  { name: "35-44", value: 28, color: "#10b981" },
  { name: "45-54", value: 15, color: "#f59e0b" },
  { name: "55+", value: 7, color: "#ef4444" },
]

const locationData = [
  { city: "TP. Hồ Chí Minh", guests: 124, percentage: 42 },
  { city: "Hà Nội", guests: 89, percentage: 30 },
  { city: "Đà Nẵng", guests: 45, percentage: 15 },
  { city: "Nha Trang", guests: 23, percentage: 8 },
  { city: "Khác", guests: 15, percentage: 5 },
]

const tripPurposeData = [
  { purpose: "Nghỉ dưỡng", count: 156, icon: Heart, color: "text-pink-600" },
  { purpose: "Công tác", count: 78, icon: Briefcase, color: "text-blue-600" },
  { purpose: "Gia đình", count: 45, icon: Users, color: "text-green-600" },
  { purpose: "Du lịch", count: 98, icon: MapPin, color: "text-purple-600" },
]

export function GuestDemographics() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Age Distribution */}
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-6">Phân bố độ tuổi</h3>
        <div className="h-64 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={ageData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {ageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}%`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2">
          {ageData.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span>{item.name} tuổi</span>
              </div>
              <span className="font-medium">{item.value}%</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Location Distribution */}
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-6">Khách đến từ đâu</h3>
        <div className="space-y-4">
          {locationData.map((item, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{item.city}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-muted-foreground">{item.guests} khách</span>
                  <span className="font-bold text-primary">{item.percentage}%</span>
                </div>
              </div>
              <Progress value={item.percentage} className="h-2" />
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Tổng số khách</span>
            <span className="text-2xl font-bold text-primary">296</span>
          </div>
        </div>
      </Card>

      {/* Trip Purpose */}
      <Card className="p-6 lg:col-span-2">
        <h3 className="text-lg font-bold mb-6">Mục đích chuyến đi</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {tripPurposeData.map((item, idx) => {
            const Icon = item.icon
            const total = tripPurposeData.reduce((sum, i) => sum + i.count, 0)
            const percentage = Math.round((item.count / total) * 100)
            
            return (
              <div key={idx} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <Icon className={`w-6 h-6 ${item.color}`} />
                  <Badge variant="outline">{percentage}%</Badge>
                </div>
                <p className="text-2xl font-bold mb-1">{item.count}</p>
                <p className="text-sm text-muted-foreground">{item.purpose}</p>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Guest Stats */}
      <Card className="p-6 lg:col-span-2">
        <h3 className="text-lg font-bold mb-6">Thống kê khách hàng</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold mb-1">156</p>
            <p className="text-sm text-muted-foreground">Khách mới</p>
          </div>
          <div className="text-center">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold mb-1">140</p>
            <p className="text-sm text-muted-foreground">Khách quay lại</p>
          </div>
          <div className="text-center">
            <Heart className="w-8 h-8 mx-auto mb-2 text-pink-600" />
            <p className="text-2xl font-bold mb-1">3.2</p>
            <p className="text-sm text-muted-foreground">TB số người/đặt phòng</p>
          </div>
          <div className="text-center">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold mb-1">4.5</p>
            <p className="text-sm text-muted-foreground">TB số đêm/lần đặt</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
