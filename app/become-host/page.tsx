"use client"

import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Loader2, ShieldCheck } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthModal } from "@/hooks/use-auth-modal"
import { createVietQRUrl, formatTransferReference, getBankTransferInfo } from "@/lib/payments"

interface RegionOption {
  slug: string
  name: string
  state?: string | null
  country?: string | null
  listingCount: number
}

const HOST_POSITIONING_OPTIONS = [
  {
    value: "wellness",
    label: "Retreat chăm sóc sức khỏe",
    intro: "Homestay tập trung vào trải nghiệm detox, yoga và thiền với không gian xanh và menu lành mạnh.",
    experience: "Có 4 năm vận hành các retreat nhỏ và hợp tác với những huấn luyện viên yoga quốc tế.",
  },
  {
    value: "city-lux",
    label: "Căn hộ hạng sang nội đô",
    intro: "Chuỗi căn hộ cao cấp nằm tại trung tâm, hướng tới khách công tác và workation dài ngày.",
    experience: "Đội ngũ có kinh nghiệm vận hành 20+ căn hộ dịch vụ, tỷ lệ lấp đầy trung bình 85%.",
  },
  {
    value: "heritage",
    label: "Trải nghiệm di sản bản địa",
    intro: "Không gian lưu trú trong nhà cổ/biệt thự phong cách Đông Dương, kể câu chuyện văn hóa bản địa.",
    experience: "Hợp tác cùng nghệ nhân địa phương, tổ chức workshop thủ công và tour khám phá di sản.",
  },
]

const HOST_MAINTENANCE_FEE = 299_000
const HOST_BANK_INFO = getBankTransferInfo()

interface HostApplicationResponse {
  application?: {
    id: string
    status: "PENDING" | "APPROVED" | "REJECTED"
    locationName: string
    locationSlug: string
    introduction?: string | null
    experience?: string | null
    adminNotes?: string | null
    reviewedAt?: string | null
    createdAt: string
  }
}

