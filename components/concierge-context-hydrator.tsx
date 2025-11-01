'use client'

import { useEffect } from 'react'

import { useConciergeContext } from './concierge-context-provider'

interface ListingConciergeHydratorProps {
  listingId: string
  listingSlug?: string | null
  listingTitle: string
  metadata?: Record<string, unknown>
}

export function ListingConciergeHydrator({
  listingId,
  listingSlug,
  listingTitle,
  metadata,
}: ListingConciergeHydratorProps) {
  const { context, setContext, clearContext } = useConciergeContext()

  useEffect(() => {
    const nextContext = {
      source: 'listing' as const,
      listingId,
      listingSlug: listingSlug ?? undefined,
      listingTitle,
      metadata,
    }

    setContext(nextContext)

    return () => {
      if (
        context &&
        context.source === 'listing' &&
        context.listingId === listingId
      ) {
        clearContext()
      }
    }
  }, [listingId, listingSlug, listingTitle, metadata, setContext, clearContext, context])

  return null
}
