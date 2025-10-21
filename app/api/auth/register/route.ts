import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateReferralCode } from '@/lib/helpers'
import { generateToken, generateRefreshToken } from '@/lib/jwt'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  phone: z.string().optional(),
  referralCode: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validatedData = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email đã được sử dụng' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password)

    // Generate referral code for new user
    const referralCode = generateReferralCode(validatedData.name)

    // Find referrer if referral code provided
    let referrerId: string | undefined
    if (validatedData.referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: validatedData.referralCode },
      })
      if (referrer) {
        referrerId = referrer.id
        // Award referral points
        await prisma.user.update({
          where: { id: referrer.id },
          data: {
            loyaltyPoints: { increment: 500 }, // 500 points for referral
          },
        })
      }
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
        phone: validatedData.phone,
        referralCode,
        referredBy: referrerId,
        loyaltyPoints: referrerId ? 300 : 0, // 300 points bonus if referred
      },
      select: {
        id: true,
        email: true,
        name: true,
        referralCode: true,
        loyaltyPoints: true,
      },
    })

    // TODO: Send verification email

    // Generate JWT tokens
    const accessToken = generateToken({
      userId: user.id,
      email: user.email,
      role: 'USER',
    })

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: 'USER',
    })

    return NextResponse.json(
      {
        message: 'Đăng ký thành công',
        user,
        accessToken,
        refreshToken,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra, vui lòng thử lại' },
      { status: 500 }
    )
  }
}
