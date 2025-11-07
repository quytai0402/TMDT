import { useEffect, useMemo, useRef, useState } from "react"
import { useSession } from "next-auth/react"

import { normalizeMembershipTier, resolveHighestMembershipTier, type NormalizedMembershipTier } from "@/lib/membership-tier"

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

export function useConciergeAccess(): ConciergeAccessState {
  const { data: session, status, update } = useSession()
  const initialTier = resolveHighestMembershipTier(session?.user?.membership, session?.user?.membershipPlan?.slug)
  const [resolvedTier, setResolvedTier] = useState<NormalizedMembershipTier | null>(initialTier)
  const [loading, setLoading] = useState<boolean>(status === "loading")
  const syncingRef = useRef(false)

  useEffect(() => {
    const nextTier = resolveHighestMembershipTier(session?.user?.membership, session?.user?.membershipPlan?.slug)

    if (!nextTier) {
      if (resolvedTier !== null) {
        setResolvedTier(null)
      }
      return
    }

    if (nextTier !== resolvedTier) {
      setResolvedTier(nextTier)
    }
  }, [session?.user?.membership, session?.user?.membershipPlan?.slug, resolvedTier])

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
    const tierFromStatus = normalizeMembershipTier(data.currentTier?.tier)

      if (tierFromStatus) {
        setResolvedTier(tierFromStatus)
        const sessionTier = normalizeMembershipTier(session?.user?.membership)
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
        const inferredTier = normalizeMembershipTier(planSlug)
        if (inferredTier) {
          setResolvedTier(inferredTier)
          const sessionTier = normalizeMembershipTier(session?.user?.membership)
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

    const cachedTier = resolveHighestMembershipTier(session?.user?.membership, session?.user?.membershipPlan?.slug)
    if (cachedTier === "DIAMOND") {
      setResolvedTier("DIAMOND")
      setLoading(false)
      return
    }

    void fetchMembershipStatus()
  }, [status, session?.user?.membership, session?.user?.membershipPlan?.slug])

  const hasAccess = useMemo(() => resolvedTier === "DIAMOND", [resolvedTier])

  return {
    hasAccess,
    resolvedTier,
    loading,
    refresh: fetchMembershipStatus,
  }
}
