"use client"

import { useEffect, useRef } from "react"
import { useSession } from "next-auth/react"

import { useSessionRefresh } from "@/hooks/use-session-refresh"

const MIN_REFRESH_INTERVAL = 30 * 1000 // 30 seconds

export function SessionRefreshListener() {
  const { status } = useSession()
  const refreshSession = useSessionRefresh()
  const lastRefreshRef = useRef(0)

  useEffect(() => {
    if (status !== "authenticated") {
      return
    }

    const triggerRefresh = () => {
      const now = Date.now()
      if (now - lastRefreshRef.current < MIN_REFRESH_INTERVAL) {
        return
      }
      lastRefreshRef.current = now
      void refreshSession()
    }

    // Initial refresh once user is authenticated
    triggerRefresh()

    const handleFocus = () => triggerRefresh()
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        triggerRefresh()
      }
    }

    window.addEventListener("focus", handleFocus)
    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      window.removeEventListener("focus", handleFocus)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [refreshSession, status])

  return null
}
