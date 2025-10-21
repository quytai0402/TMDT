import { NextRequest, NextResponse } from "next/server"
import { verifyToken, generateToken } from "@/lib/jwt"
import { z } from "zod"

const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validatedData = refreshSchema.parse(body)

    // Verify refresh token
    const payload = verifyToken(validatedData.refreshToken)

    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired refresh token" },
        { status: 401 }
      )
    }

    // Generate new access token
    const accessToken = generateToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    })

    return NextResponse.json(
      {
        accessToken,
      },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    console.error("Refresh token error:", error)
    return NextResponse.json({ error: "Token refresh failed" }, { status: 500 })
  }
}
