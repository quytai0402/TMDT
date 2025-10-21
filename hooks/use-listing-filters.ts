'use client'

import { create } from 'zustand'

interface ListingFilterState {
  category: string
  setCategory: (category: string) => void
}

export const useListingFilters = create<ListingFilterState>((set) => ({
  category: 'trending',
  setCategory: (category) => set({ category }),
}))
