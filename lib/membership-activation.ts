"use server"

import { prisma } from "@/lib/prisma"
import { mapMembershipPlanToLoyaltyTier } from "@/lib/membership"
import { getBankTransferInfo } from "@/lib/payments"
import { sendMembershipActivatedEmail, sendMembershipPendingEmail } from "@/lib/email"
import {
  LoyaltyTier,
  MembershipBillingCycle,
  MembershipPaymentMethod,
  MembershipPurchaseStatus,
  MembershipStatus,
  RewardSource,
  RewardTransactionType,
  TransactionStatus,
  TransactionType,
} from "@prisma/client"

type UserSnapshot = {
  id: string
  email?: string | null
  name?: string | null
  loyaltyPoints: number
  loyaltyTier: LoyaltyTier
}

type PlanSnapshot = {
  id: string
  slug: string
  name: string
  features: string[]
  exclusiveFeatures: string[]
  monthlyPrice: number
  annualPrice: number
  color?: string | null
  icon?: string | null
}

const BONUS_POINTS = {
  MONTHLY: 800,
  ANNUAL: 2000,
} as const

const RESOLVED_PAYMENT_LABEL: Record<MembershipPaymentMethod, string> = {
  CREDIT_CARD: "credit_card",
  BANK_TRANSFER: "bank_transfer",
  E_WALLET: "e_wallet",
}

const buildPlanSnapshot = (plan: PlanSnapshot) => ({
  slug: plan.slug,
  name: plan.name,
  monthlyPrice: plan.monthlyPrice,
  annualPrice: plan.annualPrice,
  features: plan.features,
  exclusiveFeatures: plan.exclusiveFeatures,
  color: plan.color,
  icon: plan.icon,
})

export async function createPendingMembershipPurchase(options: {
  user: UserSnapshot & { email?: string | null; name?: string | null }
  plan: PlanSnapshot
  billingCycle: MembershipBillingCycle
  amount: number
  referenceCode: string
  paymentMethod: MembershipPaymentMethod
}) {
  const { user, plan, billingCycle, amount, referenceCode, paymentMethod } = options
  const bankInfo = getBankTransferInfo()

  const existingPending = await prisma.membershipPurchase.findFirst({
    where: { userId: user.id, status: MembershipPurchaseStatus.PENDING },
    orderBy: { createdAt: "desc" },
  })

  const payload = {
    planId: plan.id,
    billingCycle,
    amount,
    paymentMethod,
    referenceCode,
    planSnapshot: buildPlanSnapshot(plan),
    transferInfo: {
      bank: bankInfo,
      referenceCode,
    },
    status: MembershipPurchaseStatus.PENDING,
  } as const

  const purchase = existingPending
    ? await prisma.membershipPurchase.update({
        where: { id: existingPending.id },
        data: payload,
      })
    : await prisma.membershipPurchase.create({
        data: {
          userId: user.id,
          ...payload,
        },
      })

  await prisma.user.update({
    where: { id: user.id },
    data: {
      membershipPlanId: plan.id,
      membershipStatus: MembershipStatus.PENDING,
      membershipBillingCycle: billingCycle,
      membershipStartedAt: null,
      membershipExpiresAt: null,
      membershipFeatures: [],
    },
  })

  await prisma.transaction.create({
    data: {
      userId: user.id,
      type: TransactionType.MEMBERSHIP,
      amount,
      status: TransactionStatus.PENDING,
      description: `Chuyển khoản membership ${plan.name}`,
      referenceId: purchase.id,
    },
  })

  await sendMembershipPendingEmail({
    email: user.email ?? undefined,
    name: user.name ?? undefined,
    planName: plan.name,
    billingCycle,
    amount,
    referenceCode,
    bankInfo,
  })

  return purchase
}

export async function activateMembershipForUser(options: {
  user: UserSnapshot & { email?: string | null; name?: string | null }
  plan: PlanSnapshot
  billingCycle: MembershipBillingCycle
  paymentMethod: MembershipPaymentMethod
  amount: number
  purchaseId?: string | null
  adminId?: string | null
  referenceCode?: string | null
}) {
  const { user, plan, billingCycle, paymentMethod, amount, purchaseId, adminId, referenceCode } = options
  const now = new Date()
  const expiresAt = new Date(now)
  if (billingCycle === MembershipBillingCycle.MONTHLY) {
    expiresAt.setMonth(expiresAt.getMonth() + 1)
  } else {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1)
  }

  const combinedFeatures = Array.from(new Set([...(plan.features ?? []), ...(plan.exclusiveFeatures ?? [])]))
  const targetTier = mapMembershipPlanToLoyaltyTier(plan.slug, user.loyaltyTier)
  const bonusPoints = billingCycle === MembershipBillingCycle.ANNUAL ? BONUS_POINTS.ANNUAL : BONUS_POINTS.MONTHLY

  await prisma.user.update({
    where: { id: user.id },
    data: {
      membershipPlanId: plan.id,
      membershipStatus: MembershipStatus.ACTIVE,
      membershipStartedAt: now,
      membershipExpiresAt: expiresAt,
      membershipBillingCycle: billingCycle,
      membershipFeatures: combinedFeatures,
      loyaltyTier: targetTier,
      loyaltyPoints: {
        increment: bonusPoints,
      },
    },
  })

  await prisma.rewardTransaction.create({
    data: {
      userId: user.id,
      transactionType: RewardTransactionType.CREDIT,
      source: RewardSource.MEMBERSHIP,
      points: bonusPoints,
      balanceAfter: user.loyaltyPoints + bonusPoints,
      description: `Thưởng kích hoạt membership ${plan.name}`,
      metadata: {
        planSlug: plan.slug,
        billingCycle,
        paymentMethod: RESOLVED_PAYMENT_LABEL[paymentMethod],
      },
    },
  })

  if (purchaseId) {
    await prisma.membershipPurchase.update({
      where: { id: purchaseId },
      data: {
        status: MembershipPurchaseStatus.CONFIRMED,
        confirmedAt: new Date(),
        confirmedBy: adminId ?? user.id,
      },
    })

    await prisma.transaction.updateMany({
      where: { referenceId: purchaseId, type: TransactionType.MEMBERSHIP },
      data: { status: TransactionStatus.COMPLETED },
    })
  } else {
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: TransactionType.MEMBERSHIP,
        amount,
        status: TransactionStatus.COMPLETED,
        description: `Thanh toán membership ${plan.name}`,
      },
    })
  }

  await sendMembershipActivatedEmail({
    email: user.email ?? undefined,
    name: user.name ?? undefined,
    planName: plan.name,
    billingCycle,
    startsAt: now,
    expiresAt,
    referenceCode: referenceCode ?? purchaseId ?? undefined,
  })

  return {
    membership: {
      status: MembershipStatus.ACTIVE,
      isActive: true,
      startedAt: now,
      expiresAt,
      billingCycle,
      features: combinedFeatures,
      plan: {
        slug: plan.slug,
        name: plan.name,
        color: plan.color,
        icon: plan.icon,
        features: plan.features,
        exclusiveFeatures: plan.exclusiveFeatures,
      },
    },
    bonusPoints,
  }
}
