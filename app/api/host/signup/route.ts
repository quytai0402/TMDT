import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { UserRole, UserStatus, HostApplicationStatus } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/helpers"

const signupSchema = z.object({
  name: z.string().min(2, "Vui lòng nhập họ tên tối thiểu 2 ký tự."),
  email: z.string().email("Email không hợp lệ."),
  phone: z.string().min(8, "Số điện thoại không hợp lệ."),
  password: z.string().min(8, "Mật khẩu cần tối thiểu 8 ký tự."),
  introduction: z.string().min(20, "Giới thiệu cần tối thiểu 20 ký tự."),
  experience: z.string().min(20, "Vui lòng mô tả thêm kinh nghiệm vận hành."),
  locationSlug: z.string().min(1, "Vui lòng chọn khu vực."),
  locationName: z.string().min(1, "Tên khu vực không hợp lệ."),
  maintenanceAcknowledged: z.boolean().refine((value) => value, {
    message: "Bạn cần đồng ý với chính sách phí duy trì và lệ phí nền tảng.",
  }),
})

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
      return NextResponse.json({ error: "Email đã được sử dụng. Vui lòng chọn email khác." }, { status: 409 })
    }

    if (existingPhone) {
      return NextResponse.json({ error: "Số điện thoại này đã được đăng ký." }, { status: 409 })
    }

    const hashedPassword = await hashPassword(payload.password)

    const user = await prisma.user.create({
      data: {
        name: payload.name.trim(),
        email: payload.email.toLowerCase(),
        phone: payload.phone.trim(),
        password: hashedPassword,
        role: UserRole.HOST,
        isHost: false,
        status: UserStatus.ACTIVE,
      },
    })

    await prisma.hostApplication.create({
      data: {
        userId: user.id,
        locationSlug: payload.locationSlug,
        locationName: payload.locationName,
        introduction: payload.introduction,
        experience: payload.experience,
        maintenanceAcknowledged: payload.maintenanceAcknowledged,
        status: HostApplicationStatus.PENDING,
      },
    })

    return NextResponse.json({
      message: "Đăng ký thành công. Vui lòng đăng nhập bằng tài khoản vừa tạo để theo dõi trạng thái duyệt.",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message ?? "Dữ liệu không hợp lệ" }, { status: 400 })
    }

    console.error("Host signup error:", error)
    return NextResponse.json({ error: "Không thể đăng ký host mới" }, { status: 500 })
  }
}
