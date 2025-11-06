'use client'

import { useMemo } from 'react'
import { useSession } from 'next-auth/react'

const ACTIVE_STATUSES = new Set(['ACTIVE'])

export function useMembershipAccess() {
  const { data: session, status } = useSession()
  const membershipStatus = session?.user?.membershipStatus ?? null
  const membershipTier = session?.user?.membership ?? null

  const hasMembership = useMemo(() => {
    if (!membershipStatus && !membershipTier) {
      return false
    }
    if (membershipStatus) {
      return ACTIVE_STATUSES.has(membershipStatus.toUpperCase())
    }
    return Boolean(membershipTier)
  }, [membershipStatus, membershipTier])

  return {
    hasMembership,
    membershipTier,
    membershipStatus,
    isAuthenticated: status === 'authenticated',
    session,
    status,
  }
}
