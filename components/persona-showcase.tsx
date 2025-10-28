import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { PERSONA_LIST } from "@/lib/personas"
import { PersonaIcon } from "@/components/persona-icon"
import { Badge } from "@/components/ui/badge"

interface PersonaShowcaseProps {
  heading?: string
  description?: string
  compact?: boolean
}

export function PersonaShowcase({
  heading = "Chủ đề chuyên sâu cho từng kiểu nghỉ dưỡng",
  description = "Chọn ngay một tuyến nội dung được cá nhân hoá: từ workation chuyên nghiệp đến wellness retreat chuẩn resort.",
  compact = false,
}: PersonaShowcaseProps) {
  return (
    <section className="bg-gradient-to-b from-slate-50 via-white to-slate-100 py-16 md:py-20">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl space-y-3">
            <Badge variant="outline" className="w-fit border-primary/30 bg-primary/5 text-primary">
              Cá nhân hoá
            </Badge>
            <h2 className="font-serif text-3xl font-bold text-slate-900 md:text-4xl">{heading}</h2>
            <p className="text-slate-600 text-base md:text-lg">{description}</p>
          </div>
          {!compact && (
            <Link
              href="/personas"
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-white px-4 py-2 text-sm font-semibold text-primary shadow-sm transition hover:bg-primary hover:text-white"
            >
              Xem tất cả chủ đề
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {PERSONA_LIST.map((persona) => (
            <Link
              key={persona.slug}
              href={`/personas/${persona.slug}`}
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_32px_80px_-60px_rgba(15,23,42,0.45)] transition hover:border-primary/40 hover:shadow-xl"
            >
              <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-primary/10 blur-2xl transition group-hover:bg-primary/20" />
              <div className="relative flex flex-col gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white">
                  <PersonaIcon name={persona.icon} className="h-6 w-6" />
                </span>
                <div className="space-y-1.5">
                  <h3 className="text-xl font-semibold text-slate-900">{persona.name}</h3>
                  <p className="text-sm font-medium text-primary/80">{persona.tagline}</p>
                  {!compact && <p className="text-sm text-slate-600 line-clamp-3">{persona.description}</p>}
                </div>
                <div className="space-y-2">
                  {persona.highlights.slice(0, compact ? 1 : 2).map((highlight) => (
                    <div key={highlight} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                      <p className="text-xs text-slate-600">{highlight}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-auto flex items-center gap-2 text-sm font-semibold text-primary">
                  Khám phá chủ đề
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
