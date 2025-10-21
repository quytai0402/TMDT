'use client'

import { useEffect } from 'react'

export function ListingViewTracker({ listingId }: { listingId: string }) {
  useEffect(() => {
    // Track listing view quest (async, don't block)
    import('@/lib/quests').then(({ trackListingViewQuest }) => {
      trackListingViewQuest(listingId).catch(err => {
        console.error('Failed to track listing view quest:', err)
      })
    })
  }, [listingId])

  return null // This component doesn't render anything
}
