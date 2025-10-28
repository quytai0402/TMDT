import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { PersonaShowcase } from "@/components/persona-showcase"
import { PERSONA_LIST } from "@/lib/personas"
import { PersonaIcon } from "@/components/persona-icon"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default function PersonasIndexPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-white via-white to-slate-100">
      <Header />
      <main className="flex-1">
        <section className="bg-gradient-to-br from-primary/5 via-white to-slate-50 py-16">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-3xl space-y-4">
              <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
                Chủ đề đề xuất
              </Badge>
              <h1 className="font-serif text-4xl font-bold text-slate-900 md:text-5xl">
                Lựa chọn tuyến nội dung phù hợp với phong cách của bạn
              </h1>
              <p className="text-lg text-slate-600">
                Mỗi persona được thiết kế như một hành trình riêng: bộ lọc ưu tiên, review gợi ý và ưu đãi concierge được
                cá nhân hoá. Chọn chủ đề để xem ngay các homestay phù hợp nhất.
              </p>
            </div>
          </div>
        </section>

        <PersonaShowcase />

        <section className="bg-white py-16">
          <div className="container mx-auto px-4 lg:px-8 space-y-12">
            {PERSONA_LIST.map((persona) => {
              return (
                <div
                  key={persona.slug}
                  className="grid gap-8 rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 p-8 shadow-[0_20px_70px_-60px_rgba(15,23,42,0.45)] md:grid-cols-[0.45fr_1fr]"
                >
                  <div className="space-y-4">
                    <span className="flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                      <PersonaIcon name={persona.icon} className="h-7 w-7" />
                    </span>
                    <div>
                      <h2 className="text-2xl font-semibold text-slate-900">{persona.name}</h2>
                      <p className="text-sm font-medium text-primary/80">{persona.tagline}</p>
                    </div>
                    <p className="text-sm text-slate-600">{persona.description}</p>
                    <Link
                      href={`/personas/${persona.slug}`}
                      className="inline-flex items-center justify-center rounded-full border border-primary/40 bg-white px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white"
                    >
                      Khám phá {persona.name}
                    </Link>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {persona.highlights.map((highlight) => (
                      <div key={highlight} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-sm text-slate-700">{highlight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
