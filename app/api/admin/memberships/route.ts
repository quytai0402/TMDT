import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { MembershipStatus } from "@prisma/client"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const statusFilter = request.nextUrl.searchParams.get("status")

    const plans = await prisma.membershipPlan.findMany({
      orderBy: { displayOrder: "asc" },
    })

    const planStats = await Promise.all(
      plans.map(async (plan) => {
        const activeMembers = await prisma.user.count({
          where: { membershipPlanId: plan.id, membershipStatus: MembershipStatus.ACTIVE },
        })

        const expiredMembers = await prisma.user.count({
          where: { membershipPlanId: plan.id, membershipStatus: MembershipStatus.EXPIRED },
        })

        return {
          plan,
          stats: {
            activeMembers,
            expiredMembers,
          },
        }
      }),
    )

    const members = await prisma.user.findMany({
      where: {
        membershipStatus:
          statusFilter && statusFilter !== "ALL"
            ? (statusFilter as MembershipStatus)
            : {
                in: [
                  MembershipStatus.ACTIVE,
                  MembershipStatus.EXPIRED,
                  MembershipStatus.CANCELLED,
                ],
              },
      },
      select: {
        id: true,
        name: true,
        email: true,
        membershipStatus: true,
        membershipStartedAt: true,
        membershipExpiresAt: true,
        membershipFeatures: true,
        membershipPlan: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { membershipStartedAt: "desc" },
      take: 100,
    })

    return NextResponse.json({
      plans: planStats.map(({ plan, stats }) => ({
        id: plan.id,
        name: plan.name,
        slug: plan.slug,
        price: plan.price,
        billingCycle: plan.billingCycle,
        perks: plan.perks,
        description: plan.description,
        stats,
      })),
      members: members.map((member) => ({
        id: member.id,
        name: member.name,
        email: member.email,
        status: member.membershipStatus,
        startedAt: member.membershipStartedAt,
        expiresAt: member.membershipExpiresAt,
        features: member.membershipFeatures,
        plan: member.membershipPlan,
      })),
    })
  } catch (error) {
    console.error("Admin memberships error:", error)
    return NextResponse.json({ error: "Failed to load membership data" }, { status: 500 })
  }
}
