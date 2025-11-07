import { getServerSession } from "next-auth"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { UserRole } from "@prisma/client"

type SessionUser = Session["user"]

const ADMIN_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.SUPER_ADMIN]

export class AuthorizationError extends Error {
  status: number
  constructor(message: string, status = 403) {
    super(message)
    this.name = "AuthorizationError"
    this.status = status
  }
}

function hasRole(user: SessionUser, roles: UserRole[]) {
  return roles.includes(user.role)
}

export function isHostUser(user: SessionUser) {
  return Boolean(user.isHost || user.role === UserRole.HOST || hasRole(user, ADMIN_ROLES))
}

export async function requireSessionUser(options?: { roles?: UserRole[] }) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    throw new AuthorizationError("Unauthorized", 401)
  }

  if (options?.roles && !hasRole(session.user, options.roles)) {
    throw new AuthorizationError("Forbidden", 403)
  }

  return session
}

export async function requireHostSession() {
  const session = await requireSessionUser()

  if (!isHostUser(session.user)) {
    throw new AuthorizationError("Host access required", 403)
  }

  return session
}

export async function requireAdminSession() {
  return requireSessionUser({ roles: ADMIN_ROLES })
}

export function isAuthorizationError(error: unknown): error is AuthorizationError {
  return error instanceof AuthorizationError
}
