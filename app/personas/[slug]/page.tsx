import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ListingCard } from "@/components/listing-card"
import { Badge } from "@/components/ui/badge"
import { PERSONAS, getPersona } from "@/lib/personas"
import { PersonaIcon } from "@/components/persona-icon"

interface PersonaPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

async function fetchPersonaListings(slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const response = await fetch(`${baseUrl}/api/search?limit=12&persona=${slug}`, {
    cache: "no-store",
  })

  if (!response.ok) {
    return []
  }

  const data = await response.json()
  return data?.listings ?? []
}

export default async function PersonaDetailPage({ params }: PersonaPageProps) {
  const { slug } = await params
  const persona = getPersona(slug)

  if (!persona) {
    notFound()
  }

  const listings = await fetchPersonaListings(persona.slug)

  return (
    <div className={`flex min-h-screen flex-col bg-gradient-to-b ${persona.gradient}`}>
      <Header />
      <main className="flex-1">
        <section className="relative overflow-hidden py-16 md:py-20">
          <div className="absolute inset-x-0 top-0 h-2/3 bg-gradient-to-br from-primary/10 via-white to-transparent opacity-80" />
          <div className="container relative mx-auto px-4 lg:px-8">
            <div className="grid gap-10 md:grid-cols-[0.85fr_1.15fr] md:items-end">
              <div className="space-y-6">
                <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
                  Persona {persona.name}
                </Badge>
                <div className="flex items-center gap-3">
                  <span className="flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                    <PersonaIcon name={persona.icon} className="h-7 w-7" />
                  </span>
                  <div>
                    <h1 className="font-serif text-4xl font-bold text-slate-900 md:text-5xl">{persona.name}</h1>
                    <p className="text-lg font-medium text-primary/80">{persona.tagline}</p>
                  </div>
                </div>
                <p className="text-base text-slate-700 md:text-lg">{persona.description}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {persona.highlights.map((highlight) => (
                    <div key={highlight} className="flex items-start gap-2 rounded-2xl bg-white/70 p-3 shadow-sm">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                      <p className="text-sm text-slate-700">{highlight}</p>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">{persona.searchHint}</p>
              </div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-white/40 shadow-xl">
                <img
                  src={persona.heroImage}
                  alt={persona.name}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-white py-14">
          <div className="container mx-auto px-4 lg:px-8 space-y-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 md:text-3xl">Homestay phù hợp nhất</h2>
                <p className="text-sm text-slate-600">
                  Bộ lọc đã áp dụng:{" "}
                  {persona.filters.verifiedAmenities?.length ? (
                    <span>
                      tiện nghi {persona.filters.verifiedAmenities.join(", ")}
                      {persona.filters.allowPets !== undefined ? ", " : ""}
                    </span>
                  ) : null}
                  {persona.filters.allowPets !== undefined ? (
                    <span>{persona.filters.allowPets ? "cho phép thú cưng" : "không cho phép thú cưng"}</span>
                  ) : null}
                  {persona.filters.requireMonthlyDiscount ? ", giảm giá tháng" : ""}
                  {persona.filters.minimumRating ? `, rating ≥ ${persona.filters.minimumRating}` : ""}
                </p>
              </div>
            </div>

            {listings.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-primary/30 bg-primary/5 p-12 text-center">
                <p className="text-base text-slate-600">
                  Hiện chưa có homestay nào khớp chính xác bộ tiêu chí này. Concierge sẽ giúp bạn tìm đối tác phù hợp,
                  hoặc thử nới rộng bộ lọc.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {listings.map((listing: any) => (
                  <ListingCard
                    key={listing.id}
                    id={listing.slug || listing.id}
                    title={listing.title}
                    location={[listing.city, listing.country].filter(Boolean).join(", ")}
                    price={listing.basePrice}
                    rating={Number(listing.averageRating || 4.8)}
                    reviews={listing._count?.reviews ?? listing.totalReviews ?? 0}
                    image={listing.images?.[0] || "/placeholder.svg"}
                    host={listing.host?.name || "Host"}
                    guests={listing.maxGuests}
                    bedrooms={listing.bedrooms}
                    featured={listing.featured}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="bg-slate-50 py-16">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-start">
              <div className="space-y-5">
                <Badge variant="outline" className="border-slate-300 bg-white text-slate-700">
                  Concierge đề xuất
                </Badge>
                <h3 className="text-2xl font-semibold text-slate-900">Hành trình concierge chuẩn bị cho bạn</h3>
                <p className="text-sm text-slate-600">{persona.conciergePitch}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {persona.experiences.map((experience) => (
                  <div key={experience.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h4 className="text-lg font-semibold text-slate-900">{experience.title}</h4>
                    <p className="mt-2 text-sm text-slate-600">{experience.description}</p>
                    {experience.cta && (
                      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-primary">
                        {experience.cta}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-14">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 p-8 shadow-md">
              <h3 className="text-2xl font-semibold text-slate-900">Checklist review dành riêng cho persona này</h3>
              <p className="mt-2 text-sm text-slate-600">
                Khi đọc review, hãy lưu ý những keyword sau để đảm bảo trải nghiệm đúng kỳ vọng của bạn:
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {persona.reviewFocus.map((keyword) => (
                  <Badge key={keyword} variant="secondary" className="rounded-full bg-primary/10 text-primary">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

export async function generateStaticParams() {
  return Object.keys(PERSONAS).map((slug) => ({ slug }))
}