export default function BecomeHostPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const authModal = useAuthModal()
  const [regions, setRegions] = useState<RegionOption[]>([])
  const [regionsLoading, setRegionsLoading] = useState(true)
  const [applicationLoading, setApplicationLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [existingApplication, setExistingApplication] = useState<HostApplicationResponse["application"] | null>(null)

  const [form, setForm] = useState({
    locationSlug: "",
    introduction: "",
    experience: "",
    maintenanceAcknowledged: false,
  })
  const [introTemplate, setIntroTemplate] = useState<string | undefined>(undefined)

  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    locationSlug: "",
    introduction: "",
    experience: "",
    maintenanceAcknowledged: false,
  })
  const [registerIntroTemplate, setRegisterIntroTemplate] = useState<string | undefined>(undefined)
  const [registerSubmitting, setRegisterSubmitting] = useState(false)
  const [registerError, setRegisterError] = useState<string | null>(null)
  const hostReference = useMemo(() => {
    const identifier = session?.user?.id ?? session?.user?.email ?? session?.user?.name ?? "HOST299K"
    return formatTransferReference("SERVICE", identifier)
  }, [session?.user?.email, session?.user?.id, session?.user?.name])
  const hostQrUrl = useMemo(() => createVietQRUrl(HOST_MAINTENANCE_FEE, hostReference), [hostReference])
  const registerHostReference = useMemo(() => {
    const identifier = registerForm.email || registerForm.phone || registerForm.name || "HOST299K"
    return formatTransferReference("SERVICE", identifier)
  }, [registerForm.email, registerForm.phone, registerForm.name])
  const registerHostQrUrl = useMemo(
    () => createVietQRUrl(HOST_MAINTENANCE_FEE, registerHostReference),
    [registerHostReference],
  )

  const handleIntroTemplateSelect = (value: string) => {
    if (value === "__custom") {
      setIntroTemplate(undefined)
      return
    }
    const template = HOST_POSITIONING_OPTIONS.find((option) => option.value === value)
    if (!template) return
    setIntroTemplate(value)
    setForm((prev) => ({
      ...prev,
      introduction: template.intro,
      experience: template.experience,
    }))
  }

  const handleRegisterIntroTemplateSelect = (value: string) => {
    if (value === "__custom") {
      setRegisterIntroTemplate(undefined)
      return
    }
    const template = HOST_POSITIONING_OPTIONS.find((option) => option.value === value)
    if (!template) return
    setRegisterIntroTemplate(value)
    setRegisterForm((prev) => ({
      ...prev,
      introduction: template.intro,
      experience: template.experience,
    }))
  }

  useEffect(() => {
    const loadRegions = async () => {
      try {
        setRegionsLoading(true)
        const response = await fetch("/api/locations/regions", { cache: "no-store" })
        if (!response.ok) {
          throw new Error("Failed to load regions")
        }
        const payload = await response.json()
        const options: RegionOption[] = Array.isArray(payload?.regions) ? payload.regions : []
        setRegions(
          options.sort((a, b) => a.name.localeCompare(b.name, "vi", { sensitivity: "base" })),
        )
      } catch (err) {
        console.error("Load regions error:", err)
      } finally {
        setRegionsLoading(false)
      }
    }

    void loadRegions()
  }, [])

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return

    const loadApplication = async () => {
      try {
        setApplicationLoading(true)
        const response = await fetch("/api/host/applications", { cache: "no-store" })
        if (!response.ok) return
        const { application } = await response.json()
        if (application) {
          setExistingApplication(application)
          setForm((prev) => ({
            ...prev,
            locationSlug: application.locationSlug,
            introduction: application.introduction ?? "",
            experience: application.experience ?? "",
          }))
        }
      } catch (err) {
        console.error("Load host application error:", err)
        setError("Không thể tải thông tin hồ sơ host hiện tại.")
      } finally {
        setApplicationLoading(false)
      }
    }

    void loadApplication()
  }, [session, status])

  const selectedRegion = useMemo(
    () => regions.find((region) => region.slug === form.locationSlug),
    [regions, form.locationSlug],
  )

  const selectedRegisterRegion = useMemo(
    () => regions.find((region) => region.slug === registerForm.locationSlug),
    [regions, registerForm.locationSlug],
  )

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setError(null)

    if (!form.locationSlug) {
      setError("Vui lòng chọn khu vực bạn muốn khai thác homestay.")
      return
    }

    if (!form.maintenanceAcknowledged) {
      setError("Bạn cần đồng ý với chính sách phí duy trì và lệ phí nền tảng.")
      return
    }

    const isUpdate = Boolean(existingApplication)

    try {
      setSubmitting(true)
      const res = await fetch("/api/host/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationSlug: form.locationSlug,
          locationName: selectedRegion?.name || form.locationSlug,
          introduction: form.introduction,
          experience: form.experience,
          maintenanceAcknowledged: form.maintenanceAcknowledged,
          paymentReference: hostReference,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Không thể gửi yêu cầu")
      }

      setExistingApplication(data.application)
      router.push(
        `/apply/success?type=host&reference=${encodeURIComponent(hostReference)}&mode=${isUpdate ? "update" : "new"}`,
      )
      return
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setRegisterError(null)
    setRegisterError(null)

    if (!registerForm.locationSlug) {
      setRegisterError("Vui lòng chọn khu vực homestay.")
      return
    }

    if (!registerForm.maintenanceAcknowledged) {
      setRegisterError("Bạn cần đồng ý với chính sách phí duy trì và lệ phí nền tảng.")
      return
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setRegisterError("Mật khẩu xác nhận không khớp.")
      return
    }

    try {
      setRegisterSubmitting(true)
      const response = await fetch("/api/host/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: registerForm.name,
          email: registerForm.email,
          phone: registerForm.phone,
          password: registerForm.password,
          introduction: registerForm.introduction,
          experience: registerForm.experience,
          locationSlug: registerForm.locationSlug,
          locationName: selectedRegisterRegion?.name || registerForm.locationSlug,
          maintenanceAcknowledged: registerForm.maintenanceAcknowledged,
          paymentReference: registerHostReference,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Không thể đăng ký host.")
      }

      router.push(
        `/apply/success?type=host&reference=${encodeURIComponent(registerHostReference)}&mode=register`,
      )
      return
    } catch (err) {
      setRegisterError((err as Error).message)
    } finally {
      setRegisterSubmitting(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-muted/30">
          <div className="container mx-auto px-4 lg:px-8 py-12">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="text-center space-y-3">
                <h1 className="font-serif text-4xl font-bold text-foreground">Trở thành chủ nhà LuxeStay</h1>
                <p className="text-muted-foreground">
                  Tạo tài khoản host mới và gửi hồ sơ để đội ngũ LuxeStay duyệt trong vòng 24-48 giờ. Bạn sẽ nhận được
                  email hướng dẫn sau khi được phê duyệt.
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Đăng ký tài khoản host</CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-5 text-left" onSubmit={handleRegister}>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="register-name">Họ và tên</Label>
                        <Input
                          id="register-name"
                          value={registerForm.name}
                          onChange={(event) => setRegisterForm((prev) => ({ ...prev, name: event.target.value }))}
                          placeholder="Nguyễn Minh Anh"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-email">Email</Label>
                        <Input
                          id="register-email"
                          type="email"
                          value={registerForm.email}
                          onChange={(event) => setRegisterForm((prev) => ({ ...prev, email: event.target.value }))}
                          placeholder="host@example.com"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="register-phone">Số điện thoại</Label>
                        <Input
                          id="register-phone"
                          value={registerForm.phone}
                          onChange={(event) => setRegisterForm((prev) => ({ ...prev, phone: event.target.value }))}
                          placeholder="0987 654 321"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-location">Khu vực homestay</Label>
                        <Select
                          value={registerForm.locationSlug}
                          onValueChange={(value) => setRegisterForm((prev) => ({ ...prev, locationSlug: value }))}
                          disabled={regionsLoading}
                        >
                          <SelectTrigger id="register-location">
                            <SelectValue placeholder={regionsLoading ? "Đang tải..." : "Chọn tỉnh/thành phố"} />
                          </SelectTrigger>
                          <SelectContent>
                            {regions.map((region) => (
                              <SelectItem key={region.slug} value={region.slug}>
                                {region.name}
                                {region.country ? ` • ${region.country}` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="register-password">Mật khẩu</Label>
                        <Input
                          id="register-password"
                          type="password"
                          value={registerForm.password}
                          onChange={(event) => setRegisterForm((prev) => ({ ...prev, password: event.target.value }))}
                          placeholder="Tối thiểu 8 ký tự"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-confirm">Xác nhận mật khẩu</Label>
                        <Input
                          id="register-confirm"
                          type="password"
                          value={registerForm.confirmPassword}
                          onChange={(event) =>
                            setRegisterForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
                          }
                          placeholder="Nhập lại mật khẩu"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <Label>Giới thiệu homestay</Label>
                        <Select value={registerIntroTemplate} onValueChange={handleRegisterIntroTemplateSelect}>
                          <SelectTrigger className="w-full sm:w-56 text-xs">
                            <SelectValue placeholder="Chọn mẫu mô tả nhanh" />
                          </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__custom">Tự nhập mô tả</SelectItem>
                          {HOST_POSITIONING_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Textarea
                        rows={4}
                        value={registerForm.introduction}
                        onChange={(event) =>
                          setRegisterForm((prev) => ({ ...prev, introduction: event.target.value }))
                        }
                        placeholder="Mô tả vị trí, tiện nghi và trải nghiệm mà homestay của bạn mang lại."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Kinh nghiệm & đội ngũ</Label>
                      <Textarea
                        rows={3}
                        value={registerForm.experience}
                        onChange={(event) =>
                          setRegisterForm((prev) => ({ ...prev, experience: event.target.value }))
                        }
                        placeholder="Bạn đã vận hành homestay bao lâu? Có đội ngũ hỗ trợ nào không?"
                      />
                    </div>

                    <div className="flex items-start gap-2 rounded-md border border-dashed border-primary/40 bg-primary/5 p-4">
                      <Checkbox
                        id="register-maintenance"
                        checked={registerForm.maintenanceAcknowledged}
                        onCheckedChange={(checked) =>
                          setRegisterForm((prev) => ({ ...prev, maintenanceAcknowledged: checked === true }))
                        }
                      />
                      <Label htmlFor="register-maintenance" className="text-sm leading-6 text-muted-foreground">
                        Tôi đồng ý với phí duy trì nền tảng <strong>299.000đ/tháng</strong> và lệ phí dịch vụ{" "}
                        <strong>10%/mỗi kỳ lưu trú</strong>. LuxeStay sẽ khấu trừ tự động trước khi thanh toán về ví
                        host.
                      </Label>
                    </div>

                    {registerForm.maintenanceAcknowledged ? (
                      <div className="rounded-2xl border border-dashed border-primary/40 bg-white/80 p-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                        <Image
                          src={registerHostQrUrl}
                          alt="Mã QR thanh toán phí duy trì host"
                          width={180}
                          height={180}
                          className="rounded-xl border border-primary/20 bg-white p-2"
                        />
                        <div className="space-y-2 text-sm">
                          <p className="font-semibold text-foreground">
                            Quét VietQR để thanh toán phí {HOST_MAINTENANCE_FEE.toLocaleString("vi-VN")}đ/tháng
                          </p>
                          <p>Ngân hàng: <strong>{HOST_BANK_INFO.bankName}</strong></p>
                          <p>Chủ tài khoản: <strong>{HOST_BANK_INFO.accountName}</strong></p>
                          <p>Số tài khoản: <strong>{HOST_BANK_INFO.accountNumber}</strong></p>
                          <p>Mã tham chiếu: <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">{registerHostReference}</code></p>
                          <p className="text-xs text-muted-foreground">
                            Ghi rõ mã tham chiếu hoặc gửi biên lai tại mục hỗ trợ để được kích hoạt nhanh sau khi hồ sơ được duyệt.
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {registerError && <p className="text-sm text-red-600">{registerError}</p>}

                    <div className="flex items-center justify-between">
                      <Button type="submit" disabled={registerSubmitting || regionsLoading}>
                        {registerSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Đăng ký host
                      </Button>
                      <div className="text-sm text-muted-foreground">
                        Đã có tài khoản?{" "}
                        <Button variant="link" className="px-1" onClick={authModal.openLogin}>
                          Đăng nhập
                        </Button>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8 py-10">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center space-y-3">
              <h1 className="font-serif text-4xl font-bold text-foreground">Trở thành chủ nhà LuxeStay</h1>
              <p className="text-muted-foreground">
                Hoàn thiện hồ sơ bên dưới để chúng tôi hiểu hơn về homestay và khu vực bạn vận hành. LuxeStay áp dụng lệ phí nền tảng 10% trên mỗi kỳ lưu trú và phí duy trì 299.000đ/tháng cho mỗi host hoạt động.
              </p>
            </div>

            {existingApplication && (
              <Card className="border-primary/40 bg-primary/5">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-primary">
                      Trạng thái hồ sơ: {existingApplication.status === "PENDING" ? "Đang duyệt" : existingApplication.status === "APPROVED" ? "Đã phê duyệt" : "Bị từ chối"}
                    </CardTitle>
                  </div>
                  <Badge variant={existingApplication.status === "APPROVED" ? "default" : existingApplication.status === "REJECTED" ? "destructive" : "outline"}>
                    {existingApplication.status}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>Khu vực đăng ký: <strong>{existingApplication.locationName}</strong></p>
                  <p>Gửi lúc: {new Date(existingApplication.createdAt).toLocaleString("vi-VN")}</p>
                  {existingApplication.reviewedAt && (
                    <p>Được xử lý vào: {new Date(existingApplication.reviewedAt).toLocaleString("vi-VN")}</p>
                  )}
                  {existingApplication.adminNotes && (
                    <p className="text-red-600">Ghi chú từ admin: {existingApplication.adminNotes}</p>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Thông tin đăng ký</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Khu vực homestay</label>
                    <Select
                      value={form.locationSlug}
                      onValueChange={(value) => setForm((prev) => ({ ...prev, locationSlug: value }))}
                      disabled={applicationLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn tỉnh/thành phố" />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map((region) => (
                          <SelectItem key={region.slug} value={region.slug}>
                            {region.name}
                            {region.country ? ` • ${region.country}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <label className="text-sm font-medium text-foreground">Giới thiệu ngắn gọn về chỗ nghỉ</label>
                      <Select value={introTemplate} onValueChange={handleIntroTemplateSelect}>
                        <SelectTrigger className="w-full sm:w-56 text-xs">
                          <SelectValue placeholder="Chọn mẫu mô tả nhanh" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__custom">Tự nhập mô tả</SelectItem>
                          {HOST_POSITIONING_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Textarea
                      placeholder="Mô tả điểm nổi bật, đối tượng khách hàng lý tưởng và kinh nghiệm vận hành hiện tại."
                      value={form.introduction}
                      onChange={(event) => setForm((prev) => ({ ...prev, introduction: event.target.value }))}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Kinh nghiệm & đội ngũ</label>
                    <Textarea
                      placeholder="Bạn đã vận hành homestay bao lâu? Có đội ngũ hỗ trợ nào không?"
                      value={form.experience}
                      onChange={(event) => setForm((prev) => ({ ...prev, experience: event.target.value }))}
                      rows={4}
                    />
                  </div>

                  <div className="flex items-start gap-2 rounded-md border border-dashed border-primary/40 bg-primary/5 p-4">
                    <Checkbox
                      id="maintenanceAcknowledged"
                      checked={form.maintenanceAcknowledged}
                      onCheckedChange={(checked) =>
                        setForm((prev) => ({ ...prev, maintenanceAcknowledged: checked === true }))
                      }
                    />
                    <label htmlFor="maintenanceAcknowledged" className="text-sm leading-6 text-muted-foreground">
                      Tôi đồng ý với phí duy trì nền tảng <strong>299.000đ/tháng</strong> và lệ phí dịch vụ <strong>10%/mỗi kỳ lưu trú</strong>. LuxeStay sẽ khấu trừ tự động trước khi thanh toán về ví host.
                    </label>
                  </div>

                  {form.maintenanceAcknowledged ? (
                      <div className="rounded-2xl border border-dashed border-primary/40 bg-white/80 p-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                        <Image
                          src={hostQrUrl}
                          alt="Mã QR thanh toán phí duy trì host"
                          width={180}
                          height={180}
                          className="rounded-xl border border-primary/20 bg-white p-2"
                        />
                      <div className="space-y-2 text-sm">
                        <p className="font-semibold text-foreground">
                          Quét VietQR để thanh toán phí {HOST_MAINTENANCE_FEE.toLocaleString("vi-VN")}đ/tháng
                        </p>
                        <p>Ngân hàng: <strong>{HOST_BANK_INFO.bankName}</strong></p>
                        <p>Chủ tài khoản: <strong>{HOST_BANK_INFO.accountName}</strong></p>
                        <p>Số tài khoản: <strong>{HOST_BANK_INFO.accountNumber}</strong></p>
                        <p>Mã tham chiếu: <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">{hostReference}</code></p>
                        <p className="text-xs text-muted-foreground">
                          Ghi rõ mã tham chiếu khi chuyển khoản để đội ngũ đối soát nhanh sau khi hồ sơ host được duyệt.
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <div className="flex items-center gap-3">
                    <Button type="submit" disabled={submitting}>
                      {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Gửi yêu cầu
                    </Button>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Xét duyệt trong 24-48 giờ
                    </Badge>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
