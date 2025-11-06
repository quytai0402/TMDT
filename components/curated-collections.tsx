import Image from "next/image"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { ArrowRight, Lock, Sparkles } from "lucide-react"

import { authOptions } from "@/lib/auth"
import { evaluateCollectionAccess, getCuratedCollections } from "@/lib/curated-collections"
import { Badge } from "@/components/ui/badge"

export async function CuratedCollections() {
  const [session, collections] = await Promise.all([getServerSession(authOptions), getCuratedCollections()])

  if (!collections || collections.length === 0) {
    return null
  }

  const membershipStatus = session?.user?.membershipStatus ?? null
  const membershipPlanSlug = session?.user?.membershipPlan?.slug ?? null

  return (
    <section className="bg-gradient-to-b from-white via-sky-50/60 to-white py-20">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex flex-col gap-4 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-4 py-1 text-sm font-semibold text-primary shadow-sm">
            <Sparkles className="h-4 w-4" />
            Bộ sưu tập được tuyển chọn
          </div>
          <h2 className="font-serif text-4xl font-bold text-slate-900 md:text-5xl">Gợi ý cho hành trình tiếp theo</h2>
          <p className="mx-auto max-w-3xl text-lg text-slate-600">
            Đội ngũ LuxeStay tuyển chọn kỹ lưỡng để bạn tiết kiệm thời gian tìm kiếm và trải nghiệm đúng gu.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {collections.map((collection) => {
            const accessMeta = evaluateCollectionAccess(collection.tags ?? [], membershipStatus, membershipPlanSlug)
            const locked = accessMeta.locked
            const href = locked ? "/membership" : `/collections/${collection.id}`
            const actionLabel = locked ? "Nâng cấp membership" : "Khám phá ngay"
            const membersOnly = accessMeta.membersOnly

            return (
              <div
                key={collection.id}
                className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_24px_50px_-30px_rgba(15,23,42,0.4)] transition-all duration-500 hover:-translate-y-2"
              >
                <div className="relative h-64 overflow-hidden">
                  <Image
                    src={collection.image ?? "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80"}
                    alt={collection.title}
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    priority={collection.featured}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/65 via-slate-900/25 to-transparent" />
                  {membersOnly && (
                    <div className="absolute left-6 top-5 flex items-center gap-2">
                      <Badge variant="secondary" className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                        {accessMeta.requiredLabel ?? "Hội viên"}
                      </Badge>
                    </div>
                  )}
                  {collection.listingsCount ? (
                    <div className="absolute right-6 top-5">
                      <Badge variant="outline" className="rounded-full border-white/80 bg-white/70 text-xs font-medium text-slate-700">
                        {collection.listingsCount} homestay
                      </Badge>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-4 px-6 pb-6 pt-6">
                  <div className="flex flex-wrap items-center gap-2">
                    {collection.tags?.filter(Boolean).slice(0, 4).map((tag) => (
                      <Badge key={tag} variant="secondary" className="rounded-full bg-primary/10 text-primary">
                        {tag}
                      </Badge>
                    ))}
                    {collection.location && (
                      <Badge variant="outline" className="rounded-full border-slate-200 text-xs text-slate-600">
                        {collection.location}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-2xl font-semibold text-slate-900">{collection.title}</h3>
                    <p className="text-base text-slate-600">{collection.description}</p>
                  </div>

                  <Link
                    href={href}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                  >
                    {actionLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                {locked && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/70 p-6 text-center text-slate-100 backdrop-blur-sm">
                    <Lock className="h-8 w-8 text-amber-300" />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold uppercase tracking-wide text-amber-200">Chỉ dành cho {accessMeta.requiredLabel}</p>
                      <p className="text-sm text-slate-200">
                        Đăng ký membership để mở khóa bộ sưu tập độc quyền, concierge riêng và ưu đãi đặc biệt.
                      </p>
                    </div>
                    <Link
                      href="/membership"
                      className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-4 py-2 text-xs font-bold text-slate-900 shadow hover:bg-amber-200"
                    >
                      Nâng cấp ngay
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
