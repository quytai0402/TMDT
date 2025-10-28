import { ShieldCheck, BadgeCheck, Wifi, Lock, Sparkles } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ListingTrustPanelProps {
  hostName: string
  hostVerified?: boolean
  isSuperHost?: boolean
  verifiedAmenities?: string[]
  hasSmartLock?: boolean
  wifiName?: string | null
  wifiPassword?: string | null
}

export function ListingTrustPanel({
  hostName,
  hostVerified,
  isSuperHost,
  verifiedAmenities = [],
  hasSmartLock,
  wifiName,
  wifiPassword,
}: ListingTrustPanelProps) {
  const amenities = verifiedAmenities.slice(0, 4)
  return (
    <Card className="rounded-3xl border border-emerald-200 bg-emerald-50/60 shadow-[0_24px_80px_-70px_rgba(16,185,129,0.7)]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg text-emerald-700">
          <ShieldCheck className="h-5 w-5" /> Độ tin cậy đã xác thực
        </CardTitle>
        <p className="text-xs text-emerald-600">
          LuxeStay kiểm duyệt chủ nhà và tiện nghi trước khi hiển thị. Bạn có thể yên tâm đặt chỗ.
        </p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-700">
        <div className="flex items-start gap-3 rounded-2xl bg-white/80 px-3 py-2">
          <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <BadgeCheck className="h-4 w-4" />
          </span>
          <div>
            <p className="font-semibold text-slate-900">Chủ nhà {hostName}</p>
            <p className="text-xs text-slate-500">
              {hostVerified ? "Đã xác thực danh tính" : "Đang chờ xác thực"}
              {isSuperHost ? " • SuperHost 4.9★" : ""}
            </p>
          </div>
        </div>

        {amenities.length > 0 && (
          <div className="rounded-2xl bg-white/80 px-3 py-2">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Sparkles className="h-4 w-4 text-emerald-600" /> Tiện nghi đã kiểm định
            </p>
            <div className="flex flex-wrap gap-2">
              {amenities.map((amenity) => (
                <Badge key={amenity} variant="outline" className="border-emerald-200 bg-emerald-100 text-emerald-700">
                  {amenity}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-2 md:grid-cols-2">
          <div className="rounded-2xl bg-white/80 px-3 py-2">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Lock className="h-4 w-4 text-emerald-600" /> Khóa thông minh
            </p>
            <p className="text-xs text-slate-500">
              {hasSmartLock ? "Mã mở cửa sẽ gửi qua ứng dụng trước giờ check-in." : "Host sẽ bàn giao chìa khóa trực tiếp."}
            </p>
          </div>
          <div className="rounded-2xl bg-white/80 px-3 py-2">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Wifi className="h-4 w-4 text-emerald-600" /> Wifi kiểm tra tốc độ
            </p>
            <p className="text-xs text-slate-500">
              Tên: {wifiName || "Sẽ cung cấp sau"}
              {wifiPassword ? ` • Mật khẩu: ${wifiPassword}` : ""}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
