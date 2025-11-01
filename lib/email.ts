import { Resend } from "resend"

// Initialize Resend (you can also use SendGrid or Nodemailer)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

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

// ============================================
// EMAIL TEMPLATES
// ============================================

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

const formatCurrency = (amount: number, currency: string = "VND") => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: currency,
  }).format(amount)
}

// Booking Confirmation Email Template
const bookingConfirmationTemplate = (data: BookingConfirmationData) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Xác nhận đặt phòng</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">🎉 Đặt phòng thành công!</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Xin chào <strong>${data.guestName}</strong>,</p>
    
    <p>Cảm ơn bạn đã đặt phòng! Đặt phòng của bạn đã được xác nhận.</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
      <h2 style="margin-top: 0; color: #667eea;">Chi tiết đặt phòng</h2>
      
      <p><strong>Mã đặt phòng:</strong> ${data.bookingId}</p>
      <p><strong>Chỗ ở:</strong> ${data.listingTitle}</p>
      <p><strong>Địa chỉ:</strong> ${data.listingAddress}</p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      
      <div style="display: flex; justify-content: space-between; margin: 15px 0;">
        <div>
          <p style="margin: 0; color: #666;">Nhận phòng</p>
          <p style="margin: 5px 0; font-weight: bold;">${formatDate(data.checkIn)}</p>
        </div>
        <div>
          <p style="margin: 0; color: #666;">Trả phòng</p>
          <p style="margin: 5px 0; font-weight: bold;">${formatDate(data.checkOut)}</p>
        </div>
      </div>
      
      <p><strong>Số đêm:</strong> ${data.nights} đêm</p>
      <p><strong>Số khách:</strong> ${data.guests.adults} người lớn${data.guests.children > 0 ? `, ${data.guests.children} trẻ em` : ""}${data.guests.infants > 0 ? `, ${data.guests.infants} em bé` : ""}</p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      
      <p style="font-size: 20px; font-weight: bold; color: #667eea;">
        Tổng tiền: ${formatCurrency(data.totalPrice, data.currency)}
      </p>
    </div>
    
    <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 20px 0;">
      <p style="margin: 0;"><strong>⏰ Lưu ý quan trọng:</strong></p>
      <p style="margin: 5px 0 0 0;">Vui lòng liên hệ với chủ nhà <strong>${data.hostName}</strong> trước khi nhận phòng để xác nhận giờ check-in và nhận hướng dẫn.</p>
    </div>
    
    <div style="text-align: center; margin-top: 30px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/trips/${data.bookingId}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Xem chi tiết đặt phòng</a>
    </div>
    
    <p style="margin-top: 30px; color: #666; font-size: 14px;">
      Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi hoặc nhắn tin trực tiếp cho chủ nhà.
    </p>
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px;">
      <p>© ${new Date().getFullYear()} Homestay Booking. All rights reserved.</p>
      <p>Email này được gửi tự động, vui lòng không trả lời.</p>
    </div>
  </div>
</body>
</html>
`

// Booking Cancellation Email Template
const bookingCancellationTemplate = (data: BookingCancellationData) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hủy đặt phòng</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Đặt phòng đã bị hủy</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Xin chào <strong>${data.guestName}</strong>,</p>
    
    <p>Đặt phòng của bạn đã được hủy thành công.</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f5576c;">
      <h2 style="margin-top: 0; color: #f5576c;">Chi tiết đặt phòng đã hủy</h2>
      
      <p><strong>Mã đặt phòng:</strong> ${data.bookingId}</p>
      <p><strong>Chỗ ở:</strong> ${data.listingTitle}</p>
      <p><strong>Nhận phòng:</strong> ${formatDate(data.checkIn)}</p>
      <p><strong>Trả phòng:</strong> ${formatDate(data.checkOut)}</p>
      
      ${data.refundAmount ? `
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 18px; font-weight: bold; color: #28a745;">
          Số tiền hoàn lại: ${formatCurrency(data.refundAmount)}
        </p>
        <p style="color: #666; font-size: 14px;">Tiền sẽ được hoàn vào tài khoản của bạn trong 5-7 ngày làm việc.</p>
      ` : ""}
      
      ${data.cancellationReason ? `
        <p><strong>Lý do hủy:</strong> ${data.cancellationReason}</p>
      ` : ""}
    </div>
    
    <p style="margin-top: 30px; color: #666; font-size: 14px;">
      Chúng tôi rất tiếc vì sự bất tiện này. Hy vọng sẽ được phục vụ bạn trong những chuyến đi tiếp theo!
    </p>
    
    <div style="text-align: center; margin-top: 30px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/search" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Tìm chỗ ở khác</a>
    </div>
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px;">
      <p>© ${new Date().getFullYear()} Homestay Booking. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`

