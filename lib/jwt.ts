import jwt, { SignOptions } from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "a1abab3cbb3c183f39e8865a3c9e8457"

export interface JWTPayload {
  userId: string
  email: string
  role?: string
  iat?: number
  exp?: number
}

/**
 * Generate JWT token for user authentication
 * @param payload User data to encode in token
 * @param expiresIn Token expiration time (default: 30d)
 * @returns Signed JWT token
 */
export function generateToken(payload: Omit<JWTPayload, "iat" | "exp">, expiresIn: string | number = "30d"): string {
  const options: SignOptions = {
    expiresIn: expiresIn as any,
    algorithm: "HS256",
  }
  
  return jwt.sign(payload, JWT_SECRET, options)
}

/**
 * Verify and decode JWT token
 * @param token JWT token to verify
 * @returns Decoded payload or null if invalid
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    }) as JWTPayload

    return decoded
  } catch (error) {
    console.error("JWT verification failed:", error)
    return null
  }
}

/**
 * Decode JWT token without verification (for debugging)
 * @param token JWT token to decode
 * @returns Decoded payload or null
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload
    return decoded
  } catch (error) {
    console.error("JWT decode failed:", error)
    return null
  }
}

/**
 * Generate refresh token (longer expiration)
 * @param payload User data to encode
 * @returns Refresh token
 */
export function generateRefreshToken(payload: Omit<JWTPayload, "iat" | "exp">): string {
  return generateToken(payload, "90d")
}

/**
 * Check if token is expired
 * @param token JWT token to check
 * @returns true if expired, false otherwise
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token)
  if (!decoded || !decoded.exp) return true

  const currentTime = Math.floor(Date.now() / 1000)
  return decoded.exp < currentTime
}
