import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { QuestsPanel } from "@/components/quests-panel"
import { Suspense } from "react"

export default function QuestsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1">
        <section className="bg-gradient-to-br from-primary/5 via-white to-primary/10 py-12">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary">Loyalty questboard</p>
              <h1 className="mt-2 font-serif text-4xl font-bold text-slate-900">Hoàn thành nhiệm vụ, đổi quà nhanh hơn</h1>
              <p className="mt-4 text-base text-slate-600">
                Mỗi hành động trên LuxeStay đều được ghi nhận: giữ streak nhận quà, review trải nghiệm,
                hay giới thiệu bạn bè để mở khóa điểm thưởng, voucher dịch vụ và nâng hạng loyalty.
              </p>
            </div>
          </div>
        </section>

        <section className="-mt-10 pb-16">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-primary/5">
              <Suspense fallback={<div className="py-12 text-center text-sm text-muted-foreground">Đang tải nhiệm vụ...</div>}>
                <QuestsPanel />
              </Suspense>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
