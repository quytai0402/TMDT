import { useState, useCallback, useEffect, useRef } from "react"
import { SearchParams, SearchResult } from "@/types"

export interface UseSearchPaginationOptions {
  initialParams: SearchParams
  enableInfiniteScroll?: boolean
  scrollThreshold?: number // px from bottom to trigger load
}

export function useSearchPagination({
  initialParams,
  enableInfiniteScroll = true,
  scrollThreshold = 500,
}: UseSearchPaginationOptions) {
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  
  const observerTarget = useRef<HTMLDivElement>(null)
  const searchParamsRef = useRef<SearchParams>(initialParams)

  // Update search params
  const updateSearchParams = useCallback((newParams: Partial<SearchParams>) => {
    searchParamsRef.current = {
      ...searchParamsRef.current,
      ...newParams,
      page: 1, // Reset to first page on new search
    }
    setListings([])
    setCurrentPage(1)
    setHasMore(true)
    setError(null)
  }, [])

  // Fetch listings
  const fetchListings = useCallback(async (page: number, append = false) => {
    if (loading) return

    try {
      setLoading(true)
      setError(null)

      const params = {
        ...searchParamsRef.current,
        page,
        limit: searchParamsRef.current.limit || 20,
      }

      // Build query string
      const queryParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          if (Array.isArray(value)) {
            value.forEach((v) => queryParams.append(key, v.toString()))
          } else {
            queryParams.set(key, value.toString())
          }
        }
      })

      const response = await fetch(`/api/search?${queryParams}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch listings")
      }

      const data: SearchResult = await response.json()

      if (append) {
        setListings((prev) => [...prev, ...data.listings])
      } else {
        setListings(data.listings)
      }

      setTotalCount(data.total)
      setHasMore(page < data.totalPages)
      setCurrentPage(page)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      console.error("Search pagination error:", err)
    } finally {
      setLoading(false)
    }
  }, [loading])

  // Load more (for infinite scroll)
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchListings(currentPage + 1, true)
    }
  }, [loading, hasMore, currentPage, fetchListings])

  // Go to specific page (for traditional pagination)
  const goToPage = useCallback((page: number) => {
    if (page < 1) return
    setListings([])
    fetchListings(page, false)
  }, [fetchListings])

  // Refresh current results
  const refresh = useCallback(() => {
    setListings([])
    setCurrentPage(1)
    setHasMore(true)
    fetchListings(1, false)
  }, [fetchListings])

  // Infinite scroll observer
  useEffect(() => {
    if (!enableInfiniteScroll || !observerTarget.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(observerTarget.current)

    return () => observer.disconnect()
  }, [enableInfiniteScroll, hasMore, loading, loadMore])

  // Scroll threshold detection (alternative to IntersectionObserver)
  useEffect(() => {
    if (!enableInfiniteScroll) return

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const scrollHeight = document.documentElement.scrollHeight
      const clientHeight = document.documentElement.clientHeight

      if (scrollHeight - scrollTop - clientHeight < scrollThreshold) {
        if (hasMore && !loading) {
          loadMore()
        }
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [enableInfiniteScroll, scrollThreshold, hasMore, loading, loadMore])

  // Initial fetch
  useEffect(() => {
    fetchListings(1, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    // Data
    listings,
    loading,
    error,
    hasMore,
    totalCount,
    currentPage,
    totalPages: Math.ceil(totalCount / (searchParamsRef.current.limit || 20)),

    // Actions
    loadMore,
    goToPage,
    refresh,
    updateSearchParams,

    // Ref for infinite scroll trigger element
    observerTarget,
  }
}

// ============================================
// USAGE EXAMPLE
// ============================================

/*
// Infinite Scroll Example
function SearchPage() {
  const { 
    listings, 
    loading, 
    error, 
    hasMore, 
    observerTarget,
    updateSearchParams 
  } = useSearchPagination({
    initialParams: {
      location: "Hanoi",
      guests: 2,
      minPrice: 0,
      maxPrice: 5000000,
    },
    enableInfiniteScroll: true,
  })

  return (
    <div>
      <SearchBar onSearch={(params) => updateSearchParams(params)} />
      
      <div className="grid grid-cols-3 gap-4">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage error={error} />}
      
      {hasMore && (
        <div ref={observerTarget} className="h-10" />
      )}
      
      {!hasMore && listings.length > 0 && (
        <p className="text-center text-muted-foreground">
          Đã hiển thị tất cả {listings.length} kết quả
        </p>
      )}
    </div>
  )
}

// Traditional Pagination Example
function SearchPageWithPagination() {
  const { 
    listings, 
    loading, 
    currentPage,
    totalPages,
    goToPage,
    updateSearchParams 
  } = useSearchPagination({
    initialParams: {
      location: "Hanoi",
    },
    enableInfiniteScroll: false,
  })

  return (
    <div>
      <SearchBar onSearch={(params) => updateSearchParams(params)} />
      
      <div className="grid grid-cols-3 gap-4">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>

      {loading && <LoadingSpinner />}
      
      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={goToPage}
      />
    </div>
  )
}
*/
