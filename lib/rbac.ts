import type { User } from "next-auth"

type Role = "ADMIN" | "HOST" | "GUEST" | string | undefined | null

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Quản trị",
  HOST: "Chủ nhà",
  GUEST: "Khách",
}

export function isAdmin(role: Role) {
  return role === "ADMIN"
}

export function isHost(role: Role) {
  return role === "HOST" || isAdmin(role)
}

export function isGuest(role: Role) {
  return role === "GUEST"
}

export function canManageListings(role: Role) {
  return isHost(role)
}

export function canAccessAdmin(role: Role) {
  return isAdmin(role)
}

export function resolveRoleLabel(role: Role) {
  if (!role) return ROLE_LABELS.GUEST
  return ROLE_LABELS[role] ?? role
}

export function getUserRole(user?: User | null) {
  return user?.role ?? "GUEST"
}
