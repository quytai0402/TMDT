"use client"

import { SocialPost } from "@/components/social-post"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useState, useEffect } from "react"

export function SocialFeed() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [cursor, setCursor] = useState<string | null>(null)

  useEffect(() => {
    fetchPosts()
  }, [])

  useEffect(() => {
    const handlePostCreated = (event: Event) => {
      const customEvent = event as CustomEvent<any>
      const newPost = customEvent.detail
      if (!newPost) return
      setPosts((prev) => {
        if (prev.some((post) => post.id === newPost.id)) {
          return prev
        }
        return [newPost, ...prev]
      })
    }

    if (typeof window !== "undefined") {
      window.addEventListener("community:post-created", handlePostCreated as EventListener)
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("community:post-created", handlePostCreated as EventListener)
      }
    }
  }, [])

  async function fetchPosts(nextCursor?: string | null) {
    try {
      setLoadingMore(true)
      const url = nextCursor 
        ? `/api/community/posts?cursor=${nextCursor}&limit=10`
        : '/api/community/posts?limit=10'
      
      const res = await fetch(url)
      const data = await res.json()
      
      if (nextCursor) {
        setPosts(prev => [...prev, ...(data.posts || [])])
      } else {
        setPosts(data.posts || [])
      }
      
      setCursor(data.nextCursor)
      setHasMore(!!data.nextCursor)
    } catch (error) {
      console.error("Error fetching posts:", error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMore = async () => {
    if (cursor && !loadingMore) {
      await fetchPosts(cursor)
    }
  }

  if (loading && posts.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <SocialPost key={post.id} {...post} />
      ))}

      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang tải...
              </>
            ) : (
              "Xem thêm"
            )}
          </Button>
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">
          Bạn đã xem hết các bài viết
        </p>
      )}
    </div>
  )
}
