"use server"

import { Resend } from "resend"
import nodemailer from "nodemailer"

// Initialize providers
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const smtpHost = process.env.SMTP_HOST || ""
const smtpUser = process.env.SMTP_USER || ""
const smtpPass = process.env.SMTP_PASS || ""
const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465
const smtpFromEmail = process.env.SMTP_FROM_EMAIL || (smtpUser ? `LuxeStay <${smtpUser}>` : "LuxeStay <no-reply@luxestay.vn>")

export interface BookingConfirmationData {
  guestName: string
  guestEmail: string
  listingTitle: string
  listingAddress: string
  checkIn: Date
  checkOut: Date
  nights: number
  guests: {
    adults: number
    children: number
    infants: number
  }
  totalPrice: number
  currency: string
  bookingId: string
  hostName: string
  hostEmail: string
}

export interface BookingCancellationData {
  guestName: string
  guestEmail: string
  listingTitle: string
  checkIn: Date
  checkOut: Date
  bookingId: string
  refundAmount?: number
  cancellationReason?: string
}

export interface VerificationEmailData {
  name: string
  email: string
  verificationToken: string
}

export interface PasswordResetData {
  name: string
  email: string
  resetToken: string
}

export interface ReviewReminderData {
  guestName: string
  guestEmail: string
  listingTitle: string
  bookingId: string
  checkOut: Date
}

export interface HostApplicationStatusEmailData {
  email?: string
  name: string
  status: "approved" | "rejected"
  locationName: string
  notes?: string
}

export interface GuideApplicationStatusEmailData {
  email?: string
  name: string
  status: "approved" | "rejected" | "needs_revision"
  notes?: string
  subscriptionFee: number
  commissionRate: number
}

const transporter =
  smtpHost && smtpUser && smtpPass
    ? nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      })
    : null

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://luxestay.vn"

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(date)

const formatCurrency = (amount: number, currency = "VND") =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency }).format(amount)

type EmailPayload = {
  to: string | string[]
  subject: string
  html: string
  cc?: string | string[]
  bcc?: string | string[]
  from?: string
}

const listify = (value?: string | string[]) => {
  if (!value) return undefined
  return Array.isArray(value) ? value : [value]
}

async function deliverEmail(payload: EmailPayload) {
  const { to, cc, bcc, subject, html } = payload
  const fromAddress = payload.from ?? smtpFromEmail
  const toList = listify(to)
  const ccList = listify(cc)
  const bccList = listify(bcc)

  if (resend) {
    try {
      const { error } = await resend.emails.send({
        from: fromAddress,
        to: toList!,
        cc: ccList,
        bcc: bccList,
        subject,
        html,
      })
      if (!error) {
        return { success: true as const }
      }
      console.warn("Resend error", error)
    } catch (error) {
      console.warn("Resend send failure", error)
    }
  }

  if (transporter) {
    await transporter.sendMail({
      from: fromAddress,
      to: toList?.join(", "),
      cc: ccList?.join(", "),
      bcc: bccList?.join(", "),
      subject,
      html,
    })
    return { success: true as const }
  }

  console.warn("Email service not configured. Set RESEND_API_KEY or SMTP_* environment variables.")
  return { success: false as const, error: new Error("Email service not configured") }
}

type EmailLayoutOptions = {
  heroTitle: string
  heroSubtitle?: string
  previewText?: string
  accent?: string
  body: string
}