// Verification Email Template
const verificationEmailTemplate = (data: VerificationEmailData) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Xác thực email</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Xác thực tài khoản</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Xin chào <strong>${data.name}</strong>,</p>
    
    <p>Cảm ơn bạn đã đăng ký tài khoản Homestay Booking! Vui lòng xác thực email của bạn để hoàn tất đăng ký.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${data.verificationToken}" style="display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Xác thực email</a>
    </div>
    
    <p style="color: #666; font-size: 14px;">
      Hoặc copy và paste link sau vào trình duyệt:<br>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${data.verificationToken}" style="color: #667eea; word-break: break-all;">${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${data.verificationToken}</a>
    </p>
    
    <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px;"><strong>⚠️ Lưu ý:</strong> Link xác thực có hiệu lực trong 24 giờ.</p>
    </div>
    
    <p style="margin-top: 30px; color: #666; font-size: 14px;">
      Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.
    </p>
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px;">
      <p>© ${new Date().getFullYear()} Homestay Booking. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`

// Password Reset Email Template
const passwordResetTemplate = (data: PasswordResetData) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Đặt lại mật khẩu</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Đặt lại mật khẩu</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Xin chào <strong>${data.name}</strong>,</p>
    
    <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${data.resetToken}" style="display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Đặt lại mật khẩu</a>
    </div>
    
    <p style="color: #666; font-size: 14px;">
      Hoặc copy và paste link sau vào trình duyệt:<br>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${data.resetToken}" style="color: #667eea; word-break: break-all;">${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${data.resetToken}</a>
    </p>
    
    <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px;"><strong>⚠️ Lưu ý:</strong> Link đặt lại mật khẩu có hiệu lực trong 1 giờ.</p>
    </div>
    
    <p style="margin-top: 30px; color: #666; font-size: 14px;">
      Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. Mật khẩu của bạn sẽ không thay đổi.
    </p>
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px;">
      <p>© ${new Date().getFullYear()} Homestay Booking. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`

