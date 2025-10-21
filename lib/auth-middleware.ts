import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"

export interface AuthRequest extends NextRequest {
  user?: {
    userId: string
    email: string
    role?: string
  }
}

/**
 * Middleware to verify JWT token from Authorization header
 * Usage: const user = await verifyAuth(request)
 */
export async function verifyAuth(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization")
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null
    }

    const token = authHeader.substring(7) // Remove "Bearer " prefix
    const payload = verifyToken(token)

    if (!payload) {
      return null
    }

    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    }
  } catch (error) {
    console.error("Auth verification error:", error)
    return null
  }
}

/**
 * Middleware wrapper that requires authentication
 * Returns 401 if not authenticated
 */
export function withAuth(
  handler: (request: NextRequest, user: { userId: string; email: string; role?: string }) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const user = await verifyAuth(request)

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      )
    }

    return handler(request, user)
  }
}

/**
 * Middleware wrapper that requires specific role
 * Returns 401 if not authenticated, 403 if insufficient permissions
 */
export function withRole(
  requiredRole: string,
  handler: (request: NextRequest, user: { userId: string; email: string; role?: string }) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const user = await verifyAuth(request)

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      )
    }

    if (user.role !== requiredRole && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden", message: "Insufficient permissions" },
        { status: 403 }
      )
    }

    return handler(request, user)
  }
}
