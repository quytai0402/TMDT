import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        role: true,
        isHost: true,
        isGuide: true,
        loyaltyTier: true,
        membershipStatus: true,
        membershipPlan: {
          select: {
            slug: true,
            name: true,
            bookingDiscountRate: true,
            applyDiscountToServices: true,
            color: true,
            icon: true,
            features: true,
            exclusiveFeatures: true,
          },
        },
        guideProfile: {
          select: { id: true },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const membershipPlan = user.membershipPlan
      ? {
          slug: user.membershipPlan.slug,
          name: user.membershipPlan.name,
          discountRate: user.membershipPlan.bookingDiscountRate,
          applyDiscountToServices: user.membershipPlan.applyDiscountToServices,
          color: user.membershipPlan.color,
          icon: user.membershipPlan.icon,
          features: user.membershipPlan.features ?? null,
          exclusiveFeatures: user.membershipPlan.exclusiveFeatures ?? null,
        }
      : null

    return NextResponse.json({
      user: {
        id: user.id,
        role: user.role,
        isHost: user.isHost,
        isGuide: user.isGuide,
        guideProfileId: user.guideProfile?.id ?? null,
        membership: user.loyaltyTier,
        membershipStatus: user.membershipStatus ?? null,
        membershipPlan,
      },
    })
  } catch (error) {
    console.error("Session refresh error:", error)
    return NextResponse.json({ error: "Failed to refresh session" }, { status: 500 })
  }
}
