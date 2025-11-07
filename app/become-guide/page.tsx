"use client"

import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Loader2, Sparkles, ClipboardList, ShieldCheck } from "lucide-react"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useAuthModal } from "@/hooks/use-auth-modal"
import { createVietQRUrl, formatTransferReference, getBankTransferInfo } from "@/lib/payments"
import { toast } from "sonner"

const MONTHLY_FEE = 399_000
const COMMISSION_RATE = 0.1

interface GuideApplicationResponse {
  application?: {
    id: string
    status: "PENDING" | "APPROVED" | "REJECTED" | "NEEDS_REVISION"
    displayName: string
    tagline?: string | null
    introduction: string
    experienceSummary: string
    languages: string[]
    serviceAreas: string[]
    specialties: string[]
    availabilityNotes?: string | null
    adminNotes?: string | null
    reviewedAt?: string | null
    createdAt: string
  }
  profile?: {
    id: string
    status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED"
    subscriptionStatus: "ACTIVE" | "INACTIVE" | "PAST_DUE" | "CANCELLED"
  }
}

type ApplicationFormState = {
  displayName: string
  tagline: string
  introduction: string
  experienceSummary: string
  languages: string
  serviceAreas: string
  specialties: string
  availabilityNotes: string
  portfolioLinks: string
  subscriptionAcknowledged: boolean
}

const initialFormState: ApplicationFormState = {
  displayName: "",
  tagline: "",
  introduction: "",
  experienceSummary: "",
  languages: "",
  serviceAreas: "",
  specialties: "",
  availabilityNotes: "",
  portfolioLinks: "",
  subscriptionAcknowledged: false,
}

type RegisterFormState = {
  name: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  displayName: string
  tagline: string
  introduction: string
  experienceSummary: string
  languages: string
  serviceAreas: string
  specialties: string
  availabilityNotes: string
  portfolioLinks: string
  subscriptionAcknowledged: boolean
}

const initialRegisterFormState: RegisterFormState = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  displayName: "",
  tagline: "",
  introduction: "",
  experienceSummary: "",
  languages: "",
  serviceAreas: "",
  specialties: "",
  availabilityNotes: "",
  portfolioLinks: "",
  subscriptionAcknowledged: false,
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value)

const parseList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter((item, index, array) => item.length > 0 && array.indexOf(item) === index)

const LANGUAGE_SUGGESTIONS = ["Tiếng Việt", "Tiếng Anh", "Tiếng Hàn", "Tiếng Nhật", "Tiếng Trung", "Tiếng Pháp"]
const SERVICE_AREA_SUGGESTIONS = ["Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Hội An", "Đà Lạt", "Phú Quốc"]
const SPECIALTY_SUGGESTIONS = ["Ẩm thực", "Kiến trúc", "Nhiếp ảnh", "Wellness", "Workation", "Trải nghiệm đêm"]

const GUIDE_BANK_INFO = getBankTransferInfo()

type GuideListField = keyof Pick<ApplicationFormState, "languages" | "serviceAreas" | "specialties">
type GuideRegisterListField = keyof Pick<RegisterFormState, "languages" | "serviceAreas" | "specialties">

const addToListString = (current: string, value: string) => {
  const list = parseList(current)
  if (list.includes(value)) return current
  return [...list, value].join(", ")
}

const removeFromListString = (current: string, value: string) => {
  const list = parseList(current).filter((item) => item !== value)
  return list.join(", ")
}

