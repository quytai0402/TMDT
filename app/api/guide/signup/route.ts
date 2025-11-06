import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { Prisma, NotificationType, UserRole, UserStatus } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/helpers"
import { notifyAdmins } from "@/lib/notifications"

const signupSchema = z.object({
  name: z.string().min(2, "Vui lòng nhập họ tên tối thiểu 2 ký tự."),
  email: z.string().email("Email không hợp lệ."),
  phone: z
    .string()
    .min(10, "Số điện thoại phải có ít nhất 10 số.")
    .regex(/^[0-9+\s()-]+$/, "Số điện thoại chỉ chứa số và ký tự +, -, (, ), khoảng trắng"),
  password: z.string().min(8, "Mật khẩu cần tối thiểu 8 ký tự."),
  displayName: z.string().min(2, "Tên thương hiệu cần tối thiểu 2 ký tự."),
  tagline: z.string().max(160, "Tagline quá dài.").optional(),
  introduction: z
    .string()
    .min(40, "Hãy giới thiệu bản thân và phong cách dẫn tour (tối thiểu 40 ký tự).")
    .max(4000, "Giới thiệu tối đa 4000 ký tự."),
  experienceSummary: z
    .string()
    .min(40, "Vui lòng mô tả kinh nghiệm và thành tích (tối thiểu 40 ký tự).")
    .max(4000, "Phần kinh nghiệm tối đa 4000 ký tự."),
  languages: z.array(z.string().min(1)).min(1, "Chọn ít nhất 1 ngôn ngữ."),
  serviceAreas: z.array(z.string().min(1)).min(1, "Chọn ít nhất 1 khu vực hoạt động."),
  specialties: z.array(z.string().min(1)).min(1, "Chọn ít nhất 1 chủ đề trải nghiệm."),
  availabilityNotes: z.string().max(2000).optional(),
  portfolioLinks: z.array(z.string().url("Liên kết portfolio phải hợp lệ")).max(5).optional().default([]),
  subscriptionAcknowledged: z.boolean().refine((value) => value, {
    message: "Bạn cần đồng ý với phí thành viên 399.000đ/tháng.",
  }),
})

const uniqueValues = (values: string[]) =>
  Array.from(new Set(values.map((value) => value.trim()).filter((value) => value.length > 0)))

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const payload = signupSchema.parse(body)

    const [existingEmail, existingPhone] = await Promise.all([
      prisma.user.findUnique({
        where: { email: payload.email.toLowerCase() },
        select: { id: true },
      }),
      prisma.user.findFirst({
        where: { phone: payload.phone.trim() },
        select: { id: true },
      }),
    ])

    if (existingEmail) {
      return NextResponse.json(
        { error: "Email này đã được sử dụng. Vui lòng đăng nhập hoặc chọn email khác." },
        { status: 409 },
      )
    }

    if (existingPhone) {
      return NextResponse.json(
        { error: "Số điện thoại này đã được đăng ký. Vui lòng đăng nhập để tiếp tục hồ sơ." },
        { status: 409 },
      )
    }

    const hashedPassword = await hashPassword(payload.password)

    const user = await prisma.user.create({
      data: {
        name: payload.name.trim(),
        email: payload.email.toLowerCase(),
        phone: payload.phone.trim(),
        password: hashedPassword,
        role: UserRole.GUEST,
        status: UserStatus.ACTIVE,
      },
    })

    const application = await prisma.guideApplication.create({
      data: {
        applicantId: user.id,
        sponsorId: null,
        status: Prisma.GuideApplicationStatus.PENDING,
        displayName: payload.displayName.trim(),
        tagline: payload.tagline?.trim() ?? null,
        introduction: payload.introduction.trim(),
        experienceSummary: payload.experienceSummary.trim(),
        languages: uniqueValues(payload.languages),
        serviceAreas: uniqueValues(payload.serviceAreas),
        specialties: uniqueValues(payload.specialties),
        availabilityNotes: payload.availabilityNotes?.trim() ?? null,
        portfolioLinks: uniqueValues(payload.portfolioLinks ?? []),
        subscriptionAcknowledged: payload.subscriptionAcknowledged,
      },
    })

    await notifyAdmins({
      type: NotificationType.SYSTEM,
      title: "Hồ sơ hướng dẫn viên mới",
      message: `${payload.displayName} vừa đăng ký tài khoản và gửi hồ sơ hướng dẫn viên mới.`,
      link: "/admin/guides/applications",
      data: {
        applicantId: user.id,
        applicationId: application.id,
      },
    })

    return NextResponse.json({
      message: "Đăng ký thành công. Vui lòng đăng nhập bằng tài khoản vừa tạo để theo dõi trạng thái duyệt.",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message ?? "Dữ liệu không hợp lệ" }, { status: 400 })
    }

    console.error("Guide signup error:", error)
    return NextResponse.json({ error: "Không thể đăng ký hướng dẫn viên." }, { status: 500 })
  }
}
