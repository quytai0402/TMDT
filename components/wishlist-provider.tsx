"use client"

import type { ReactNode } from "react"
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"

interface WishlistContextValue {
  wishlistIds: Set<string>
  isLoading: boolean
  addToWishlistOptimistic: (listingId: string) => void
  removeFromWishlistOptimistic: (listingId: string) => void
  refreshWishlist: () => Promise<void>
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)

  const resetWishlist = useCallback(() => {
    setWishlistIds(new Set())
  }, [])

  const fetchWishlist = useCallback(async () => {
    if (!session?.user?.id) {
      resetWishlist()
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/wishlist")
      if (!response.ok) {
        resetWishlist()
        return
      }

      const data = await response.json()
      const ids = Array.isArray(data)
        ? data.map((item: { id: string }) => item.id)
        : Array.isArray(data?.listingIds)
        ? data.listingIds
        : []

      setWishlistIds(new Set(ids))
    } catch (error) {
      resetWishlist()
    } finally {
      setIsLoading(false)
    }
  }, [resetWishlist, session?.user?.id])

  useEffect(() => {
    if (!session?.user?.id) {
      resetWishlist()
      return
    }

    void fetchWishlist()
  }, [fetchWishlist, resetWishlist, session?.user?.id])

  const addToWishlistOptimistic = useCallback((listingId: string) => {
    setWishlistIds((prev) => {
      if (prev.has(listingId)) return prev
      const next = new Set(prev)
      next.add(listingId)
      return next
    })
  }, [])

  const removeFromWishlistOptimistic = useCallback((listingId: string) => {
    setWishlistIds((prev) => {
      if (!prev.has(listingId)) return prev
      const next = new Set(prev)
      next.delete(listingId)
      return next
    })
  }, [])

  const contextValue = useMemo<WishlistContextValue>(() => ({
    wishlistIds,
    isLoading,
    addToWishlistOptimistic,
    removeFromWishlistOptimistic,
    refreshWishlist: fetchWishlist,
  }), [wishlistIds, isLoading, addToWishlistOptimistic, removeFromWishlistOptimistic, fetchWishlist])

  return <WishlistContext.Provider value={contextValue}>{children}</WishlistContext.Provider>
}

export function useWishlistContext() {
  const context = useContext(WishlistContext)
  if (!context) {
    throw new Error("useWishlistContext must be used within a WishlistProvider")
  }
  return context
}
