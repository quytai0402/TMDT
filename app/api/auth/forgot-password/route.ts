import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateOTP } from '@/lib/helpers'
import { z } from 'zod'

const forgotPasswordSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = forgotPasswordSchema.parse(body)

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json(
        { message: 'Nếu email tồn tại, bạn sẽ nhận được mã xác thực' },
        { status: 200 }
      )
    }

    // Generate OTP
    const otp = generateOTP(6)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Store OTP in database
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: otp,
        expires: expiresAt,
        type: 'PASSWORD_RESET',
      },
    })

    // TODO: Send OTP via email using Resend
    console.log(`OTP for ${email}: ${otp}`)

    return NextResponse.json(
      { message: 'Mã xác thực đã được gửi đến email của bạn' },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra, vui lòng thử lại' },
      { status: 500 }
    )
  }
}
