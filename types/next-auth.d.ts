import "next-auth"
import { UserRole } from "@prisma/client"

type MembershipPlanSnapshot = {
  slug: string
  name: string
  discountRate: number
  applyDiscountToServices: boolean
  color?: string | null
  icon?: string | null
  features?: string[] | null
  exclusiveFeatures?: string[] | null
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: UserRole
      isHost: boolean
      isGuide: boolean
      guideProfileId?: string | null
      membership?: string | null
      membershipPlan?: MembershipPlanSnapshot | null
      membershipStatus?: string | null
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    image?: string | null
    role: UserRole
    isHost: boolean
    isGuide: boolean
    guideProfileId?: string | null
    membership?: string | null
    membershipPlan?: MembershipPlanSnapshot | null
    membershipStatus?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: UserRole
    isHost: boolean
    isGuide: boolean
    guideProfileId?: string | null
    membership?: string | null
    membershipPlan?: MembershipPlanSnapshot | null
    membershipStatus?: string | null
  }
}
