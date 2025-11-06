import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  MembershipPurchaseStatus,
  MembershipStatus,
  TransactionStatus,
  TransactionType,
} from "@prisma/client"
import { activateMembershipForUser } from "@/lib/membership-activation"

type RouteContext = {
  params: {
    purchaseId: string
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { purchaseId } = context.params
    if (!purchaseId) {
      return NextResponse.json({ error: "Missing purchase id" }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))
    const action = body?.action as "confirm" | "reject" | undefined
    const adminNotes = typeof body?.notes === "string" ? body.notes : undefined

    if (!action) {
      return NextResponse.json({ error: "Missing action" }, { status: 400 })
    }

    const purchase = await prisma.membershipPurchase.findUnique({
      where: { id: purchaseId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            loyaltyPoints: true,
            loyaltyTier: true,
            membershipStatus: true,
          },
        },
        plan: {
          select: {
            id: true,
            slug: true,
            name: true,
            features: true,
            exclusiveFeatures: true,
            monthlyPrice: true,
            annualPrice: true,
            color: true,
            icon: true,
          },
        },
      },
    })

    if (!purchase) {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 })
    }

    if (action === "reject") {
      if (purchase.status !== MembershipPurchaseStatus.PENDING) {
        return NextResponse.json({ error: "Only pending purchases can be rejected" }, { status: 400 })
      }

      await prisma.$transaction([
        prisma.membershipPurchase.update({
          where: { id: purchase.id },
          data: {
            status: MembershipPurchaseStatus.REJECTED,
            adminNotes,
            confirmedAt: new Date(),
            confirmedBy: session.user.id,
          },
        }),
        prisma.transaction.updateMany({
          where: { referenceId: purchase.id, type: TransactionType.MEMBERSHIP },
          data: { status: TransactionStatus.FAILED },
        }),
        prisma.user.update({
          where: { id: purchase.userId },
          data: {
            membershipStatus:
              purchase.user.membershipStatus === MembershipStatus.PENDING
                ? MembershipStatus.INACTIVE
                : purchase.user.membershipStatus,
          },
        }),
      ])

      return NextResponse.json({ success: true, status: "REJECTED" })
    }

    if (action === "confirm") {
      if (purchase.status !== MembershipPurchaseStatus.PENDING) {
        return NextResponse.json({ error: "Purchase is not pending" }, { status: 400 })
      }

      const activation = await activateMembershipForUser({
        user: {
          id: purchase.user.id,
          email: purchase.user.email,
          name: purchase.user.name,
          loyaltyPoints: purchase.user.loyaltyPoints,
          loyaltyTier: purchase.user.loyaltyTier,
        },
        plan: {
          id: purchase.plan.id,
          slug: purchase.plan.slug,
          name: purchase.plan.name,
          features: purchase.plan.features,
          exclusiveFeatures: purchase.plan.exclusiveFeatures,
          monthlyPrice: purchase.plan.monthlyPrice,
          annualPrice: purchase.plan.annualPrice,
          color: purchase.plan.color,
          icon: purchase.plan.icon,
        },
        billingCycle: purchase.billingCycle,
        paymentMethod: purchase.paymentMethod,
        amount: purchase.amount,
        purchaseId: purchase.id,
        adminId: session.user.id,
        referenceCode: purchase.referenceCode,
      })

      return NextResponse.json({
        success: true,
        membership: activation.membership,
      })
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 })
  } catch (error) {
    console.error("Confirm membership purchase error:", error)
    return NextResponse.json({ error: "Failed to update purchase" }, { status: 500 })
  }
}
