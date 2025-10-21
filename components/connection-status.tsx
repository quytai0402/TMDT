"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, WifiOff, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ConnectionStatusProps {
  showOfflineAlert?: boolean
}

export function ConnectionStatus({ showOfflineAlert = true }: ConnectionStatusProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [showAlert, setShowAlert] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowAlert(false)
    }

    const handleOffline = () => {
      setIsOnline(false)
      if (showOfflineAlert) {
        setShowAlert(true)
      }
    }

    // Check initial status
    setIsOnline(navigator.onLine)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [showOfflineAlert])

  if (!showAlert || isOnline) {
    return null
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4">
      <Alert variant="destructive" className="shadow-lg">
        <WifiOff className="h-4 w-4" />
        <AlertTitle className="flex items-center justify-between">
          Mất kết nối
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 hover:bg-transparent"
            onClick={() => setShowAlert(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </AlertTitle>
        <AlertDescription>
          Không có kết nối internet. Vui lòng kiểm tra mạng của bạn.
        </AlertDescription>
      </Alert>
    </div>
  )
}

export function DatabaseConnectionWarning({ show = false, onDismiss }: { show?: boolean; onDismiss?: () => void }) {
  if (!show) return null

  return (
    <div className="mb-4">
      <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-900 dark:text-amber-100 flex items-center justify-between">
          Kết nối không ổn định
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 hover:bg-transparent"
              onClick={onDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </AlertTitle>
        <AlertDescription className="text-amber-800 dark:text-amber-200">
          Đang gặp sự cố kết nối với máy chủ. Một số tính năng có thể bị hạn chế.
        </AlertDescription>
      </Alert>
    </div>
  )
}
