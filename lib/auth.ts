import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import FacebookProvider from 'next-auth/providers/facebook'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateReferralCode } from '@/lib/helpers'
import type { Session, User } from 'next-auth'
import type {
  Adapter,
  AdapterAccount,
  AdapterSession,
  AdapterUser,
} from 'next-auth/adapters'
import type { JWT } from 'next-auth/jwt'
import type { Prisma, UserRole } from '@prisma/client'

type MembershipPlanSnapshot = {
  id?: string
  slug: string
  name: string
  discountRate: number
  applyDiscountToServices: boolean
  experienceDiscountRate?: number
  color?: string | null
  icon?: string | null
  features?: string[] | null
  exclusiveFeatures?: string[] | null
}

type RoleAwareUser = AdapterUser & {
  role?: UserRole
  isHost?: boolean
  isGuide?: boolean
  guideProfileId?: string | null
  membership?: string | null
  loyaltyTier?: string | null
  membershipPlan?: MembershipPlanSnapshot | null
  membershipStatus?: string | null
}

type RoleAwareToken = JWT & {
  id?: string
  role?: UserRole
  isHost?: boolean
  isGuide?: boolean
  guideProfileId?: string | null
  membership?: string | null
  membershipPlan?: MembershipPlanSnapshot | null
  membershipStatus?: string | null
}

type RoleAwareSessionUser = Session['user'] & {
  id?: string
  role?: UserRole
  isHost?: boolean
  isGuide?: boolean
  guideProfileId?: string | null
  membership?: string | null
  membershipPlan?: MembershipPlanSnapshot | null
  membershipStatus?: string | null
}

// Custom adapter to handle OAuth provider IDs as strings (not ObjectIDs)
function CustomPrismaAdapter(p: typeof prisma): Adapter {
  const baseAdapter = PrismaAdapter(p)
  
  return {
    ...baseAdapter,
    async createUser(user: AdapterUser) {
      return baseAdapter.createUser!(user)
    },
    async getUser(id: string) {
      return baseAdapter.getUser!(id)
    },
    async getUserByEmail(email: string) {
      return baseAdapter.getUserByEmail!(email)
    },
    async getUserByAccount(providerAccount) {
      const { provider, providerAccountId } = providerAccount

      return baseAdapter.getUserByAccount!({
        provider,
        providerAccountId: String(providerAccountId),
      })
    },
    async updateUser(user: Partial<AdapterUser> & { id: string }) {
      return baseAdapter.updateUser!(user)
    },
    async linkAccount(account: AdapterAccount) {
      // Keep providerAccountId as string, don't convert to ObjectID
      return p.account.create({
        data: {
          ...account,
          providerAccountId: String(account.providerAccountId),
        },
      })
    },
    async createSession(session: AdapterSession) {
      return baseAdapter.createSession!(session)
    },
    async getSessionAndUser(sessionToken: string) {
      return baseAdapter.getSessionAndUser!(sessionToken)
    },
    async updateSession(session: Partial<AdapterSession> & { sessionToken: string }) {
      return baseAdapter.updateSession!(session)
    },
    async deleteSession(sessionToken: string) {
      await baseAdapter.deleteSession!(sessionToken)
    },
  }
}

