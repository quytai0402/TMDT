"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { CheckCircle, Circle, Loader2 } from "lucide-react"

export type HostChecklistStatus = "completed" | "in_progress" | "pending"

export interface HostChecklistItem {
  id: string
  title: string
  description: string
  status: HostChecklistStatus
  actionHref?: string
  actionLabel?: string
}

interface HostOnboardingChecklistProps {
  items: HostChecklistItem[]
  loading?: boolean
  className?: string
}

export function HostOnboardingChecklist({ items, loading = false, className }: HostOnboardingChecklistProps) {
  const total = items.length
  const completed = items.filter((item) => item.status === "completed").length
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Checklist onboarding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-2 w-32" />
          <Skeleton className="h-8 w-full" />
          {[...Array(3)].map((_, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-9 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="space-y-3">
        <CardTitle className="flex items-center justify-between">
          <span>Checklist onboarding</span>
          <Badge variant="outline" className="text-xs">
            {completed}/{total} hoàn thành
          </Badge>
        </CardTitle>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Tiến độ</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {total === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Chưa có nhiệm vụ onboarding. Khi các API hoàn thiện, checklist sẽ tự động cập nhật dựa trên trạng thái thật.
          </div>
        ) : (
          items.map((item) => {
            const isCompleted = item.status === "completed"
            const isInProgress = item.status === "in_progress"

            return (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-lg border px-4 py-3 transition-colors hover:border-primary/60 md:flex-row md:items-center"
              >
                <div className="flex flex-1 items-start gap-3">
                  <span className="mt-0.5">
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                    ) : isInProgress ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </span>
                  <div>
                    <div className="font-medium text-sm md:text-base">{item.title}</div>
                    <p className="text-xs text-muted-foreground md:text-sm">{item.description}</p>
                  </div>
                </div>
                {item.actionHref ? (
                  <Button asChild size="sm" variant={isCompleted ? "ghost" : "default"}>
                    <Link href={item.actionHref}>{item.actionLabel ?? (isCompleted ? "Xem" : "Thực hiện")}</Link>
                  </Button>
                ) : null}
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
