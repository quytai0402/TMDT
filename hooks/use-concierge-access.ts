import { useEffect, useMemo, useRef, useState } from "react"
import { useSession } from "next-auth/react"

interface ConciergeAccessState {
  hasAccess: boolean
  resolvedTier: string | null
  loading: boolean
  refresh: () => Promise<string | null>
}

interface MembershipStatusResponse {
  currentTier?: {
    tier?: string | null
  } | null
  membership?: {
    status?: string | null
    isActive?: boolean | null
    plan?: {
      slug?: string | null
    } | null
  } | null
}

function normalizeTier(value: string | null | undefined) {
  return value ? value.toUpperCase() : null
}

export function useConciergeAccess(): ConciergeAccessState {
  const { data: session, status, update } = useSession()
  const sessionTier = normalizeTier(session?.user?.membership)
  const [resolvedTier, setResolvedTier] = useState<string | null>(sessionTier)
  const [loading, setLoading] = useState<boolean>(status === "loading")
  const syncingRef = useRef(false)

  useEffect(() => {
    if (sessionTier && sessionTier !== resolvedTier) {
      setResolvedTier(sessionTier)
    }
  }, [sessionTier, resolvedTier])

  const fetchMembershipStatus = async () => {
    if (status !== "authenticated") {
      setLoading(false)
      return null
    }

    setLoading(true)
    try {
      const response = await fetch("/api/membership/status", {
        cache: "no-store",
        credentials: "include",
      })

      if (!response.ok) {
        return null
      }

      const data = (await response.json()) as MembershipStatusResponse
      const tierFromStatus = normalizeTier(data.currentTier?.tier)

      if (tierFromStatus) {
        setResolvedTier(tierFromStatus)
        if (!sessionTier || sessionTier !== tierFromStatus) {
          if (!syncingRef.current) {
            syncingRef.current = true
            await update({ membership: tierFromStatus }).finally(() => {
              syncingRef.current = false
            })
          }
        }
        return tierFromStatus
      }

      const planSlug = data.membership?.plan?.slug
      if (planSlug) {
        const inferredTier = normalizeTier(planSlug.split("-").pop())
        if (inferredTier) {
          setResolvedTier(inferredTier)
          if (!sessionTier || sessionTier !== inferredTier) {
            if (!syncingRef.current) {
              syncingRef.current = true
              await update({ membership: inferredTier }).finally(() => {
                syncingRef.current = false
              })
            }
          }
          return inferredTier
        }
      }

      return null
    } catch (error) {
      console.error("Failed to resolve concierge access:", error)
      return null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status !== "authenticated") {
      setResolvedTier(null)
      setLoading(false)
      return
    }

    if (sessionTier === "DIAMOND") {
      setResolvedTier("DIAMOND")
      setLoading(false)
      return
    }

    void fetchMembershipStatus()
  }, [status, sessionTier])

  const hasAccess = useMemo(() => resolvedTier === "DIAMOND", [resolvedTier])

  return {
    hasAccess,
    resolvedTier,
    loading,
    refresh: fetchMembershipStatus,
  }
}