export const authOptions: NextAuthOptions = {
  adapter: CustomPrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email và mật khẩu là bắt buộc')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            guideProfile: {
              select: {
                id: true,
              },
            },
          },
        })

        if (!user || !user.password) {
          throw new Error('Email hoặc mật khẩu không đúng')
        }

        const isValid = await verifyPassword(credentials.password, user.password)

        if (!isValid) {
          throw new Error('Email hoặc mật khẩu không đúng')
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          isHost: user.role === 'HOST',
          isGuide: user.isGuide ?? false,
          guideProfileId: user.guideProfile?.id ?? null,
          membership: user.loyaltyTier ?? null,
          membershipStatus: user.membershipStatus ?? null,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider && account.provider !== 'credentials') {
          // Ensure account record exists for this provider
          const existingAccount = await prisma.account.findFirst({
            where: {
              provider: account.provider,
              providerAccountId: String(account.providerAccountId),
            },
          })

          if (existingAccount) {
            // Account already linked - allow sign in
            return true
          }

          const email = profile?.email

          if (email) {
            const existingUser = await prisma.user.findUnique({
              where: { email },
              select: { id: true },
            })

            if (existingUser) {
              console.warn(
                `OAuth sign-in blocked: email ${email} is already registered with another provider.`
              )
              return false
            }
          }
        }
        return true
      } catch (error) {
        console.error('SignIn callback error:', error)
        // Allow sign in even if update fails
        return true
      }
    },
    async session({ session, token }) {
      const enrichedToken = token as RoleAwareToken

      if (session.user) {
        const sessionUser = session.user as RoleAwareSessionUser

        sessionUser.id = enrichedToken.id ?? sessionUser.id
        sessionUser.role = enrichedToken.role ?? sessionUser.role
        sessionUser.isHost = enrichedToken.isHost ?? sessionUser.isHost
        sessionUser.isGuide = enrichedToken.isGuide ?? sessionUser.isGuide
        if (enrichedToken.guideProfileId !== undefined) {
          sessionUser.guideProfileId = enrichedToken.guideProfileId ?? null
        } else if (typeof sessionUser.guideProfileId === 'undefined') {
          sessionUser.guideProfileId = null
        }
        if (typeof sessionUser.isGuide === 'undefined') {
          sessionUser.isGuide = false
        }
        if (enrichedToken.membership !== undefined) {
          sessionUser.membership = enrichedToken.membership ?? null
        } else {
          sessionUser.membership = sessionUser.membership ?? null
        }
        if (enrichedToken.membershipPlan !== undefined) {
          sessionUser.membershipPlan = enrichedToken.membershipPlan ?? null
        } else if (typeof sessionUser.membershipPlan === 'undefined') {
          sessionUser.membershipPlan = null
        }
        if (enrichedToken.membershipStatus !== undefined) {
          sessionUser.membershipStatus = enrichedToken.membershipStatus ?? null
        } else if (typeof sessionUser.membershipStatus === 'undefined') {
          sessionUser.membershipStatus = null
        }
      }
      return session
    },
    async jwt({
      token,
      user,
      trigger,
      session,
    }) {
      const enrichedToken = token as RoleAwareToken

      if (user) {
        const roleAwareUser = user as RoleAwareUser | (User & {
          role?: UserRole
          isHost?: boolean
          membership?: string | null
          loyaltyTier?: string | null
        })

        enrichedToken.id = roleAwareUser.id ?? enrichedToken.id
        enrichedToken.role = roleAwareUser.role ?? enrichedToken.role
        enrichedToken.isHost = roleAwareUser.isHost ?? enrichedToken.isHost
        enrichedToken.isGuide = roleAwareUser.isGuide ?? enrichedToken.isGuide
        if (roleAwareUser.guideProfileId !== undefined) {
          enrichedToken.guideProfileId = roleAwareUser.guideProfileId ?? null
        }
        const membershipFromUser =
          roleAwareUser.membership ??
          ("loyaltyTier" in roleAwareUser ? roleAwareUser.loyaltyTier : undefined)
        if (membershipFromUser !== undefined) {
          enrichedToken.membership = membershipFromUser
        }
        if ("membershipPlan" in roleAwareUser) {
          enrichedToken.membershipPlan =
            roleAwareUser.membershipPlan ?? enrichedToken.membershipPlan ?? null
        }
        if ("membershipStatus" in roleAwareUser) {
          enrichedToken.membershipStatus =
            roleAwareUser.membershipStatus ?? enrichedToken.membershipStatus ?? null
        }
      }
      
      // Handle session update
      if (trigger === 'update' && session?.user) {
        const sessionUser = session.user as RoleAwareSessionUser

        enrichedToken.id = sessionUser.id ?? enrichedToken.id
        enrichedToken.role = sessionUser.role ?? enrichedToken.role
        enrichedToken.isHost = sessionUser.isHost ?? enrichedToken.isHost
        enrichedToken.isGuide = sessionUser.isGuide ?? enrichedToken.isGuide
        if (sessionUser.guideProfileId !== undefined) {
          enrichedToken.guideProfileId = sessionUser.guideProfileId ?? null
        }
        if (sessionUser.membership !== undefined) {
          enrichedToken.membership = sessionUser.membership
        }
        if (sessionUser.membershipPlan !== undefined) {
          enrichedToken.membershipPlan = sessionUser.membershipPlan ?? null
        }
        if (sessionUser.membershipStatus !== undefined) {
          enrichedToken.membershipStatus = sessionUser.membershipStatus ?? null
        }
      }

      if (
        enrichedToken.id &&
        (typeof enrichedToken.membership === 'undefined' ||
          typeof enrichedToken.membershipPlan === 'undefined' ||
          typeof enrichedToken.membershipStatus === 'undefined' ||
          typeof enrichedToken.isGuide === 'undefined' ||
          typeof enrichedToken.guideProfileId === 'undefined')
      ) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: enrichedToken.id },
            select: {
              isGuide: true,
              loyaltyTier: true,
              membershipStatus: true,
              membershipPlan: {
                select: {
                  id: true,
                  slug: true,
                  name: true,
                  bookingDiscountRate: true,
                  applyDiscountToServices: true,
                  experienceDiscountRate: true,
                  color: true,
                  icon: true,
                  features: true,
                  exclusiveFeatures: true,
                },
              },
              guideProfile: {
                select: {
                  id: true,
                },
              },
            },
          })
          enrichedToken.membership = dbUser?.loyaltyTier ?? null
          enrichedToken.membershipStatus = dbUser?.membershipStatus ?? null
          enrichedToken.isGuide = dbUser?.isGuide ?? false
          enrichedToken.guideProfileId = dbUser?.guideProfile?.id ?? null
          enrichedToken.membershipPlan = dbUser?.membershipPlan
            ? {
                id: dbUser.membershipPlan.id,
                slug: dbUser.membershipPlan.slug,
                name: dbUser.membershipPlan.name,
                discountRate: dbUser.membershipPlan.bookingDiscountRate,
                applyDiscountToServices: dbUser.membershipPlan.applyDiscountToServices,
                experienceDiscountRate: dbUser.membershipPlan.experienceDiscountRate,
                color: dbUser.membershipPlan.color,
                icon: dbUser.membershipPlan.icon,
                features: dbUser.membershipPlan.features ?? null,
                exclusiveFeatures: dbUser.membershipPlan.exclusiveFeatures ?? null,
              }
            : null
        } catch (error) {
          console.error('Failed to resolve membership tier for token:', error)
        }
      }
      
      return enrichedToken
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.email) return

      try {
        const existing = await prisma.user.findUnique({
          where: { id: user.id },
          select: { referralCode: true },
        })

        if (existing?.referralCode) {
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          })
          return
        }

        const baseName = user.name || user.email.split('@')[0]
        let referralCode = generateReferralCode(baseName)
        let attempts = 0

        while (attempts < 5) {
          const existing = await prisma.user.findFirst({
            where: { referralCode },
          })
          if (!existing) break
          referralCode = generateReferralCode(baseName)
          attempts++
        }

        await prisma.user.update({
          where: { id: user.id },
          data: {
            referralCode,
            lastLoginAt: new Date(),
          },
        })

        // Ensure default user settings exist for the new account
        await prisma.userSettings
          .create({
            data: {
              userId: user.id,
            },
          })
          .catch((settingsError: unknown) => {
            const errorWithCode = settingsError as { code?: string }
            if (errorWithCode?.code !== 'P2002') {
              console.error('Failed to initialize user settings for new user:', settingsError)
            }
          })
      } catch (error) {
        console.error('createUser event error:', error)
      }
    },
    async signIn({ user, account, profile, isNewUser }) {
      if (!user?.id) return
      try {
        const existing = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            emailVerified: true,
            name: true,
            image: true,
          },
        })

  const updateData: Prisma.UserUpdateInput = {
          lastLoginAt: new Date(),
          emailVerified: existing?.emailVerified ?? new Date(),
        }

        const provider = account?.provider?.toLowerCase()
        const isOAuthFirstLogin =
          Boolean(isNewUser) && !!provider && ['google', 'facebook'].includes(provider)

        if (isOAuthFirstLogin) {
          const profileData = (profile ?? {}) as Record<string, unknown>
          const givenName = typeof profileData['given_name'] === 'string' ? profileData['given_name'] : undefined
          const familyName = typeof profileData['family_name'] === 'string' ? profileData['family_name'] : undefined
          const rawProfileName = typeof profileData['name'] === 'string' ? profileData['name'] : undefined
          const fallbackEmailName = typeof user.email === 'string' ? user.email.split('@')[0] : undefined
          const computedName =
            rawProfileName ||
            [givenName, familyName].filter((part): part is string => Boolean(part)).join(' ').trim() ||
            (typeof user.name === 'string' ? user.name : undefined) ||
            fallbackEmailName ||
            undefined

          const computedImage =
            (typeof profileData['picture'] === 'string' && profileData['picture']) ||
            (typeof profileData['image'] === 'string' && profileData['image']) ||
            (typeof profileData['avatar'] === 'string' && profileData['avatar']) ||
            (typeof profileData['avatar_url'] === 'string' && profileData['avatar_url']) ||
            (typeof user.image === 'string' ? user.image : undefined)

          if (!existing?.name && computedName) {
            updateData.name = computedName
          }

          if (!existing?.image && computedImage) {
            updateData.image = computedImage
          }
        }

        await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        })

        if (isOAuthFirstLogin) {
          await prisma.userSettings.upsert({
            where: { userId: user.id },
            update: {},
            create: { userId: user.id },
          })
        }
      } catch (error) {
        console.error('signIn event update error:', error)
      }
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NEXTAUTH_DEBUG === 'true',
}

