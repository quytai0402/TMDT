import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const payoutAccountSchema = z.object({
  bankName: z.string().min(2, "Vui lòng nhập tên ngân hàng"),
  bankBranch: z
    .string()
    .max(200, "Tên chi nhánh tối đa 200 ký tự")
    .optional()
    .nullable(),
  accountNumber: z.string().min(3, "Số tài khoản không hợp lệ"),
  accountName: z.string().min(2, "Vui lòng nhập tên chủ tài khoản"),
  qrCodeImage: z
    .string()
    .trim()
    .min(1, "Đường dẫn QR không hợp lệ")
    .optional()
    .nullable(),
  taxId: z
    .string()
    .max(100, "Mã số thuế tối đa 100 ký tự")
    .optional()
    .nullable(),
  notes: z
    .string()
    .max(500, "Ghi chú tối đa 500 ký tự")
    .optional()
    .nullable(),
})

type SanitizedAccountPayload = z.infer<typeof payoutAccountSchema>

function sanitizePayload(payload: SanitizedAccountPayload) {
  const trim = (value?: string | null) => {
    if (typeof value !== "string") return null
    const trimmed = value.trim()
    return trimmed.length ? trimmed : null
  }

  return {
    bankName: payload.bankName.trim(),
    bankBranch: trim(payload.bankBranch),
    accountNumber: payload.accountNumber.trim(),
    accountName: payload.accountName.trim(),
    qrCodeImage: trim(payload.qrCodeImage),
    taxId: trim(payload.taxId),
    notes: trim(payload.notes),
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "HOST") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = prisma as unknown as {
      hostPayoutAccount: {
        findUnique: typeof prisma.hostPayout.findUnique
        upsert: typeof prisma.hostPayout.upsert
      }
    }

    const account = await db.hostPayoutAccount.findUnique({
      where: { hostId: session.user.id },
    })

    return NextResponse.json({ account })
  } catch (error) {
    console.error("Host payout account GET error:", error)
    return NextResponse.json({ error: "Failed to load payout account" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "HOST") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const json = await request.json().catch(() => null)
    const parsed = payoutAccountSchema.safeParse(json)

    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      return NextResponse.json({ error: issue?.message ?? "Dữ liệu không hợp lệ" }, { status: 400 })
    }

    const sanitized = sanitizePayload(parsed.data)

    const db = prisma as unknown as {
      hostPayoutAccount: {
        findUnique: typeof prisma.hostPayout.findUnique
        upsert: typeof prisma.hostPayout.upsert
      }
    }

    const account = await db.hostPayoutAccount.upsert({
      where: { hostId: session.user.id },
      create: {
        hostId: session.user.id,
        updatedBy: session.user.id,
        ...sanitized,
      },
      update: {
        updatedBy: session.user.id,
        ...sanitized,
      },
    })

    return NextResponse.json({ account })
  } catch (error) {
    console.error("Host payout account PATCH error:", error)
    return NextResponse.json({ error: "Failed to update payout account" }, { status: 500 })
  }
}
