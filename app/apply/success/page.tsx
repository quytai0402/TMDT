import Link from "next/link"
import { CheckCircle2, Clock, Sparkles, ArrowRight } from "lucide-react"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type TimelineItem = {
  title: string
  description: string
}

type SuccessAction = {
  href: string
  label: string
}

type SuccessConfig = {
  title: string
  subtitle: string
  badge: string
  timeline: TimelineItem[]
  primaryAction: SuccessAction
  secondaryAction: SuccessAction
}

const SUCCESS_CONFIG: Record<"host" | "guide", SuccessConfig> = {
  host: {
    title: "Hồ sơ chủ nhà đã được ghi nhận",
    subtitle:
      "Đội ngũ LuxeStay sẽ kiểm duyệt trong vòng 24-48 giờ. Concierge sẽ chủ động liên hệ nếu cần thêm thông tin.",
    badge: "Host Application",
    timeline: [
      {
        title: "Đối soát thanh toán",
        description:
          "Kiểm tra mã tham chiếu và biên lai chuyển khoản. Bạn sẽ nhận email xác nhận ngay sau khi đối soát thành công.",
      },
      {
        title: "Kiểm duyệt hồ sơ",
        description:
          "Chuyên viên vận hành đánh giá thông tin homestay, đội ngũ hỗ trợ và kế hoạch vận hành của bạn.",
      },
      {
        title: "Kích hoạt quyền host",
        description:
          "Ngay khi được duyệt, bạn có thể đăng listing, cấu hình lịch và nhận đặt phòng trên LuxeStay.",
      },
    ],
    primaryAction: {
      href: "/dashboard",
      label: "Về trang quản lý",
    },
    secondaryAction: {
      href: "/concierge",
      label: "Liên hệ concierge",
    },
  },
  guide: {
    title: "Hồ sơ hướng dẫn viên đã được ghi nhận",
    subtitle:
      "Concierge Experiences sẽ phản hồi trong vòng 24-48 giờ. Bạn sẽ nhận thông báo khi hồ sơ đổi trạng thái.",
    badge: "Guide Application",
    timeline: [
      {
        title: "Đối soát phí thành viên",
        description:
          "Xác nhận mã tham chiếu thanh toán và biên lai VietQR để kích hoạt gói hướng dẫn viên.",
      },
      {
        title: "Đánh giá chuyên môn",
        description:
          "Đội ngũ LuxeStay Experiences sẽ xem xét hồ sơ, portfolio và khu vực hoạt động của bạn.",
      },
      {
        title: "Kích hoạt trung tâm hướng dẫn viên",
        description:
          "Sau khi được duyệt, bạn có thể tạo trải nghiệm, quản lý booking và nhận hỗ trợ marketing.",
      },
    ],
    primaryAction: {
      href: "/guide/dashboard",
      label: "Mở bảng điều khiển",
    },
    secondaryAction: {
      href: "/community",
      label: "Khám phá cộng đồng",
    },
  },
}

interface SuccessPageProps {
  searchParams?: Record<string, string | string[] | undefined>
}

const defaultCopy: SuccessConfig = {
  title: "Yêu cầu đã được gửi",
  subtitle: "Chúng tôi sẽ liên hệ trong thời gian sớm nhất.",
  badge: "Application Submitted",
  timeline: [],
  primaryAction: {
    href: "/",
    label: "Quay về trang chủ",
  },
  secondaryAction: {
    href: "/contact",
    label: "Liên hệ hỗ trợ",
  },
}

export default function ApplySuccessPage({ searchParams }: SuccessPageProps) {
  const typeParam = typeof searchParams?.type === "string" ? searchParams.type.toLowerCase() : "host"
  const reference = typeof searchParams?.reference === "string" ? searchParams.reference : ""
  const mode = typeof searchParams?.mode === "string" ? searchParams.mode : "new"

  const successType: "host" | "guide" = typeParam === "guide" ? "guide" : "host"
  const config = SUCCESS_CONFIG[successType] ?? defaultCopy

  const title = config.title || defaultCopy.title
  const subtitle = config.subtitle || defaultCopy.subtitle
  const badge = config.badge || defaultCopy.badge
  const timeline = config.timeline.length > 0 ? config.timeline : defaultCopy.timeline
  const primaryAction = config.primaryAction || defaultCopy.primaryAction
  const secondaryAction = config.secondaryAction || defaultCopy.secondaryAction

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <Header />
      <main className="flex-1">
        <section className="container mx-auto px-4 py-12 lg:px-8 lg:py-16">
          <div className="mx-auto flex max-w-4xl flex-col gap-10 rounded-3xl border border-primary/10 bg-white/80 p-8 shadow-xl backdrop-blur-md lg:p-12">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge className="flex items-center gap-2 bg-primary/10 text-primary">
                <Sparkles className="h-3.5 w-3.5" /> {badge}
              </Badge>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" /> Gửi thành công • {mode === "update" ? "Đã cập nhật" : "Hồ sơ mới"}
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="font-serif text-4xl font-bold text-foreground lg:text-5xl">{title}</h1>
              <p className="text-lg text-muted-foreground lg:text-xl">{subtitle}</p>
            </div>

            {reference ? (
              <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-6">
                <p className="text-sm font-semibold uppercase tracking-wide text-primary">Mã tham chiếu chuyển khoản</p>
                <p className="mt-2 text-3xl font-mono font-bold text-primary">{reference}</p>
                <p className="mt-3 text-sm text-muted-foreground">
                  Vui lòng ghi rõ mã này khi chuyển khoản hoặc gửi cùng biên lai để LuxeStay đối soát nhanh chóng.
                </p>
              </div>
            ) : null}

            {timeline.length > 0 ? (
              <div className="grid gap-5 lg:grid-cols-3">
                {timeline.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-muted/40 bg-muted/10 p-5 shadow-sm">
                    <div className="mb-3 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      <CheckCircle2 className="mr-2 h-3.5 w-3.5" /> Bước tiếp theo
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">{item.title}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="flex flex-col items-start gap-3 border-t border-muted/40 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>LuxeStay sẽ gửi email và thông báo trong hệ thống ngay khi trạng thái hồ sơ thay đổi.</p>
                <p>Nếu cần hỗ trợ khẩn, liên hệ concierge 24/7 qua live chat hoặc hotline.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href={primaryAction.href} className="inline-flex items-center gap-2">
                    {primaryAction.label}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