// ========================================
// AUTH HELPER FUNCTIONS
// ========================================

/**
 * Get the current session
 * Use this on the server side to check if user is authenticated
 */
export async function getSession() {
  const { getServerSession } = await import('next-auth')
  return getServerSession(authOptions)
}

/**
 * Get the current authenticated user
 * Returns the full user object from database
 */
export async function getCurrentUser() {
  try {
    const session = await getSession()
    
    if (!session?.user?.email) {
      return null
    }

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        isHost: true,
        loyaltyPoints: true,
        loyaltyTier: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Check if user is authenticated
 * Simple boolean check for authentication status
 */
export async function isAuthenticated() {
  const session = await getSession()
  return !!session?.user
}

/**
 * Check if user is a host
 * Returns true if user has host permissions
 */
export async function isHost() {
  const user = await getCurrentUser()
  return user?.isHost === true
}

/**
 * Check if user is an admin
 * Returns true if user has admin role
 */
export async function isAdmin() {
  const user = await getCurrentUser()
  return user?.role === 'ADMIN'
}

/**
 * Require authentication
 * Throws error if user is not authenticated
 * Use in server actions/API routes
 */
export async function requireAuth() {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }
  
  return user
}

/**
 * Require host permissions
 * Throws error if user is not a host
 */
export async function requireHost() {
  const user = await requireAuth()
  
  if (!user.isHost) {
    throw new Error('Host permissions required')
  }
  
  return user
}

/**
 * Require admin permissions
 * Throws error if user is not an admin
 */
export async function requireAdmin() {
  const user = await requireAuth()
  
  if (user.role !== 'ADMIN') {
    throw new Error('Admin permissions required')
  }
  
  return user
}
