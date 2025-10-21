"use client"

import { AlertCircle, RefreshCw, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface DatabaseErrorFallbackProps {
  onRetry?: () => void
  message?: string
  showRetry?: boolean
}

export function DatabaseErrorFallback({
  onRetry,
  message = "Không thể kết nối với máy chủ",
  showRetry = true
}: DatabaseErrorFallbackProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <div className="max-w-md w-full space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-4">
            <WifiOff className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>
        
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">Lỗi kết nối</h3>
          <p className="text-sm text-muted-foreground">
            {message}. Vui lòng kiểm tra kết nối mạng và thử lại.
          </p>
        </div>

        {showRetry && onRetry && (
          <div className="flex justify-center">
            <Button onClick={onRetry} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Thử lại
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export function DatabaseErrorAlert({
  onRetry,
  message = "Không thể tải dữ liệu"
}: DatabaseErrorFallbackProps) {
  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Lỗi kết nối</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{message}. Vui lòng thử lại sau.</span>
        {onRetry && (
          <Button onClick={onRetry} variant="ghost" size="sm" className="gap-1 ml-4">
            <RefreshCw className="h-3 w-3" />
            Thử lại
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

export function EmptyState({
  icon: Icon = Wifi,
  title = "Không có dữ liệu",
  description = "Hiện tại chưa có dữ liệu để hiển thị",
  action
}: {
  icon?: any
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}) {
  return (
    <div className="flex items-center justify-center min-h-[300px] p-6">
      <div className="max-w-md w-full space-y-4 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-4">
            <Icon className="h-10 w-10 text-muted-foreground" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        {action && (
          <div className="flex justify-center pt-2">
            <Button onClick={action.onClick} variant="outline">
              {action.label}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
