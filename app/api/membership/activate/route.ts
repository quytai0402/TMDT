import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  MembershipBillingCycle,
  MembershipPaymentMethod,
  MembershipStatus,
  Prisma,
} from "@prisma/client"
import { createPendingMembershipPurchase, activateMembershipForUser } from "@/lib/membership-activation"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const planSlug: string | undefined = body?.planSlug
    const billingCycle: string | undefined = body?.billingCycle
    const paymentMethodInput: string | undefined = body?.paymentMethod
    const referenceCode: string | undefined = body?.referenceCode

    if (!planSlug) {
      return NextResponse.json({ error: "Missing membership plan" }, { status: 400 })
    }

    const normalizedPlanSlug = planSlug.trim().toLowerCase()
    if (!normalizedPlanSlug) {
      return NextResponse.json({ error: "Missing membership plan" }, { status: 400 })
    }

    const plan = await prisma.membershipPlan.findUnique({
      where: { slug: normalizedPlanSlug },
    })

    if (!plan) {
      return NextResponse.json({ error: "Membership plan not found" }, { status: 404 })
    }

    const userWhere: Prisma.UserWhereInput[] = []
    if (session.user.id) {
      userWhere.push({ id: session.user.id })
    }
    if (session.user.email) {
      userWhere.push({ email: session.user.email })
    }

    if (userWhere.length === 0) {
      return NextResponse.json({ error: "Unable to resolve current user" }, { status: 401 })
    }

    const user = await prisma.user.findFirst({
      where: { OR: userWhere },
      select: {
        id: true,
        loyaltyPoints: true,
        loyaltyTier: true,
        email: true,
        name: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const cycle = billingCycle === "monthly" ? MembershipBillingCycle.MONTHLY : MembershipBillingCycle.ANNUAL
    const normalizedPaymentMethod: MembershipPaymentMethod =
      paymentMethodInput === "bank_transfer"
        ? MembershipPaymentMethod.BANK_TRANSFER
        : paymentMethodInput === "e_wallet"
          ? MembershipPaymentMethod.E_WALLET
          : MembershipPaymentMethod.CREDIT_CARD

    const amount = cycle === MembershipBillingCycle.MONTHLY ? plan.monthlyPrice : plan.annualPrice
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid membership pricing configuration" }, { status: 400 })
    }

    const planSnapshot = {
      id: plan.id,
      slug: plan.slug,
      name: plan.name,
      features: plan.features,
      exclusiveFeatures: plan.exclusiveFeatures,
      monthlyPrice: plan.monthlyPrice,
      annualPrice: plan.annualPrice,
      color: plan.color,
      icon: plan.icon,
    }

    if (normalizedPaymentMethod === MembershipPaymentMethod.BANK_TRANSFER) {
      if (!referenceCode) {
        return NextResponse.json({ error: "Missing transfer reference" }, { status: 400 })
      }

      const purchase = await createPendingMembershipPurchase({
        user,
        plan: planSnapshot,
        billingCycle: cycle,
        amount,
        referenceCode,
        paymentMethod: normalizedPaymentMethod,
      })

      return NextResponse.json({
        success: true,
        status: MembershipStatus.PENDING,
        pendingPurchase: {
          id: purchase.id,
          referenceCode: purchase.referenceCode,
          amount: purchase.amount,
          createdAt: purchase.createdAt,
          paymentMethod: paymentMethodInput ?? "bank_transfer",
        },
      })
    }

    const activation = await activateMembershipForUser({
      user,
      plan: planSnapshot,
      billingCycle: cycle,
      paymentMethod: normalizedPaymentMethod,
      amount,
      referenceCode,
    })

    return NextResponse.json({
      success: true,
      membership: activation.membership,
    })
  } catch (error) {
    console.error("Membership activation error:", error)
    return NextResponse.json({ error: "Failed to activate membership" }, { status: 500 })
  }
}
