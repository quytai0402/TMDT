import { TrendingUp, Calendar, DollarSign, Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

type TrendDirection = "up" | "down" | "neutral"

interface DashboardStatsProps {
  stats?: {
    totalRevenue?: number
    totalRevenueChange?: number
    monthlyBookings?: number
    monthlyBookingsChange?: number
    averageRating?: number
    averageRatingChange?: number
    occupancyRate?: number
    occupancyRateChange?: number
  }
  loading?: boolean
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount)

const formatPercentChange = (value?: number) => {
  if (typeof value !== "number" || Number.isNaN(value)) return undefined
  const formatted = `${value > 0 ? "+" : ""}${value.toFixed(1)}%`
  if (value === 0) return { label: formatted, direction: "neutral" as TrendDirection }
  return { label: formatted, direction: value > 0 ? "up" : "down" }
}

export function DashboardStats({ stats, loading = false }: DashboardStatsProps) {
  const metrics = [
    {
      icon: DollarSign,
      label: "Doanh thu tháng này",
      value: typeof stats?.totalRevenue === "number" ? formatCurrency(stats.totalRevenue) : "—",
      trend: formatPercentChange(stats?.totalRevenueChange),
    },
    {
      icon: Calendar,
      label: "Booking tháng này",
      value:
        typeof stats?.monthlyBookings === "number" && !Number.isNaN(stats.monthlyBookings)
          ? stats.monthlyBookings.toString()
          : "—",
      trend: formatPercentChange(stats?.monthlyBookingsChange),
    },
    {
      icon: Star,
      label: "Đánh giá trung bình",
      value:
        typeof stats?.averageRating === "number" && !Number.isNaN(stats.averageRating)
          ? stats.averageRating.toFixed(1)
          : "—",
      trend: formatPercentChange(stats?.averageRatingChange),
    },
    {
      icon: TrendingUp,
      label: "Tỷ lệ lấp đầy",
      value:
        typeof stats?.occupancyRate === "number" && !Number.isNaN(stats.occupancyRate)
          ? `${stats.occupancyRate.toFixed(0)}%`
          : "—",
      trend: formatPercentChange(stats?.occupancyRateChange),
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((_, index) => (
          <Card key={index}>
            <CardContent className="space-y-4 p-6">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-7 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon
        const trendDirection = metric.trend?.direction ?? "neutral"
        const trendClass =
          trendDirection === "up"
            ? "text-emerald-600"
            : trendDirection === "down"
              ? "text-red-600"
              : "text-muted-foreground"

        return (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                {metric.trend?.label ? (
                  <span className={`text-sm font-medium ${trendClass}`}>{metric.trend.label}</span>
                ) : null}
              </div>
              <p className="mb-1 text-sm text-muted-foreground">{metric.label}</p>
              <p className="text-2xl font-bold text-foreground">{metric.value}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