export default function BecomeGuidePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const authModal = useAuthModal()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [form, setForm] = useState<ApplicationFormState>(initialFormState)
  const [existingApplication, setExistingApplication] = useState<GuideApplicationResponse["application"] | null>(null)
  const [profile, setProfile] = useState<GuideApplicationResponse["profile"] | null>(null)
  const [registerForm, setRegisterForm] = useState<RegisterFormState>(initialRegisterFormState)
  const [registerSubmitting, setRegisterSubmitting] = useState(false)
  const [registerError, setRegisterError] = useState<string | null>(null)
  const guideReference = useMemo(() => {
    const identifier = session?.user?.id ?? session?.user?.email ?? session?.user?.name ?? "GUIDE399K"
    return formatTransferReference("MEMBERSHIP", identifier)
  }, [session?.user?.email, session?.user?.id, session?.user?.name])
  const guideQrUrl = useMemo(() => createVietQRUrl(MONTHLY_FEE, guideReference), [guideReference])
  const registerGuideReference = useMemo(() => {
    const identifier = registerForm.email || registerForm.phone || registerForm.name || "GUIDE399K"
    return formatTransferReference("MEMBERSHIP", identifier)
  }, [registerForm.email, registerForm.phone, registerForm.name])
  const registerGuideQrUrl = useMemo(() => createVietQRUrl(MONTHLY_FEE, registerGuideReference), [registerGuideReference])

  const handleFormChipAdd = (field: GuideListField, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: addToListString(prev[field], value),
    }))
  }

  const handleFormChipRemove = (field: GuideListField, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: removeFromListString(prev[field], value),
    }))
  }

  const handleRegisterChipAdd = (field: GuideRegisterListField, value: string) => {
    setRegisterForm((prev) => ({
      ...prev,
      [field]: addToListString(prev[field], value),
    }))
  }

  const handleRegisterChipRemove = (field: GuideRegisterListField, value: string) => {
    setRegisterForm((prev) => ({
      ...prev,
      [field]: removeFromListString(prev[field], value),
    }))
  }

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) {
      setLoading(false)
      return
    }

    const load = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/guide/applications", { cache: "no-store" })
        if (!response.ok) {
          throw new Error("Không thể tải thông tin hồ sơ hướng dẫn viên")
        }
        const data: GuideApplicationResponse = await response.json()
        if (data.application) {
          const application = data.application
          setExistingApplication(application)
          setForm((prev) => ({
            ...prev,
            displayName: application.displayName,
            tagline: application.tagline ?? "",
            introduction: application.introduction,
            experienceSummary: application.experienceSummary,
            languages: application.languages.join(", "),
            serviceAreas: application.serviceAreas.join(", "),
            specialties: application.specialties.join(", "),
            availabilityNotes: application.availabilityNotes ?? "",
            subscriptionAcknowledged: true,
          }))
        }
        if (data.profile) {
          setProfile(data.profile)
        }
      } catch (error) {
        console.error(error)
        toast.error((error as Error).message)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [session, status])

  const statusBadge = useMemo(() => {
    if (!existingApplication) return null
    const map: Record<typeof existingApplication.status, { label: string; variant: "default" | "outline" | "destructive" | "secondary" }> = {
      PENDING: { label: "Chờ duyệt", variant: "outline" },
      APPROVED: { label: "Đã duyệt", variant: "default" },
      REJECTED: { label: "Đã từ chối", variant: "destructive" },
      NEEDS_REVISION: { label: "Cần bổ sung", variant: "secondary" },
    }
    const meta = map[existingApplication.status]
    return <Badge variant={meta.variant}>{meta.label}</Badge>
  }, [existingApplication])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!session?.user) {
      toast.error("Vui lòng đăng nhập để gửi hồ sơ")
      authModal.openLogin()
      return
    }

    setFormError(null)

    if (!form.subscriptionAcknowledged) {
      toast.error("Bạn cần đồng ý với phí thành viên hướng dẫn viên")
      return
    }

    const displayName = form.displayName.trim()
    if (displayName.length < 2) {
      setFormError("Tên thương hiệu cần tối thiểu 2 ký tự.")
      return
    }

    const introduction = form.introduction.trim()
    if (introduction.length < 40) {
      setFormError("Vui lòng mô tả kỹ năng và phong cách hướng dẫn của bạn (tối thiểu 40 ký tự).")
      return
    }

    const experienceSummary = form.experienceSummary.trim()
    if (experienceSummary.length < 40) {
      setFormError("Hãy chia sẻ kinh nghiệm dẫn tour của bạn (tối thiểu 40 ký tự).")
      return
    }

    const languages = parseList(form.languages)
    if (!languages.length) {
      setFormError("Vui lòng nhập ít nhất một ngôn ngữ bạn sử dụng.")
      return
    }

    const serviceAreas = parseList(form.serviceAreas)
    if (!serviceAreas.length) {
      setFormError("Vui lòng nhập tối thiểu một khu vực hoạt động chính.")
      return
    }

    const specialties = parseList(form.specialties)
    if (!specialties.length) {
      setFormError("Vui lòng nhập ít nhất một chủ đề trải nghiệm.")
      return
    }

    const portfolioLinks = parseList(form.portfolioLinks)
    if (portfolioLinks.length > 5) {
      setFormError("Bạn chỉ có thể thêm tối đa 5 đường dẫn portfolio.")
      return
    }

    const isUpdate = Boolean(existingApplication)

    try {
      setSubmitting(true)
      const payload = {
        displayName,
        tagline: form.tagline.trim() || undefined,
        introduction,
        experienceSummary,
        languages,
        serviceAreas,
        specialties,
        availabilityNotes: form.availabilityNotes.trim() || undefined,
        portfolioLinks: portfolioLinks.length ? portfolioLinks : undefined,
        subscriptionAcknowledged: form.subscriptionAcknowledged,
        paymentReference: guideReference,
      }

      const response = await fetch("/api/guide/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Không thể gửi hồ sơ")
      }

      setFormError(null)
      setExistingApplication(data.application)
      toast.success("Đã gửi hồ sơ hướng dẫn viên. Admin sẽ phản hồi trong 24-48 giờ")
      router.push(
        `/apply/success?type=guide&reference=${encodeURIComponent(guideReference)}&mode=${isUpdate ? "update" : "new"}`,
      )
      return
    } catch (error) {
      console.error(error)
      const message = (error as Error).message
      setFormError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
  setRegisterError(null)

    if (!registerForm.name.trim()) {
      setRegisterError("Vui lòng nhập họ tên đầy đủ.")
      return
    }

    if (registerForm.password.length < 8) {
      setRegisterError("Mật khẩu cần tối thiểu 8 ký tự.")
      return
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setRegisterError("Mật khẩu xác nhận không khớp.")
      return
    }

    const languages = parseList(registerForm.languages)
    if (languages.length === 0) {
      setRegisterError("Vui lòng liệt kê ít nhất một ngôn ngữ bạn sử dụng.")
      return
    }

    const serviceAreas = parseList(registerForm.serviceAreas)
    if (serviceAreas.length === 0) {
      setRegisterError("Vui lòng nhập tối thiểu một khu vực hoạt động.")
      return
    }

    const specialties = parseList(registerForm.specialties)
    if (specialties.length === 0) {
      setRegisterError("Vui lòng nhập tối thiểu một chủ đề trải nghiệm.")
      return
    }

    if (!registerForm.subscriptionAcknowledged) {
      setRegisterError("Bạn cần đồng ý với phí thành viên và hoa hồng nền tảng.")
      return
    }

    try {
      setRegisterSubmitting(true)
      const response = await fetch("/api/guide/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: registerForm.name.trim(),
          email: registerForm.email.trim().toLowerCase(),
          phone: registerForm.phone.trim(),
          password: registerForm.password,
          displayName: registerForm.displayName.trim(),
          tagline: registerForm.tagline.trim() || undefined,
          introduction: registerForm.introduction.trim(),
          experienceSummary: registerForm.experienceSummary.trim(),
          languages,
          serviceAreas,
          specialties,
          availabilityNotes: registerForm.availabilityNotes.trim() || undefined,
          portfolioLinks: parseList(registerForm.portfolioLinks),
          subscriptionAcknowledged: registerForm.subscriptionAcknowledged,
          paymentReference: registerGuideReference,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Không thể đăng ký tài khoản hướng dẫn viên.")
      }

      router.push(
        `/apply/success?type=guide&reference=${encodeURIComponent(registerGuideReference)}&mode=register`,
      )
      return
    } catch (error) {
      setRegisterError((error as Error).message)
    } finally {
      setRegisterSubmitting(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 lg:px-8">
          <div className="mx-auto max-w-5xl space-y-10">
            <section className="relative overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-teal-50 via-white to-sky-50 p-8 shadow-lg">
              <div className="pointer-events-none absolute -top-16 -right-12 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-16 -left-10 h-64 w-64 rounded-full bg-emerald-100/40 blur-3xl" />

              <div className="relative grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-center">
                <div className="space-y-6 text-left">
                  <Badge className="inline-flex items-center gap-2 bg-primary/10 text-primary">
                    <Sparkles className="h-4 w-4" /> LuxeStay Experiences Network
                  </Badge>
                  <div className="space-y-4">
                    <h1 className="font-serif text-4xl font-bold text-foreground md:text-5xl">
                      Trở thành hướng dẫn viên LuxeStay
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl">
                      Xây dựng thương hiệu cá nhân, thiết kế trải nghiệm độc đáo và tiếp cận tập khách cao cấp của LuxeStay.
                      Bạn sẽ nhận được đội ngũ concierge hỗ trợ, nền tảng marketing và hệ thống thanh toán minh bạch.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm">
                    {[
                      "Thiết kế & bán trải nghiệm riêng",
                      "Concierge hỗ trợ 24/7",
                      "Quản lý booking & thu nhập minh bạch",
                      "Khóa học nâng cao kỹ năng dẫn tour",
                    ].map((benefit) => (
                      <span
                        key={benefit}
                        className="rounded-full bg-white/70 px-4 py-2 text-primary shadow-sm ring-1 ring-primary/10"
                      >
                        {benefit}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-xl backdrop-blur">
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-primary uppercase tracking-wide">Gói thành viên hướng dẫn viên</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-foreground">{formatCurrency(MONTHLY_FEE)}</span>
                      <span className="text-sm text-muted-foreground">/ tháng</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      LuxeStay thu thêm {Math.round(COMMISSION_RATE * 100)}% hoa hồng trên mỗi trải nghiệm đã hoàn thành.
                    </p>
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 rounded-xl bg-primary/5 px-4 py-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span>Hiển thị nổi bật trên LuxeStay & chiến dịch đối tác</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-primary/5 px-4 py-2">
                      <ClipboardList className="h-4 w-4 text-primary" />
                      <span>Dashboard quản lý lịch, booking và thu nhập theo thời gian thực</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-primary/5 px-4 py-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      <span>Bảo hiểm trách nhiệm & concierge xử lý sự cố cho mọi trải nghiệm</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {existingApplication ? (
              <Card className="border border-primary/20">
                <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="text-xl">Trạng thái hồ sơ</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Hồ sơ của bạn được cập nhật theo thời gian thực. Admin sẽ phản hồi qua email và thông báo trong hệ thống.
                    </p>
                  </div>
                  {statusBadge}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border bg-white/60 p-4 shadow-sm">
                      <p className="text-sm font-semibold text-muted-foreground">Tên thương hiệu</p>
                      <p className="text-lg font-medium text-foreground">{existingApplication.displayName}</p>
                      {existingApplication.tagline ? (
                        <p className="mt-1 text-sm text-muted-foreground">{existingApplication.tagline}</p>
                      ) : null}
                    </div>
                    <div className="rounded-lg border bg-white/60 p-4 shadow-sm">
                      <p className="text-sm font-semibold text-muted-foreground">Ngôn ngữ</p>
                      <p className="text-sm text-foreground">{existingApplication.languages.join(", ")}</p>
                    </div>
                  </div>

                  {existingApplication.adminNotes ? (
                    <div className="rounded-lg border border-dashed bg-amber-50 p-4 text-sm text-amber-900">
                      <p className="font-semibold mb-1">Ghi chú từ admin</p>
                      <p className="whitespace-pre-line">{existingApplication.adminNotes}</p>
                    </div>
                  ) : null}

                  {profile ? (
                    <div className="rounded-lg border bg-emerald-50 p-4 text-sm text-emerald-900">
                      <p className="font-semibold mb-1 flex items-center gap-2">
                        <ClipboardList className="h-4 w-4" /> Trung tâm hướng dẫn viên
                      </p>
                      <p>
                        {profile.status === "APPROVED"
                          ? "Bạn đã có thể truy cập dashboard hướng dẫn viên để quản lý lịch, booking và thu nhập."
                          : "Hồ sơ đang trong trạng thái xử lý. Chúng tôi sẽ thông báo ngay khi hoàn tất."}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="outline">Trạng thái hồ sơ: {profile.status}</Badge>
                        <Badge variant="outline">Trạng thái gói: {profile.subscriptionStatus}</Badge>
                      </div>
                      {profile.status === "APPROVED" ? (
                        <Button className="mt-4" onClick={() => router.push("/guide/dashboard")}>Mở dashboard hướng dẫn viên</Button>
                      ) : null}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            {session?.user ? (
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin hồ sơ hướng dẫn viên</CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="displayName">Tên thương hiệu *</Label>
                        <Input
                          id="displayName"
                          placeholder="Ví dụ: Anh Minh - Saigon Food Walks"
                          maxLength={80}
                          value={form.displayName}
                          onChange={(event) => setForm((prev) => ({ ...prev, displayName: event.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tagline">Tagline (tuỳ chọn)</Label>
                        <Input
                          id="tagline"
                          placeholder="Trải nghiệm ẩm thực đường phố cùng local foodie"
                          maxLength={160}
                          value={form.tagline}
                          onChange={(event) => setForm((prev) => ({ ...prev, tagline: event.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="languages">Ngôn ngữ *</Label>
                        <Input
                          id="languages"
                          placeholder="Ví dụ: Tiếng Việt, Tiếng Anh, Tiếng Hàn"
                          value={form.languages}
                          onChange={(event) => setForm((prev) => ({ ...prev, languages: event.target.value }))}
                          required
                        />
                        <p className="text-xs text-muted-foreground">Nhập danh sách, phân tách bằng dấu phẩy.</p>
                        <div className="mt-3 space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {parseList(form.languages).map((lang) => (
                              <Badge key={lang} variant="secondary" className="flex items-center gap-1 rounded-full">
                                {lang}
                                <button
                                  type="button"
                                  aria-label={`Xóa ${lang}`}
                                  className="text-xs"
                                  onClick={() => handleFormChipRemove("languages", lang)}
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                            {parseList(form.languages).length === 0 ? (
                              <span className="text-xs text-muted-foreground">Chọn ít nhất 1 ngôn ngữ.</span>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {LANGUAGE_SUGGESTIONS.map((lang) => (
                              <Button
                                key={lang}
                                type="button"
                                variant="outline"
                                size="sm"
                                className="rounded-full text-xs"
                                onClick={() => handleFormChipAdd("languages", lang)}
                              >
                                {lang}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="serviceAreas">Khu vực hoạt động *</Label>
                        <Input
                          id="serviceAreas"
                          placeholder="Ví dụ: Quận 1, Hội An, Đà Lạt"
                          value={form.serviceAreas}
                          onChange={(event) => setForm((prev) => ({ ...prev, serviceAreas: event.target.value }))}
                          required
                        />
                        <p className="text-xs text-muted-foreground">Nhập tối thiểu 1 khu vực chính.</p>
                        <div className="mt-3 space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {parseList(form.serviceAreas).map((area) => (
                              <Badge key={area} variant="secondary" className="flex items-center gap-1 rounded-full">
                                {area}
                                <button
                                  type="button"
                                  aria-label={`Xóa ${area}`}
                                  className="text-xs"
                                  onClick={() => handleFormChipRemove("serviceAreas", area)}
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                            {parseList(form.serviceAreas).length === 0 ? (
                              <span className="text-xs text-muted-foreground">Chọn tối thiểu 1 khu vực.</span>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {SERVICE_AREA_SUGGESTIONS.map((area) => (
                              <Button
                                key={area}
                                type="button"
                                variant="outline"
                                size="sm"
                                className="rounded-full text-xs"
                                onClick={() => handleFormChipAdd("serviceAreas", area)}
                              >
                                {area}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="specialties">Chủ đề trải nghiệm *</Label>
                      <Input
                        id="specialties"
                        placeholder="Ví dụ: Ẩm thực, Văn hoá, Nhiếp ảnh, Adventure"
                        value={form.specialties}
                        onChange={(event) => setForm((prev) => ({ ...prev, specialties: event.target.value }))}
                        required
                      />
                      <p className="text-xs text-muted-foreground">Làm nổi bật thế mạnh của bạn (phân tách bằng dấu phẩy).</p>
                      <div className="mt-3 space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {parseList(form.specialties).map((topic) => (
                            <Badge key={topic} variant="secondary" className="flex items-center gap-1 rounded-full">
                              {topic}
                              <button
                                type="button"
                                aria-label={`Xóa ${topic}`}
                                className="text-xs"
                                onClick={() => handleFormChipRemove("specialties", topic)}
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                          {parseList(form.specialties).length === 0 ? (
                            <span className="text-xs text-muted-foreground">Chọn tối thiểu 1 chủ đề.</span>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {SPECIALTY_SUGGESTIONS.map((topic) => (
                            <Button
                              key={topic}
                              type="button"
                              variant="outline"
                              size="sm"
                              className="rounded-full text-xs"
                              onClick={() => handleFormChipAdd("specialties", topic)}
                            >
                              {topic}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="introduction">Giới thiệu bản thân *</Label>
                      <Textarea
                        id="introduction"
                        placeholder="Hãy kể câu chuyện của bạn, phong cách dẫn tour và giá trị bạn mang đến cho khách."
                        rows={5}
                        value={form.introduction}
                        onChange={(event) => setForm((prev) => ({ ...prev, introduction: event.target.value }))}
                        required
                      />
                      <p className="text-xs text-muted-foreground">Nội dung tối thiểu 40 ký tự.</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="experienceSummary">Kinh nghiệm & thành tích *</Label>
                      <Textarea
                        id="experienceSummary"
                        placeholder="Ví dụ: 5 năm làm hướng dẫn viên tại Hội An, hợp tác cùng ..."
                        rows={4}
                        value={form.experienceSummary}
                        onChange={(event) => setForm((prev) => ({ ...prev, experienceSummary: event.target.value }))}
                        required
                      />
                      <p className="text-xs text-muted-foreground">Nội dung tối thiểu 40 ký tự.</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="availabilityNotes">Ghi chú lịch trình (tuỳ chọn)</Label>
                      <Textarea
                        id="availabilityNotes"
                        placeholder="Ví dụ: Có thể dẫn tour cuối tuần, buổi tối sau 19h..."
                        rows={3}
                        value={form.availabilityNotes}
                        onChange={(event) => setForm((prev) => ({ ...prev, availabilityNotes: event.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="portfolioLinks">Portfolio / Social (tuỳ chọn)</Label>
                      <Input
                        id="portfolioLinks"
                        placeholder="Ví dụ: https://instagram.com/... , https://youtube.com/..."
                        value={form.portfolioLinks}
                        onChange={(event) => setForm((prev) => ({ ...prev, portfolioLinks: event.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground">Tối đa 5 đường dẫn, phân tách bằng dấu phẩy.</p>
                    </div>

                    <div className="rounded-2xl border border-dashed border-primary/40 bg-gradient-to-r from-emerald-50/80 to-white p-5 shadow-sm">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4 text-sm">
                        <Checkbox
                          id="subscriptionAcknowledged"
                          checked={form.subscriptionAcknowledged}
                          onCheckedChange={(checked) =>
                            setForm((prev) => ({ ...prev, subscriptionAcknowledged: checked === true }))
                          }
                          className="mt-1"
                        />
                        <div className="space-y-2 text-muted-foreground">
                          <Label htmlFor="subscriptionAcknowledged" className="text-base font-semibold text-foreground">
                            Tôi đồng ý với phí thành viên hướng dẫn viên{" "}
                            <span className="text-primary">{formatCurrency(MONTHLY_FEE)}/tháng</span> và hoa hồng nền tảng{" "}
                            <span className="text-primary">{Math.round(COMMISSION_RATE * 100)}%</span>.
                          </Label>
                          <p>
                            LuxeStay sẽ khấu trừ tự động trước khi thanh toán thu nhập. Bạn luôn có thể xem lịch sử thanh toán trong ví hướng dẫn viên.
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                        <p>• Hỗ trợ marketing đa kênh và đội concierge giữ chỗ cho khách.</p>
                        <p>• Dashboard minh bạch, cảnh báo lịch trùng và báo cáo thu nhập chi tiết.</p>
                      </div>
                    </div>

                    {form.subscriptionAcknowledged ? (
                      <div className="rounded-2xl border border-dashed border-primary/40 bg-white/80 p-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                        <Image
                          src={guideQrUrl}
                          alt="Mã QR thanh toán phí hướng dẫn viên"
                          width={180}
                          height={180}
                          className="rounded-xl border border-primary/20 bg-white p-2"
                        />
                        <div className="space-y-2 text-sm">
                          <p className="font-semibold text-foreground">Quét VietQR để thanh toán phí {formatCurrency(MONTHLY_FEE)}/tháng</p>
                          <p>Ngân hàng: <strong>{GUIDE_BANK_INFO.bankName}</strong></p>
                          <p>Chủ tài khoản: <strong>{GUIDE_BANK_INFO.accountName}</strong></p>
                          <p>Số tài khoản: <strong>{GUIDE_BANK_INFO.accountNumber}</strong></p>
                          <p>Mã tham chiếu: <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">{guideReference}</code></p>
                          <p className="text-xs text-muted-foreground">
                            Ghi rõ mã tham chiếu khi chuyển khoản để hệ thống kích hoạt nhanh chóng sau khi hồ sơ được duyệt.
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <Button type="submit" size="lg" disabled={submitting}>
                        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Gửi hồ sơ hướng dẫn viên
                      </Button>
                      <div className="space-y-1 text-sm text-muted-foreground text-center sm:text-left">
                        <p>
                          Kỷ luật duy trì chất lượng trải nghiệm được kiểm duyệt chặt chẽ. Hãy đảm bảo thông tin chính xác.
                        </p>
                        <p>
                          Đã có tài khoản?{" "}
                          <Button variant="link" className="px-1" onClick={authModal.openLogin}>
                            Đăng nhập
                          </Button>
                        </p>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Đăng ký tài khoản hướng dẫn viên</CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-6" onSubmit={handleRegister}>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="register-name">Họ và tên *</Label>
                        <Input
                          id="register-name"
                          value={registerForm.name}
                          onChange={(event) => setRegisterForm((prev) => ({ ...prev, name: event.target.value }))}
                          placeholder="Nguyễn Văn A"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-email">Email *</Label>
                        <Input
                          id="register-email"
                          type="email"
                          value={registerForm.email}
                          onChange={(event) => setRegisterForm((prev) => ({ ...prev, email: event.target.value }))}
                          placeholder="guide@example.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="register-phone">Số điện thoại *</Label>
                        <Input
                          id="register-phone"
                          value={registerForm.phone}
                          onChange={(event) => setRegisterForm((prev) => ({ ...prev, phone: event.target.value }))}
                          placeholder="0987 654 321"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-password">Mật khẩu *</Label>
                        <Input
                          id="register-password"
                          type="password"
                          value={registerForm.password}
                          onChange={(event) => setRegisterForm((prev) => ({ ...prev, password: event.target.value }))}
                          placeholder="Tối thiểu 8 ký tự"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-confirm">Xác nhận mật khẩu *</Label>
                      <Input
                        id="register-confirm"
                        type="password"
                        value={registerForm.confirmPassword}
                        onChange={(event) =>
                          setRegisterForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
                        }
                        placeholder="Nhập lại mật khẩu"
                        required
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="register-displayName">Tên thương hiệu *</Label>
                        <Input
                          id="register-displayName"
                          maxLength={80}
                          value={registerForm.displayName}
                          onChange={(event) =>
                            setRegisterForm((prev) => ({ ...prev, displayName: event.target.value }))
                          }
                          placeholder="Anh Minh - Saigon Food Walks"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-tagline">Tagline (tuỳ chọn)</Label>
                        <Input
                          id="register-tagline"
                          maxLength={160}
                          value={registerForm.tagline}
                          onChange={(event) => setRegisterForm((prev) => ({ ...prev, tagline: event.target.value }))}
                          placeholder="Trải nghiệm ẩm thực đường phố"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="register-languages">Ngôn ngữ *</Label>
                        <Input
                          id="register-languages"
                          value={registerForm.languages}
                          onChange={(event) => setRegisterForm((prev) => ({ ...prev, languages: event.target.value }))}
                          placeholder="Tiếng Việt, Tiếng Anh"
                          required
                        />
                        <div className="mt-3 space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {parseList(registerForm.languages).map((lang) => (
                              <Badge key={lang} variant="secondary" className="flex items-center gap-1 rounded-full">
                                {lang}
                                <button
                                  type="button"
                                  aria-label={`Xóa ${lang}`}
                                  className="text-xs"
                                  onClick={() => handleRegisterChipRemove("languages", lang)}
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {LANGUAGE_SUGGESTIONS.map((lang) => (
                              <Button
                                key={lang}
                                type="button"
                                variant="outline"
                                size="sm"
                                className="rounded-full text-xs"
                                onClick={() => handleRegisterChipAdd("languages", lang)}
                              >
                                {lang}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-areas">Khu vực hoạt động *</Label>
                        <Input
                          id="register-areas"
                          value={registerForm.serviceAreas}
                          onChange={(event) =>
                            setRegisterForm((prev) => ({ ...prev, serviceAreas: event.target.value }))
                          }
                          placeholder="Quận 1, Hội An, Đà Lạt"
                          required
                        />
                        <div className="mt-3 space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {parseList(registerForm.serviceAreas).map((area) => (
                              <Badge key={area} variant="secondary" className="flex items-center gap-1 rounded-full">
                                {area}
                                <button
                                  type="button"
                                  aria-label={`Xóa ${area}`}
                                  className="text-xs"
                                  onClick={() => handleRegisterChipRemove("serviceAreas", area)}
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {SERVICE_AREA_SUGGESTIONS.map((area) => (
                              <Button
                                key={area}
                                type="button"
                                variant="outline"
                                size="sm"
                                className="rounded-full text-xs"
                                onClick={() => handleRegisterChipAdd("serviceAreas", area)}
                              >
                                {area}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-specialties">Chủ đề trải nghiệm *</Label>
                      <Input
                        id="register-specialties"
                        value={registerForm.specialties}
                        onChange={(event) => setRegisterForm((prev) => ({ ...prev, specialties: event.target.value }))}
                        placeholder="Ẩm thực, Văn hoá, Adventure"
                        required
                      />
                      <div className="mt-3 space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {parseList(registerForm.specialties).map((topic) => (
                            <Badge key={topic} variant="secondary" className="flex items-center gap-1 rounded-full">
                              {topic}
                              <button
                                type="button"
                                aria-label={`Xóa ${topic}`}
                                className="text-xs"
                                onClick={() => handleRegisterChipRemove("specialties", topic)}
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {SPECIALTY_SUGGESTIONS.map((topic) => (
                            <Button
                              key={topic}
                              type="button"
                              variant="outline"
                              size="sm"
                              className="rounded-full text-xs"
                              onClick={() => handleRegisterChipAdd("specialties", topic)}
                            >
                              {topic}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-introduction">Giới thiệu bản thân *</Label>
                      <Textarea
                        id="register-introduction"
                        rows={4}
                        value={registerForm.introduction}
                        onChange={(event) =>
                          setRegisterForm((prev) => ({ ...prev, introduction: event.target.value }))
                        }
                        placeholder="Hãy kể câu chuyện và phong cách dẫn tour của bạn."
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-experience">Kinh nghiệm & thành tích *</Label>
                      <Textarea
                        id="register-experience"
                        rows={4}
                        value={registerForm.experienceSummary}
                        onChange={(event) =>
                          setRegisterForm((prev) => ({ ...prev, experienceSummary: event.target.value }))
                        }
                        placeholder="Ví dụ: 5 năm dẫn tour ẩm thực tại Hội An..."
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-availability">Ghi chú lịch trình (tuỳ chọn)</Label>
                      <Textarea
                        id="register-availability"
                        rows={3}
                        value={registerForm.availabilityNotes}
                        onChange={(event) =>
                          setRegisterForm((prev) => ({ ...prev, availabilityNotes: event.target.value }))
                        }
                        placeholder="Sẵn sàng dẫn tour cuối tuần, buổi tối..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-portfolio">Portfolio / Social (tuỳ chọn)</Label>
                      <Input
                        id="register-portfolio"
                        value={registerForm.portfolioLinks}
                        onChange={(event) =>
                          setRegisterForm((prev) => ({ ...prev, portfolioLinks: event.target.value }))
                        }
                        placeholder="https://instagram.com/..., https://youtube.com/..."
                      />
                      <p className="text-xs text-muted-foreground">Tối đa 5 liên kết, phân tách bằng dấu phẩy.</p>
                    </div>

                    <div className="rounded-2xl border border-dashed border-primary/40 bg-gradient-to-r from-emerald-50/80 to-white p-5 shadow-sm">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4 text-sm">
                        <Checkbox
                          id="register-subscription"
                          checked={registerForm.subscriptionAcknowledged}
                          onCheckedChange={(checked) =>
                            setRegisterForm((prev) => ({ ...prev, subscriptionAcknowledged: checked === true }))
                          }
                          className="mt-1"
                        />
                        <div className="space-y-2 text-muted-foreground">
                          <Label htmlFor="register-subscription" className="text-base font-semibold text-foreground">
                            Tôi đồng ý với phí thành viên hướng dẫn viên{" "}
                            <span className="text-primary">{formatCurrency(MONTHLY_FEE)}/tháng</span> và hoa hồng nền tảng{" "}
                            <span className="text-primary">{Math.round(COMMISSION_RATE * 100)}%</span>.
                          </Label>
                          <p>
                            LuxeStay sẽ khấu trừ tự động trước khi thanh toán thu nhập và gửi hóa đơn điện tử qua email đăng ký.
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                        <p>• Nhận mentoring 1-1 để thiết kế trải nghiệm đạt chuẩn LuxeStay.</p>
                        <p>• Quy trình đảm bảo an toàn, bảo hiểm trách nhiệm cho mọi chuyến đi.</p>
                      </div>
                    </div>

                    {registerForm.subscriptionAcknowledged ? (
                      <div className="rounded-2xl border border-dashed border-primary/40 bg-white/80 p-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                        <Image
                          src={registerGuideQrUrl}
                          alt="Mã QR thanh toán phí hướng dẫn viên"
                          width={180}
                          height={180}
                          className="rounded-xl border border-primary/20 bg-white p-2"
                        />
                        <div className="space-y-2 text-sm">
                          <p className="font-semibold text-foreground">Quét VietQR để thanh toán phí {formatCurrency(MONTHLY_FEE)}</p>
                          <p>Ngân hàng: <strong>{GUIDE_BANK_INFO.bankName}</strong></p>
                          <p>Chủ tài khoản: <strong>{GUIDE_BANK_INFO.accountName}</strong></p>
                          <p>Số tài khoản: <strong>{GUIDE_BANK_INFO.accountNumber}</strong></p>
                          <p>Mã tham chiếu: <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">{registerGuideReference}</code></p>
                          <p className="text-xs text-muted-foreground">
                            Vui lòng giữ lại biên lai chuyển khoản. Chúng tôi sẽ kích hoạt ngay khi hồ sơ được duyệt và thanh toán được xác nhận.
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {registerError ? <p className="text-sm text-red-600">{registerError}</p> : null}

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <Button type="submit" size="lg" disabled={registerSubmitting}>
                        {registerSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Đăng ký & gửi hồ sơ
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        Tài khoản sẽ được kích hoạt khi hồ sơ được duyệt. Bạn có thể đăng nhập để theo dõi trạng thái bất cứ lúc nào.
                      </p>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
