"use client"

import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, Calendar, Users, Eye, Star, Target } from "lucide-react"

interface Stat {
  label: string
  value: string
  change: number
  trend: "up" | "down"
  icon: any
  color: string
}

export function AnalyticsOverview() {
  const stats: Stat[] = [
    {
      label: "Tổng doanh thu",
      value: "₫84,500,000",
      change: 12.5,
      trend: "up",
      icon: DollarSign,
      color: "text-green-600"
    },
    {
      label: "Đặt phòng tháng này",
      value: "28",
      change: 8.3,
      trend: "up",
      icon: Calendar,
      color: "text-blue-600"
    },
    {
      label: "Tỷ lệ lấp đầy",
      value: "85%",
      change: -3.2,
      trend: "down",
      icon: Target,
      color: "text-orange-600"
    },
    {
      label: "Khách mới",
      value: "156",
      change: 18.7,
      trend: "up",
      icon: Users,
      color: "text-purple-600"
    },
    {
      label: "Lượt xem",
      value: "1,247",
      change: 22.1,
      trend: "up",
      icon: Eye,
      color: "text-indigo-600"
    },
    {
      label: "Đánh giá trung bình",
      value: "4.8",
      change: 2.1,
      trend: "up",
      icon: Star,
      color: "text-yellow-600"
    },
    {
      label: "Giá trung bình/đêm",
      value: "₫1,850,000",
      change: 5.4,
      trend: "up",
      icon: DollarSign,
      color: "text-teal-600"
    },
    {
      label: "Tỷ lệ phản hồi",
      value: "98%",
      change: 1.2,
      trend: "up",
      icon: Target,
      color: "text-pink-600"
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        const TrendIcon = stat.trend === "up" ? TrendingUp : TrendingDown
        
        return (
          <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg bg-${stat.color.split('-')[1]}-100 flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className={`flex items-center space-x-1 text-sm ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                <TrendIcon className="w-4 h-4" />
                <span className="font-medium">{Math.abs(stat.change)}%</span>
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold mb-1">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
