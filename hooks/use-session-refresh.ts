"use client"

import { useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export function useSessionRefresh() {
  const router = useRouter()
  const { data: session, update } = useSession()

  return useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      })

      if (!response.ok) {
        return false
      }

      const payload = await response.json()

      if (typeof update === "function") {
        await update({
          user: {
            ...(session?.user ?? {}),
            ...(payload.user ?? {}),
          },
        })
      }

      router.refresh()
      return true
    } catch (error) {
      console.error("Session refresh failed:", error)
      return false
    }
  }, [router, session?.user, update])
}
