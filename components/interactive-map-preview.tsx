"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Compass, Navigation } from "lucide-react"

export function InteractiveMapPreview() {
  const router = useRouter()

  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-gradient-to-r from-sky-100 via-white to-emerald-100" aria-hidden="true" />
      <div className="relative container mx-auto px-4 lg:px-8">
        <div className="grid gap-12 rounded-3xl border border-slate-100 bg-white/90 p-10 shadow-[0_40px_120px_-80px_rgba(15,23,42,0.9)] backdrop-blur lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-semibold text-primary">
              <Navigation className="h-4 w-4" />
              Bản đồ tương tác
            </div>
            <h2 className="font-serif text-4xl font-bold text-slate-900 md:text-5xl">
              Xem giá theo khu vực và tiện ích xung quanh trên cùng một bản đồ
            </h2>
            <p className="text-lg text-slate-600">
              Thu phóng, khoanh vùng và lưu khu vực yêu thích. LuxeStay cập nhật giá real-time, hiển thị tiện nghi quan trọng, quán ăn,
              địa điểm vui chơi chỉ trong một lần chạm.
            </p>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Lớp dữ liệu tiện ích: nhà hàng, quán cà phê, điểm du lịch
              </li>
              <li className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Hiển thị giá trung bình theo từng khu vực ngay trên bản đồ
              </li>
              <li className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Đồng bộ với danh sách để so sánh nhanh chóng
              </li>
            </ul>
            <Badge variant="secondary" className="w-fit text-[11px] uppercase tracking-wide">
              Miễn phí cho mọi tài khoản
            </Badge>
            <Button
              className="rounded-xl bg-primary px-7 py-6 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
              onClick={() => router.push("/map?ref=homepage")}
            >
              Mở bản đồ tương tác
            </Button>
          </div>

          <div className="relative h-[400px] overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),transparent)]" />
            <div className="absolute left-6 right-6 top-6 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">Vũng Tàu</span>
                <span className="text-sky-100">3.200.000₫ / đêm</span>
              </div>
              <p className="mt-3 text-xs text-slate-200">Homestay biển • 4 phòng ngủ • Hồ bơi riêng</p>
            </div>
            <div className="absolute bottom-6 left-6 right-6 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">Đà Lạt</span>
                <span className="text-emerald-100">2.100.000₫ / đêm</span>
              </div>
              <p className="text-xs text-slate-200">Homestay rừng thông • Baby grand piano • Bữa sáng</p>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Compass className="h-4 w-4" />
                <span>Chỉ đường & lưu hành trình</span>
              </div>
            </div>
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(#0f172a33 1px, transparent 1px), linear-gradient(90deg, #0f172a33 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          </div>
        </div>
      </div>
    </section>
  )
}
