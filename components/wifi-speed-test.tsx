"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Wifi, Download, Upload, Activity, CheckCircle2, AlertCircle, Clock } from "lucide-react"
import { useState } from "react"

interface WiFiSpeedTestProps {
  lastTested?: string
  downloadSpeed?: number
  uploadSpeed?: number
  ping?: number
  reliability?: number
}

export function WiFiSpeedTest({
  lastTested = "5 ngày trước",
  downloadSpeed = 287,
  uploadSpeed = 145,
  ping = 12,
  reliability = 98
}: WiFiSpeedTestProps) {
  const [isTesting, setIsTesting] = useState(false)

  const handleTest = () => {
    setIsTesting(true)
    setTimeout(() => setIsTesting(false), 3000)
  }

  const getSpeedQuality = (speed: number, type: "download" | "upload") => {
    const threshold = type === "download" ? 100 : 50
    if (speed >= threshold * 2) return { label: "Xuất sắc", color: "text-green-600" }
    if (speed >= threshold) return { label: "Tốt", color: "text-blue-600" }
    if (speed >= threshold / 2) return { label: "Khá", color: "text-yellow-600" }
    return { label: "Chậm", color: "text-red-600" }
  }

  const downloadQuality = getSpeedQuality(downloadSpeed, "download")
  const uploadQuality = getSpeedQuality(uploadSpeed, "upload")

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <Wifi className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Tốc độ Internet</h3>
            <p className="text-sm text-muted-foreground">
              Đã kiểm tra {lastTested}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Đã xác thực
        </Badge>
      </div>

      {/* Speed Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Download Speed */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Download className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Tải xuống</span>
            </div>
            <span className={`font-semibold ${downloadQuality.color}`}>
              {downloadQuality.label}
            </span>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-3xl font-bold">{downloadSpeed}</span>
            <span className="text-sm text-muted-foreground">Mbps</span>
          </div>
          <Progress value={Math.min((downloadSpeed / 300) * 100, 100)} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Phù hợp: Video 4K, Gaming, Video calls
          </p>
        </div>

        {/* Upload Speed */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Upload className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Tải lên</span>
            </div>
            <span className={`font-semibold ${uploadQuality.color}`}>
              {uploadQuality.label}
            </span>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-3xl font-bold">{uploadSpeed}</span>
            <span className="text-sm text-muted-foreground">Mbps</span>
          </div>
          <Progress value={Math.min((uploadSpeed / 150) * 100, 100)} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Phù hợp: Video calls, Cloud backup
          </p>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center space-x-3">
          <Activity className="w-5 h-5 text-purple-600" />
          <div>
            <p className="text-xs text-muted-foreground">Độ trễ (Ping)</p>
            <p className="font-semibold">{ping}ms</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Clock className="w-5 h-5 text-orange-600" />
          <div>
            <p className="text-xs text-muted-foreground">Độ ổn định</p>
            <p className="font-semibold">{reliability}%</p>
          </div>
        </div>
      </div>

      {/* Network Details */}
      <div className="space-y-3 mb-6">
        <h4 className="font-medium text-sm">Chi tiết kết nối</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <span className="text-muted-foreground">Loại kết nối</span>
            <span className="font-medium">Cáp quang (Fiber)</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <span className="text-muted-foreground">Băng thông</span>
            <span className="font-medium">300 Mbps</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <span className="text-muted-foreground">Nhà cung cấp</span>
            <span className="font-medium">Viettel</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground">WiFi 6 hỗ trợ</span>
            <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200">
              Có
            </Badge>
          </div>
        </div>
      </div>

      {/* Test Button */}
      <Button 
        className="w-full" 
        variant="outline"
        onClick={handleTest}
        disabled={isTesting}
      >
        {isTesting ? (
          <>
            <Activity className="w-4 h-4 mr-2 animate-spin" />
            Đang kiểm tra...
          </>
        ) : (
          <>
            <Wifi className="w-4 h-4 mr-2" />
            Kiểm tra tốc độ lại
          </>
        )}
      </Button>

      {/* Info Note */}
      <div className="mt-4 flex items-start space-x-2 text-xs text-muted-foreground">
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <p>
          Tốc độ thực tế có thể thay đổi tùy theo số lượng thiết bị đang kết nối và thời gian trong ngày.
        </p>
      </div>
    </Card>
  )
}
