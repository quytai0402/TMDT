import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import FacebookProvider from 'next-auth/providers/facebook'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateReferralCode } from '@/lib/helpers'
import type { Profile as NextAuthProfile, Session, User } from 'next-auth'
import type {
  Adapter,
  AdapterAccount,
  AdapterSession,
  AdapterUser,
} from 'next-auth/adapters'
import type { JWT } from 'next-auth/jwt'
import type { UserRole } from '@prisma/client'

type RoleAwareUser = AdapterUser & {
  role?: UserRole
  isHost?: boolean
}

type RoleAwareToken = JWT & {
  id?: string
  role?: UserRole
  isHost?: boolean
}

type RoleAwareSessionUser = Session['user'] & {
  id?: string
  role?: UserRole
  isHost?: boolean
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
        })

        enrichedToken.id = roleAwareUser.id ?? enrichedToken.id
        enrichedToken.role = roleAwareUser.role ?? enrichedToken.role
        enrichedToken.isHost = roleAwareUser.isHost ?? enrichedToken.isHost
      }
      
      // Handle session update
      if (trigger === 'update' && session?.user) {
        const sessionUser = session.user as RoleAwareSessionUser

        enrichedToken.id = sessionUser.id ?? enrichedToken.id
        enrichedToken.role = sessionUser.role ?? enrichedToken.role
        enrichedToken.isHost = sessionUser.isHost ?? enrichedToken.isHost
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
          const existing = await prisma.user.findUnique({
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
      } catch (error) {
        console.error('createUser event error:', error)
      }
    },
    async signIn({ user }) {
      if (!user?.id) return
      try {
        const existing = await prisma.user.findUnique({
          where: { id: user.id },
          select: { emailVerified: true },
        })

        await prisma.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
            emailVerified: existing?.emailVerified ?? new Date(),
          },
        })
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
  debug: process.env.NODE_ENV === 'development',
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
