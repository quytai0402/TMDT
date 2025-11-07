import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ExperienceHero } from "@/components/experience-hero"
import { ExperienceBookingWidget } from "@/components/experience-booking-widget"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, CheckCircle2, Info, MapPin, XCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

async function getExperience(id: string) {
  const experience = await prisma.experience.findUnique({
    where: { id, status: "ACTIVE" },
    include: {
      host: {
        select: {
          id: true,
          name: true,
          image: true,
          bio: true,
          isVerified: true,
          hostProfile: {
            select: {
              responseRate: true,
              responseTime: true,
              totalReviews: true,
            },
          },
        },
      },
      reviews: {
        select: {
          id: true,
          rating: true,
          content: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      },
    },
  })

  if (!experience) {
    return null
  }

  return experience
}

export default async function ExperienceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const experience = await getExperience(id)

  if (!experience) {
    notFound()
  }

  const session = await getServerSession(authOptions)

  const {
    title,
    description,
    images,
    image,
    category,
    city,
    state,
    location,
    duration,
    groupSize,
    languages,
    averageRating,
    totalReviews,
    price,
    currency,
    tags,
    includedItems,
    notIncluded,
    requirements,
    host,
    minGuests,
    maxGuests,
  } = experience

  const galleryImages = images && images.length > 0 ? images : [image]
  const highlights = tags.length > 0 ? tags.slice(0, 6) : includedItems.slice(0, 6)
  const locationLabel = state ? `${city}, ${state}` : city
  const whatToBring = requirements.length > 0 ? requirements : ["Mang theo tâm trạng thoải mái", "Chuẩn bị tinh thần trải nghiệm"]

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Link href="/experiences">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại Trải nghiệm
              </Button>
            </Link>
          </div>

          <ExperienceHero
            title={title}
            description={description}
            images={galleryImages}
            host={{
              name: host.name || "Hướng dẫn viên",
              avatar: host.image || "/placeholder.svg",
              verified: host.isVerified,
            }}
            category={category}
            location={location}
            duration={duration}
            groupSize={groupSize}
            languages={languages.length > 0 ? languages : ["Tiếng Việt"]}
            rating={averageRating}
            reviewCount={totalReviews}
          />

          <div className="grid lg:grid-cols-3 gap-8 mt-12">
            <div className="lg:col-span-2 space-y-8">
              <section>
                <h2 className="text-2xl font-bold mb-4">Về trải nghiệm này</h2>
                <div className="prose max-w-none text-muted-foreground leading-relaxed space-y-4">
                  <p>{description}</p>
                </div>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-bold mb-4">Điểm nổi bật</h2>
                <div className="grid md:grid-cols-2 gap-3">
                  {highlights.map((highlight, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{highlight}</span>
                    </div>
                  ))}
                </div>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-bold mb-4">Bao gồm & Không bao gồm</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Bao gồm
                    </h3>
                    {includedItems.map((item, index) => (
                      <div key={index} className="flex items-start gap-2 ml-7">
                        <span className="text-sm text-muted-foreground">• {item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-600" />
                      Không bao gồm
                    </h3>
                    {notIncluded.length === 0 ? (
                      <p className="text-sm text-muted-foreground ml-7">Không có thông tin cụ thể.</p>
                    ) : (
                      notIncluded.map((item, index) => (
                        <div key={index} className="flex items-start gap-2 ml-7">
                          <span className="text-sm text-muted-foreground">• {item}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-bold mb-4">Cần mang theo</h2>
                <div className="grid md:grid-cols-2 gap-3">
                  {whatToBring.map((item, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-bold mb-4">Gặp gỡ hướng dẫn viên</h2>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={host.image || undefined} alt={host.name ?? "Host"} />
                        <AvatarFallback>{(host.name || "H").charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{host.name || "Hướng dẫn viên"}</h3>
                          {host.isVerified && <Badge variant="secondary">✓ Verified</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {host.bio || "Hướng dẫn viên giàu kinh nghiệm, am hiểu địa phương và luôn sẵn sàng hỗ trợ bạn."}
                        </p>
                        {host.hostProfile && (
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span>Tỉ lệ phản hồi: {Math.round((host.hostProfile.responseRate ?? 0) * 100)}%</span>
                            <span>
                              Thời gian phản hồi: {host.hostProfile.responseTime ? `${host.hostProfile.responseTime} phút` : "Nhanh"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {experience.reviews.length > 0 && (
                <>
                  <Separator />
                  <section className="space-y-4">
                    <h2 className="text-2xl font-bold">Đánh giá gần đây</h2>
                    {experience.reviews.map((review) => (
                      <Card key={review.id} className="border-border/70">
                        <CardContent className="pt-6 space-y-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={review.author.image ?? undefined} alt={review.author.name ?? "Khách"} />
                              <AvatarFallback>{(review.author.name || "K").charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{review.author.name || "Khách ẩn danh"}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{review.content}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </section>
                </>
              )}
            </div>

            <div className="lg:col-span-1 space-y-6">
              <ExperienceBookingWidget
                experienceId={experience.id}
                pricePerPerson={price}
                currency={currency}
                minGuests={minGuests}
                maxGuests={maxGuests}
                membershipPlan={session?.user?.membershipPlan ?? null}
                membershipStatus={session?.user?.membershipStatus ?? null}
              />

              <Card className="border border-border/60">
                <CardHeader>
                  <CardTitle className="text-base">Thông tin chi tiết</CardTitle>
                  <CardDescription>Những gì bạn cần biết trước khi đặt</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{locationLabel}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Thời lượng {duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    <span>
                      Nhóm {groupSize} • Tối đa {maxGuests} khách
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
