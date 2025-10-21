import type { ComponentType } from "react"
import { ShieldCheck, Wifi, Droplets, Wind, UtensilsCrossed, Coffee, MonitorCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ListingVerifiedAmenitiesProps {
  verified: Array<{
    name: string
    status: "verified" | "requested"
    detail: string
  }>
}

const iconByAmenity: Record<string, ComponentType<{ className?: string }>> = {
	"Wi-Fi tốc độ cao": Wifi,
	"Nước nóng 24/7": Droplets,
	"Điều hòa từng phòng": Wind,
	"Bếp đủ dụng cụ": UtensilsCrossed,
	"Máy pha cà phê": Coffee,
	"Màn hình 55 inch": MonitorCheck,
}

export function ListingVerifiedAmenities({ verified }: ListingVerifiedAmenitiesProps) {
  return (
    <div className="space-y-6 border-b border-border pb-8">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-xl font-semibold text-foreground">Tiện nghi đã được LuxeStay xác thực</h3>
          <p className="text-sm text-muted-foreground">
            Đội ngũ onsite kiểm tra định kỳ, đảm bảo các tiện nghi quan trọng hoạt động đúng cam kết.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {verified.map((item) => {
          const Icon = iconByAmenity[item.name] ?? ShieldCheck
          return (
            <div
              key={item.name}
              className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white/80 p-5 shadow-[0_18px_48px_-36px_rgba(15,23,42,0.75)]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="h-6 w-6" />
              </span>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-base font-semibold text-foreground">{item.name}</p>
                  <Badge
                    variant={item.status === "verified" ? "default" : "secondary"}
                    className={
                      item.status === "verified"
                        ? "bg-emerald-500 text-white hover:bg-emerald-500"
                        : "border-primary/30 bg-primary/5 text-primary"
                    }
                  >
                    {item.status === "verified" ? "Đã xác thực" : "Đang xác thực"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.detail}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