const renderEmailLayout = ({ heroTitle, heroSubtitle, previewText, accent = "#0ea5e9", body }: EmailLayoutOptions) => {
  const gradient = `linear-gradient(135deg, ${accent}, #7c3aed)`
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${heroTitle}</title>
  <style>
    body { margin:0; background:#eef2ff; font-family:'Inter','SF Pro Display',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; color:#0f172a; }
    .preview-text { display:none; visibility:hidden; opacity:0; height:0; }
    .email-wrapper { max-width:640px; margin:32px auto; border-radius:28px; overflow:hidden; background:#ffffff; box-shadow:0 25px 80px rgba(15,23,42,0.12); }
    .email-hero { padding:48px 40px; background:${gradient}; color:#fff; text-align:center; }
    .email-hero h1 { margin:0; font-size:30px; letter-spacing:-0.02em; }
    .email-hero p { margin:12px auto 0; max-width:420px; font-size:16px; color:rgba(255,255,255,0.92); }
    .email-body { padding:32px 32px 40px; background:#fff; }
    .email-card { padding:24px; border:1px solid #e4e7fb; border-radius:20px; background:#f9fafb; margin-bottom:16px; }
    .email-card h3 { margin:0 0 12px; font-size:16px; color:#0f172a; }
    .email-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:16px; }
    .email-label { margin:0; font-size:12px; text-transform:uppercase; letter-spacing:0.06em; color:#94a3b8; }
    .email-value { margin:4px 0 0; font-size:16px; font-weight:600; color:#0f172a; }
    .cta-button { display:inline-block; padding:14px 32px; border-radius:999px; background:${accent}; color:#fff; font-weight:600; text-decoration:none; }
    .email-footer { margin-top:32px; text-align:center; font-size:12px; color:#94a3b8; }
  </style>
</head>
<body>
  <span class="preview-text">${previewText ?? ""}</span>
  <div class="email-wrapper">
    <div class="email-hero">
      <h1>${heroTitle}</h1>
      ${heroSubtitle ? `<p>${heroSubtitle}</p>` : ""}
    </div>
    <div class="email-body">
      ${body}
      <div class="email-footer">
        <p>© ${new Date().getFullYear()} LuxeStay. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`
}

const bookingConfirmationTemplate = (data: BookingConfirmationData) => {
  const body = `
    <div class="email-card">
      <p>Xin chào <strong>${data.guestName}</strong>,</p>
      <p>Đặt phòng của bạn tại <strong>${data.listingTitle}</strong> đã được xác nhận. Đội ngũ LuxeStay cùng chủ nhà <strong>${data.hostName}</strong> đang chuẩn bị mọi thứ tốt nhất cho kỳ nghỉ của bạn.</p>
      <div class="email-grid" style="margin-top:16px;">
        <div>
          <p class="email-label">Mã đặt phòng</p>
          <p class="email-value">${data.bookingId}</p>
        </div>
        <div>
          <p class="email-label">Địa chỉ</p>
          <p class="email-value">${data.listingAddress}</p>
        </div>
      </div>
    </div>

    <div class="email-card">
      <h3>Chi tiết chuyến đi</h3>
      <div class="email-grid">
        <div>
          <p class="email-label">Nhận phòng</p>
          <p class="email-value">${formatDate(data.checkIn)}</p>
        </div>
        <div>
          <p class="email-label">Trả phòng</p>
          <p class="email-value">${formatDate(data.checkOut)}</p>
        </div>
        <div>
          <p class="email-label">Số đêm</p>
          <p class="email-value">${data.nights} đêm</p>
        </div>
        <div>
          <p class="email-label">Khách</p>
          <p class="email-value">
            ${data.guests.adults} người lớn${data.guests.children ? ` · ${data.guests.children} trẻ em` : ""}${
              data.guests.infants ? ` · ${data.guests.infants} em bé` : ""
            }
          </p>
        </div>
      </div>
    </div>

    <div class="email-card">
      <h3>Tổng thanh toán</h3>
      <p class="email-value">${formatCurrency(data.totalPrice, data.currency)}</p>
    </div>

    <div style="text-align:center; margin-top:28px;">
      <a class="cta-button" href="${appUrl}/trips/${data.bookingId}" target="_blank" rel="noreferrer">
        Xem chi tiết chuyến đi
      </a>
    </div>
  `

  return renderEmailLayout({
    heroTitle: "Đặt phòng của bạn đã sẵn sàng",
    heroSubtitle: `Chuyến đi đến ${data.listingTitle} đã được xác nhận.`,
    previewText: `Xác nhận đặt phòng #${data.bookingId}`,
    accent: "#0ea5e9",
    body,
  })
}

const bookingCancellationTemplate = (data: BookingCancellationData) => {
  const body = `
    <div class="email-card">
      <p>Xin chào <strong>${data.guestName}</strong>,</p>
      <p>Chúng tôi xác nhận đặt phòng tại <strong>${data.listingTitle}</strong> đã được hủy theo yêu cầu của bạn.</p>
      ${
        data.cancellationReason
          ? `<p class="email-label" style="margin-top:12px;">Lý do</p><p class="email-value">${data.cancellationReason}</p>`
          : ""
      }
    </div>

    <div class="email-card">
      <div class="email-grid">
        <div>
          <p class="email-label">Nhận phòng</p>
          <p class="email-value">${formatDate(data.checkIn)}</p>
        </div>
        <div>
          <p class="email-label">Trả phòng</p>
          <p class="email-value">${formatDate(data.checkOut)}</p>
        </div>
      </div>
      ${
        data.refundAmount
          ? `<div style="margin-top:16px;">
              <p class="email-label">Số tiền hoàn lại</p>
              <p class="email-value" style="color:#059669;">${formatCurrency(data.refundAmount)}</p>
              <p style="font-size:13px;color:#64748b;">Tiền sẽ hoàn về tài khoản trong 3-5 ngày làm việc.</p>
            </div>`
          : ""
      }
    </div>

    <div class="email-card">
      <p class="email-label">Gợi ý</p>
      <p class="email-value">Khám phá thêm hơn 5.000 homestay được tuyển chọn kỹ từ LuxeStay.</p>
    </div>

    <div style="text-align:center; margin-top:28px;">
      <a class="cta-button" href="${appUrl}/search" target="_blank" rel="noreferrer">
        Tìm chỗ ở khác
      </a>
    </div>
  `

  return renderEmailLayout({
    heroTitle: "Đặt phòng đã được hủy",
    heroSubtitle: "Hy vọng sẽ đồng hành cùng bạn trong kỳ nghỉ tiếp theo.",
    previewText: `Đặt phòng ${data.listingTitle} đã được hủy`,
    accent: "#f97316",
    body,
  })
}

const verificationEmailTemplate = (data: VerificationEmailData) => {
  const verifyLink = `${appUrl}/verify-email?token=${data.verificationToken}`
  const body = `
    <div class="email-card">
      <p>Xin chào <strong>${data.name}</strong>,</p>
      <p>Cảm ơn bạn đã đăng ký LuxeStay. Vui lòng xác thực email để kích hoạt tài khoản.</p>
      <div style="text-align:center; margin:24px 0 12px;">
        <a class="cta-button" href="${verifyLink}" target="_blank" rel="noreferrer">
          Xác thực email
        </a>
      </div>
      <p class="email-label">Hoặc truy cập</p>
      <p class="email-value" style="word-break:break-all;">${verifyLink}</p>
      <p style="margin-top:16px;font-size:13px;color:#64748b;">Link có hiệu lực trong 24 giờ.</p>
    </div>
  `

  return renderEmailLayout({
    heroTitle: "Xác thực tài khoản của bạn",
    heroSubtitle: "Chỉ còn một bước nhỏ để khám phá các trải nghiệm LuxeStay.",
    previewText: "Hoàn tất xác thực tài khoản LuxeStay",
    accent: "#7c3aed",
    body,
  })
}

const passwordResetTemplate = (data: PasswordResetData) => {
  const resetLink = `${appUrl}/reset-password?token=${data.resetToken}`
  const body = `
    <div class="email-card">
      <p>Xin chào <strong>${data.name}</strong>,</p>
      <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nếu đây là bạn, hãy bấm vào nút bên dưới.</p>
      <div style="text-align:center; margin:24px 0 12px;">
        <a class="cta-button" href="${resetLink}" target="_blank" rel="noreferrer">
          Đặt lại mật khẩu
        </a>
      </div>
      <p class="email-label">Hoặc truy cập</p>
      <p class="email-value" style="word-break:break-all;">${resetLink}</p>
      <p style="margin-top:16px;font-size:13px;color:#64748b;">Link sẽ hết hạn trong 60 phút.</p>
    </div>
  `

  return renderEmailLayout({
    heroTitle: "Đặt lại mật khẩu",
    heroSubtitle: "Chúng tôi luôn bảo vệ an toàn tài khoản của bạn.",
    previewText: "Yêu cầu đặt lại mật khẩu LuxeStay",
    accent: "#ec4899",
    body,
  })
}

const reviewReminderTemplate = (data: ReviewReminderData) => {
  const reviewLink = `${appUrl}/trips/${data.bookingId}/review`
  const body = `
    <div class="email-card">
      <p>Xin chào <strong>${data.guestName}</strong>,</p>
      <p>Hy vọng bạn đã có trải nghiệm tuyệt vời tại <strong>${data.listingTitle}</strong>. Chia sẻ cảm nhận của bạn để giúp cộng đồng LuxeStay ngày càng tốt hơn!</p>
      <div style="text-align:center; margin:24px 0 12px;">
        <a class="cta-button" href="${reviewLink}" target="_blank" rel="noreferrer">
          Viết đánh giá ngay
        </a>
      </div>
      <div class="email-grid" style="margin-top:12px;">
        <div>
          <p class="email-label">Lợi ích</p>
          <p class="email-value">Giúp host cải thiện dịch vụ</p>
        </div>
        <div>
          <p class="email-label">Thời gian</p>
          <p class="email-value">Chỉ 1 phút</p>
        </div>
      </div>
    </div>
  `

  return renderEmailLayout({
    heroTitle: "Chia sẻ trải nghiệm của bạn",
    heroSubtitle: "Lời khuyên của bạn sẽ giúp hàng nghìn khách du lịch khác.",
    previewText: `Đánh giá chuyến đi tại ${data.listingTitle}`,
    accent: "#f97316",
    body,
  })
}

type MembershipEmailPendingData = {
  email?: string
  name?: string
  planName: string
  billingCycle: "MONTHLY" | "ANNUAL"
  amount: number
  referenceCode: string
  bankInfo: {
    bankName: string
    accountNumber: string
    accountName: string
    branch?: string | null
  }
}

type MembershipEmailActivatedData = {
  email?: string
  name?: string
  planName: string
  billingCycle: "MONTHLY" | "ANNUAL"
  startsAt: Date
  expiresAt: Date
  referenceCode?: string
}

const membershipPendingTemplate = (data: MembershipEmailPendingData) => {
  const cycleLabel = data.billingCycle === "MONTHLY" ? "Hàng tháng" : "Hàng năm"
  const body = `
    <div class="email-card">
      <p>Xin chào <strong>${data.name ?? "bạn"}</strong>,</p>
      <p>Chúng tôi đã nhận được yêu cầu chuyển khoản cho gói <strong>${data.planName}</strong>. Membership sẽ được kích hoạt ngay sau khi đội ngũ LuxeStay xác nhận giao dịch.</p>
      <div class="email-grid" style="margin-top:16px;">
        <div>
          <p class="email-label">Số tiền</p>
          <p class="email-value">${formatCurrency(data.amount)}</p>
        </div>
        <div>
          <p class="email-label">Kỳ hạn</p>
          <p class="email-value">${cycleLabel}</p>
        </div>
      </div>
    </div>
    <div class="email-card">
      <h3>Thông tin chuyển khoản</h3>
      <div class="email-grid">
        <div>
          <p class="email-label">Ngân hàng</p>
          <p class="email-value">${data.bankInfo.bankName}</p>
        </div>
        <div>
          <p class="email-label">Số tài khoản</p>
          <p class="email-value">${data.bankInfo.accountNumber}</p>
        </div>
      </div>
      <div class="email-grid" style="margin-top:12px;">
        <div>
          <p class="email-label">Chủ tài khoản</p>
          <p class="email-value">${data.bankInfo.accountName}</p>
        </div>
        <div>
          <p class="email-label">Nội dung chuyển khoản</p>
          <p class="email-value" style="word-break:break-all;">${data.referenceCode}</p>
        </div>
      </div>
      <p style="margin-top:16px;font-size:13px;color:#64748b;">Vui lòng giữ lại biên lai để hỗ trợ việc xác nhận nếu cần.</p>
    </div>
  `

  return renderEmailLayout({
    heroTitle: "Đã nhận chuyển khoản membership",
    heroSubtitle: "Chúng tôi sẽ kích hoạt ngay khi xác nhận giao dịch (tối đa 24 giờ làm việc).",
    previewText: "Membership đang chờ xác nhận",
    accent: "#0ea5e9",
    body,
  })
}

const membershipActivatedTemplate = (data: MembershipEmailActivatedData) => {
  const cycleLabel = data.billingCycle === "MONTHLY" ? "Hàng tháng" : "Hàng năm"
  const body = `
    <div class="email-card">
      <p>Xin chào <strong>${data.name ?? "bạn"}</strong>,</p>
      <p>Membership <strong>${data.planName}</strong> đã được kích hoạt. Bạn có thể sử dụng toàn bộ đặc quyền ngay từ bây giờ.</p>
      <div class="email-grid" style="margin-top:16px;">
        <div>
          <p class="email-label">Hiệu lực</p>
          <p class="email-value">${formatDate(data.startsAt)} - ${formatDate(data.expiresAt)}</p>
        </div>
        <div>
          <p class="email-label">Kỳ hạn</p>
          <p class="email-value">${cycleLabel}</p>
        </div>
      </div>
      ${
        data.referenceCode
          ? `<p class="email-label" style="margin-top:16px;">Mã tham chiếu</p><p class="email-value">${data.referenceCode}</p>`
          : ""
      }
    </div>
    <div style="text-align:center; margin-top:28px;">
      <a class="cta-button" href="${appUrl}/membership" target="_blank" rel="noreferrer">
        Xem quyền lợi của tôi
      </a>
    </div>
  `

  return renderEmailLayout({
    heroTitle: "Membership đã được kích hoạt",
    heroSubtitle: "Chúc bạn có những trải nghiệm đẳng cấp cùng LuxeStay.",
    previewText: "Membership của bạn đã hoạt động",
    accent: "#10b981",
    body,
  })
}

// ============================================
// EMAIL SENDING FUNCTIONS
// ============================================

export async function sendBookingConfirmationEmail(data: BookingConfirmationData) {
  return await deliverEmail({
    from: process.env.RESEND_FROM_EMAIL || "LuxeStay Bookings <bookings@luxestay.vn>",
    to: data.guestEmail,
    cc: data.hostEmail ? [data.hostEmail] : undefined,
    subject: `Xác nhận đặt phòng - ${data.listingTitle}`,
    html: bookingConfirmationTemplate(data),
  })
}

export async function sendHostApplicationStatusEmail(data: HostApplicationStatusEmailData) {
  if (!data.email) return { success: false as const, error: new Error("Missing host email") }

  const subject =
    data.status === "approved"
      ? "Yêu cầu trở thành host đã được phê duyệt"
      : "Yêu cầu trở thành host chưa thể phê duyệt"

  const description =
    data.status === "approved"
      ? `Chúc mừng! Bạn đã trở thành host tại ${data.locationName}. Hãy đăng bài và quản trị bookings ngay hôm nay.`
      : `Rất tiếc, yêu cầu host tại ${data.locationName} chưa thể phê duyệt. ${data.notes ?? ""}`

  const body = `
    <div class="email-card">
      <p>Xin chào <strong>${data.name}</strong>,</p>
      <p>${description}</p>
      ${data.status === "approved" ? "<p>Đừng quên cập nhật thông tin thanh toán để nhận thu nhập nhanh chóng.</p>" : ""}
    </div>
  `

  return await deliverEmail({
    to: data.email,
    subject,
    html: renderEmailLayout({
      heroTitle: "Cập nhật trạng thái hồ sơ host",
      heroSubtitle: data.status === "approved" ? "Chào mừng bạn đến với cộng đồng LuxeStay!" : "Bạn có thể hoàn thiện hồ sơ và gửi lại bất cứ lúc nào.",
      previewText: subject,
      accent: data.status === "approved" ? "#10b981" : "#f97316",
      body,
    }),
  })
}

export async function sendGuideApplicationStatusEmail(data: GuideApplicationStatusEmailData) {
  if (!data.email) return { success: false as const, error: new Error("Missing guide email") }

  const subjectMap = {
    approved: "Hồ sơ hướng dẫn viên đã được phê duyệt",
    rejected: "Hồ sơ hướng dẫn viên chưa được phê duyệt",
    needs_revision: "Cần bổ sung thông tin hồ sơ hướng dẫn viên",
  } as const

  const subject = subjectMap[data.status]

  const pricingBlock = `
    <div class="email-card">
      <h3>Thông tin gói hướng dẫn viên</h3>
      <div class="email-grid">
        <div>
          <p class="email-label">Phí thành viên</p>
          <p class="email-value">${formatCurrency(data.subscriptionFee)}</p>
        </div>
        <div>
          <p class="email-label">Hoa hồng nền tảng</p>
          <p class="email-value">${(data.commissionRate * 100).toFixed(0)}%</p>
        </div>
      </div>
    </div>
  `

  let description = ""
  if (data.status === "approved") {
    description = "Chúc mừng! Hồ sơ của bạn đã được phê duyệt. Bạn có thể tạo trải nghiệm, quản lý booking và theo dõi thu nhập trong dashboard."
  } else if (data.status === "rejected") {
    description = `Rất tiếc, hồ sơ của bạn chưa thể phê duyệt. ${data.notes ?? ""}`
  } else {
    description = `Hồ sơ của bạn cần bổ sung thêm thông tin trước khi được xét duyệt. ${data.notes ?? ""}`
  }

  const body = `
    <div class="email-card">
      <p>Xin chào <strong>${data.name}</strong>,</p>
      <p>${description}</p>
    </div>
    ${data.status === "approved" ? pricingBlock : ""}
  `

  return await deliverEmail({
    to: data.email,
    subject,
    html: renderEmailLayout({
      heroTitle: "Cập nhật hồ sơ hướng dẫn viên",
      heroSubtitle:
        data.status === "approved"
          ? "Hẹn gặp bạn trong những trải nghiệm sắp tới cùng LuxeStay."
          : "Hoàn thiện hồ sơ để quay lại với chúng tôi bất cứ lúc nào.",
      previewText: subject,
      accent: data.status === "approved" ? "#10b981" : "#f97316",
      body,
    }),
  })
}

export async function sendBookingCancellationEmail(data: BookingCancellationData) {
  return await deliverEmail({
    to: data.guestEmail,
    subject: `Đặt phòng tại ${data.listingTitle} đã được hủy`,
    html: bookingCancellationTemplate(data),
  })
}

export async function sendVerificationEmail(data: VerificationEmailData) {
  return await deliverEmail({
    to: data.email,
    subject: "Xác thực email tài khoản LuxeStay",
    html: verificationEmailTemplate(data),
  })
}

export async function sendPasswordResetEmail(data: PasswordResetData) {
  return await deliverEmail({
    to: data.email,
    subject: "Hướng dẫn đặt lại mật khẩu LuxeStay",
    html: passwordResetTemplate(data),
  })
}

export async function sendReviewReminderEmail(data: ReviewReminderData) {
  return await deliverEmail({
    to: data.guestEmail,
    subject: `Chia sẻ trải nghiệm tại ${data.listingTitle}`,
    html: reviewReminderTemplate(data),
  })
}

export async function sendMembershipPendingEmail(data: MembershipEmailPendingData) {
  if (!data.email) return { success: false as const, error: new Error("Missing recipient email") }
  return await deliverEmail({
    to: data.email,
    subject: `Đã nhận chuyển khoản gói ${data.planName}`,
    html: membershipPendingTemplate(data),
  })
}

export async function sendMembershipActivatedEmail(data: MembershipEmailActivatedData) {
  if (!data.email) return { success: false as const, error: new Error("Missing recipient email") }
  return await deliverEmail({
    to: data.email,
    subject: `Membership ${data.planName} đã được kích hoạt`,
    html: membershipActivatedTemplate(data),
  })
}
