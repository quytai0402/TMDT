import { TrendingUp, Calendar, DollarSign, Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface DashboardStatsProps {
  stats?: {
    totalRevenue: number
    monthlyBookings: number
    pendingBookings: number
    totalBookings: number
    averageRating?: number
    occupancyRate?: number
  }
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  const statsData = [
    {
      icon: DollarSign,
      label: "Doanh thu tháng này",
      value: stats ? formatCurrency(stats.totalRevenue) : "0₫",
      change: "+12.5%",
      trend: "up",
    },
    {
      icon: Calendar,
      label: "Booking tháng này",
      value: stats ? stats.monthlyBookings.toString() : "0",
      change: "+8.3%",
      trend: "up",
    },
    {
      icon: Star,
      label: "Đánh giá trung bình",
      value: stats?.averageRating ? stats.averageRating.toFixed(1) : "0.0",
      change: "+0.2",
      trend: "up",
    },
    {
      icon: TrendingUp,
      label: "Tỷ lệ lấp đầy",
      value: stats?.occupancyRate ? `${stats.occupancyRate}%` : "0%",
      change: "+5.1%",
      trend: "up",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsData.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <span className={`text-sm font-medium ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                  {stat.change}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