// Review Reminder Email Template
const reviewReminderTemplate = (data: ReviewReminderData) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nhắc nhở đánh giá</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ffa726 0%, #fb8c00 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">⭐ Đánh giá chuyến đi của bạn</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Xin chào <strong>${data.guestName}</strong>,</p>
    
    <p>Hy vọng bạn đã có một trải nghiệm tuyệt vời tại <strong>${data.listingTitle}</strong>!</p>
    
    <p>Đánh giá của bạn rất quan trọng đối với cộng đồng Homestay Booking. Hãy chia sẻ trải nghiệm của bạn để giúp những người khác đưa ra quyết định tốt hơn!</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/trips/${data.bookingId}/review" style="display: inline-block; background: #ffa726; color: white; padding: 15px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Viết đánh giá ngay</a>
    </div>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #666;">
        📝 Đánh giá của bạn sẽ giúp:<br>
        ✓ Cải thiện chất lượng dịch vụ<br>
        ✓ Giúp khách hàng khác lựa chọn phù hợp<br>
        ✓ Động viên chủ nhà cung cấp dịch vụ tốt hơn
      </p>
    </div>
    
    <p style="margin-top: 30px; color: #666; font-size: 14px;">
      Cảm ơn bạn đã sử dụng Homestay Booking. Chúng tôi mong được phục vụ bạn trong những chuyến đi tiếp theo!
    </p>
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px;">
      <p>© ${new Date().getFullYear()} Homestay Booking. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`

// ============================================
// EMAIL SENDING FUNCTIONS
// ============================================

export async function sendBookingConfirmationEmail(data: BookingConfirmationData) {
  try {
    if (!resend) {
      console.log("📧 Email service not configured (missing RESEND_API_KEY)")
      console.log("Booking confirmation email would be sent to:", data.guestEmail)
      return { success: true, message: "Email service not configured" }
    }

    const { error } = await resend.emails.send({
      from: "Homestay Booking <bookings@yourdomain.com>",
      to: data.guestEmail,
      cc: data.hostEmail,
      subject: `Xác nhận đặt phòng - ${data.listingTitle}`,
      html: bookingConfirmationTemplate(data),
    })

    if (error) {
      console.error("Failed to send booking confirmation email:", error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error("Email error:", error)
    return { success: false, error }
  }
}

export async function sendHostApplicationStatusEmail(data: HostApplicationStatusEmailData) {
  if (!resend || !data.email) {
    return
  }

  const subject =
    data.status === "approved"
      ? "Yêu cầu trở thành host đã được phê duyệt"
      : "Yêu cầu trở thành host bị từ chối"

  const body = data.status === "approved"
    ? `
      <p>Xin chào ${data.name},</p>
      <p>Chúc mừng! Yêu cầu trở thành host của bạn tại khu vực <strong>${data.locationName}</strong> đã được phê duyệt.</p>
      <p>Giờ bạn có thể đăng bài và quản lý listings cho khu vực này. Đừng quên cập nhật thông tin ví để nhận thu nhập, và lưu ý lệ phí nền tảng 10% sẽ được khấu trừ tự động.</p>
      <p>Chúc bạn có nhiều booking thành công! 🚀</p>
      <p>Đội ngũ LuxeStay</p>
    `
    : `
      <p>Xin chào ${data.name},</p>
      <p>Rất tiếc, yêu cầu trở thành host tại khu vực <strong>${data.locationName}</strong> chưa thể phê duyệt vào lúc này.</p>
      ${data.notes ? `<p>Lý do: ${data.notes}</p>` : ""}
      <p>Bạn có thể cập nhật hồ sơ và gửi lại thông tin trong thời gian tới.</p>
      <p>Đội ngũ LuxeStay</p>
    `

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "no-reply@luxestay.vn",
    to: data.email,
    subject,
    html: `
      <!DOCTYPE html>
      <html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937;">
        ${body}
      </body></html>
    `,
  })
}

export async function sendBookingCancellationEmail(data: BookingCancellationData) {
  try {
    if (!resend) {
      console.log("📧 Email service not configured")
      console.log("Cancellation email would be sent to:", data.guestEmail)
      return { success: true, message: "Email service not configured" }
    }

    const { error } = await resend.emails.send({
      from: "Homestay Booking <bookings@yourdomain.com>",
      to: data.guestEmail,
      subject: `Đặt phòng đã hủy - ${data.listingTitle}`,
      html: bookingCancellationTemplate(data),
    })

    if (error) {
      console.error("Failed to send cancellation email:", error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error("Email error:", error)
    return { success: false, error }
  }
}

export async function sendVerificationEmail(data: VerificationEmailData) {
  try {
    if (!resend) {
      console.log("📧 Email service not configured")
      console.log("Verification email would be sent to:", data.email)
      return { success: true, message: "Email service not configured" }
    }

    const { error } = await resend.emails.send({
      from: "Homestay Booking <noreply@yourdomain.com>",
      to: data.email,
      subject: "Xác thực tài khoản Homestay Booking",
      html: verificationEmailTemplate(data),
    })

    if (error) {
      console.error("Failed to send verification email:", error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error("Email error:", error)
    return { success: false, error }
  }
}

export async function sendPasswordResetEmail(data: PasswordResetData) {
  try {
    if (!resend) {
      console.log("📧 Email service not configured")
      console.log("Password reset email would be sent to:", data.email)
      return { success: true, message: "Email service not configured" }
    }

    const { error } = await resend.emails.send({
      from: "Homestay Booking <noreply@yourdomain.com>",
      to: data.email,
      subject: "Đặt lại mật khẩu - Homestay Booking",
      html: passwordResetTemplate(data),
    })

    if (error) {
      console.error("Failed to send password reset email:", error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error("Email error:", error)
    return { success: false, error }
  }
}

export async function sendReviewReminderEmail(data: ReviewReminderData) {
  try {
    if (!resend) {
      console.log("📧 Email service not configured")
      console.log("Review reminder email would be sent to:", data.guestEmail)
      return { success: true, message: "Email service not configured" }
    }

    const { error } = await resend.emails.send({
      from: "Homestay Booking <noreply@yourdomain.com>",
      to: data.guestEmail,
      subject: `Đánh giá chuyến đi của bạn tại ${data.listingTitle}`,
      html: reviewReminderTemplate(data),
    })

    if (error) {
      console.error("Failed to send review reminder email:", error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error("Email error:", error)
    return { success: false, error }
  }
}
