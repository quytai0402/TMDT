'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

export type ConciergeContextSource = 'listing' | 'booking' | 'trip' | 'latest-booking'

export interface ConciergeContextValue {
  context: ConciergeContextState | null
  setContext: (context: ConciergeContextState | null) => void
  clearContext: () => void
}

export interface ConciergeContextState {
  source: ConciergeContextSource
  listingId?: string
  listingSlug?: string
  listingTitle?: string
  bookingId?: string
  tripId?: string
  metadata?: Record<string, unknown>
  updatedAt: number
}

function areContextsEquivalent(a: ConciergeContextState, b: ConciergeContextState) {
  if (a.source !== b.source) return false
  if (a.listingId !== b.listingId) return false
  if (a.listingSlug !== b.listingSlug) return false
  if (a.listingTitle !== b.listingTitle) return false
  if (a.bookingId !== b.bookingId) return false
  if (a.tripId !== b.tripId) return false

  const aMetadata = a.metadata ?? {}
  const bMetadata = b.metadata ?? {}
  const aKeys = Object.keys(aMetadata)
  const bKeys = Object.keys(bMetadata)

  if (aKeys.length !== bKeys.length) return false

  for (const key of aKeys) {
    if (aMetadata[key] !== bMetadata[key]) {
      return false
    }
  }

  return true
}

const ConciergeContext = createContext<ConciergeContextValue | undefined>(undefined)

export function ConciergeContextProvider({ children }: { children: ReactNode }) {
  const [context, setContextState] = useState<ConciergeContextState | null>(null)

  const setContext = useCallback((next: ConciergeContextState | null) => {
    if (next === null) {
      setContextState(null)
      return
    }

    setContextState((prev) => {
      const nextValue: ConciergeContextState = {
        ...next,
        updatedAt: Date.now(),
      }

      if (prev && areContextsEquivalent(prev, nextValue)) {
        return prev
      }

      return nextValue
    })
  }, [])

  const clearContext = useCallback(() => {
    setContextState(null)
  }, [])

  const value = useMemo<ConciergeContextValue>(
    () => ({ context, setContext, clearContext }),
    [context, setContext, clearContext],
  )

  return <ConciergeContext.Provider value={value}>{children}</ConciergeContext.Provider>
}

export function useConciergeContext() {
  const value = useContext(ConciergeContext)
  if (!value) {
    throw new Error('useConciergeContext must be used within a ConciergeContextProvider')
  }
  return value
}
