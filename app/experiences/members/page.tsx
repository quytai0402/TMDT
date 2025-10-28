import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ExperiencesGrid } from "@/components/experiences-grid"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getExperienceSummaries } from "@/lib/experiences"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getMembershipForUser } from "@/lib/membership"
import { Lock, CalendarCheck, Sparkles } from "lucide-react"
import Link from "next/link"

export const revalidate = 300

export default async function MembersExperiencesPage() {
  const session = await getServerSession(authOptions)
  const membership = session?.user?.id ? await getMembershipForUser(session.user.id) : null
  const isActiveMember = Boolean(membership?.isActive)

  const experiences = isActiveMember ? await getExperienceSummaries({ membersOnly: true }) : []

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gradient-to-b from-background to-muted/40">
        <div className="container mx-auto px-4 lg:px-10 py-16 space-y-12">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Badge variant="outline" className="px-4 py-1 text-sm border-primary/40 text-primary">
              <Sparkles className="inline h-4 w-4 mr-2" />
              Member Experiences
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Workshop & city tour chỉ dành riêng cho thành viên
            </h1>
            <p className="text-lg text-muted-foreground">
              Tận hưởng các hoạt động được thiết kế riêng cho hội viên LuxeStay: private chef, workshop kết nối và city tour bí mật mỗi cuối tuần.
            </p>
          </div>

          {!session?.user ? (
            <Card className="max-w-2xl mx-auto border-dashed border-primary/40">
              <CardContent className="py-10 space-y-4 text-center">
                <Lock className="w-10 h-10 mx-auto text-primary" />
                <h2 className="text-2xl font-semibold">Đăng nhập để xem trải nghiệm dành riêng</h2>
                <p className="text-muted-foreground">
                  Thành viên LuxeStay nhận quyền ưu tiên tham gia workshop, city tour được tuyển chọn kỹ lưỡng mỗi tháng.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild size="lg">
                    <Link href="/login?callbackUrl=%2Fexperiences%2Fmembers">Đăng nhập</Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link href="/membership">Nâng cấp membership</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : !isActiveMember ? (
            <Card className="max-w-3xl mx-auto border-dashed border-primary/40 bg-primary/5">
              <CardContent className="py-10 space-y-4 text-center">
                <CalendarCheck className="w-12 h-12 mx-auto text-primary" />
                <h2 className="text-2xl font-semibold">Trở thành hội viên để đặt chỗ ngay</h2>
                <p className="text-muted-foreground">
                  Gold và Diamond member sẽ được đặt giữ chỗ trước, nhận thông báo sớm về các workshop private chef, city tour giới hạn người tham gia.
                </p>
                <Button size="lg" asChild>
                  <Link href="/membership?reason=experiences">Trở thành member</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-10">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="text-left space-y-1">
                  <p className="text-sm font-semibold text-primary uppercase tracking-wide">Exclusive Member Calendar</p>
                  <h2 className="text-2xl font-bold">Lịch hoạt động tháng này</h2>
                  <p className="text-muted-foreground">
                    Đặt lịch sớm để giữ chỗ cho bữa tối private chef, airport transfer concierge và city walk do local expert dẫn dắt.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button asChild variant="outline">
                    <Link href="/collections/secret">Secret Collection</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/rewards">Rewards của tôi</Link>
                  </Button>
                </div>
              </div>

              <ExperiencesGrid
                initialExperiences={experiences}
                title="Trải nghiệm dành riêng cho member"
                subtitle="Concierge LuxeStay đã kiểm duyệt từng hoạt động để đảm bảo dịch vụ 5 sao và số lượng giới hạn."
                badgeLabel="Members Only"
              />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
