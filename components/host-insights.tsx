import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"

export type HostInsightTrend = "up" | "down" | "neutral"

export interface HostInsight {
  id: string
  title: string
  value: string
  helperText?: string
  trend?: HostInsightTrend
  trendLabel?: string
}

interface HostInsightsProps {
  insights: HostInsight[]
}

export function HostInsights({ insights }: HostInsightsProps) {
  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Insight hoạt động</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Khi dữ liệu bookings, pricing và reviews sẵn sàng, các insight sẽ hiển thị tại đây.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {insights.map((insight) => {
        const TrendIcon = insight.trend === "down" ? ArrowDownRight : ArrowUpRight
        const trendClasses =
          insight.trend === "down"
            ? "text-red-600"
            : insight.trend === "up"
              ? "text-emerald-600"
              : "text-muted-foreground"

        return (
          <Card key={insight.id} className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{insight.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-semibold text-foreground">{insight.value}</div>
              {insight.trendLabel ? (
                <div className={`flex items-center gap-1 text-xs font-medium ${trendClasses}`}>
                  {insight.trend === "neutral" ? null : <TrendIcon className="h-4 w-4" />}
                  <span>{insight.trendLabel}</span>
                </div>
              ) : null}
              {insight.helperText ? (
                <p className="text-xs text-muted-foreground">{insight.helperText}</p>
              ) : null}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
