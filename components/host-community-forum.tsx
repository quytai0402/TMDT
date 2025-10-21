"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { pusherClient } from "@/lib/pusher"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { MessageCircle, ThumbsUp, Clock, Sparkles, Search, Loader2, Edit3, X, Send } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

type CommunityPost = {
  id: string
  author: {
    id: string
    name: string
    avatar?: string | null
    role: string
    verified: boolean
  }
  content: string
  media: Array<{ type: string; url: string; caption?: string }>
  listing?: {
    id: string
    title: string
    location: string
    image?: string
  }
  location?: string
  likes: number
  comments: number
  shares: number
  timestamp: string
  isLiked: boolean
}

type FeedEvent =
  | { type: "post-created"; payload: CommunityPost }
  | { type: "post-updated"; payload: CommunityPost }
  | { type: "post-deleted"; payload: { id: string } }
  | { type: "post-engagement"; payload: { id: string; likesCount: number; userId: string; liked: boolean } }

const FEED_LIMIT = 30

const filterOptions = [
  { id: "all", label: "Tất cả" },
  { id: "featured", label: "Nổi bật" },
  { id: "listing", label: "Có đính kèm listing" },
  { id: "unanswered", label: "Chưa có bình luận" },
]

export function HostCommunityForum() {
  const { data: session } = useSession()
  const currentUserId = session?.user?.id ?? null
  const { toast } = useToast()

  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<string>("all")
  const [newPostContent, setNewPostContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")

  useEffect(() => {
    let isMounted = true
    const fetchPosts = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/community/posts?limit=${FEED_LIMIT}`, { cache: "no-store" })
        if (!response.ok) {
          throw new Error("Không thể tải bài viết")
        }
        const data = await response.json()
        if (isMounted) {
          setPosts(data.posts ?? [])
          setError(null)
        }
      } catch (err) {
        console.error(err)
        const message = err instanceof Error ? err.message : "Không thể tải bài viết cộng đồng. Vui lòng thử lại."
        if (isMounted) {
          setError(message)
        }
        toast({
          variant: "destructive",
          title: "Không thể tải diễn đàn",
          description: message,
        })
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchPosts()
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!pusherClient) return

    const channel = pusherClient.subscribe("community-feed")

    const handleEvent = (event: FeedEvent["type"], payload: FeedEvent["payload"]) => {
      setPosts((prev) => {
        switch (event) {
          case "post-created": {
            const existingIndex = prev.findIndex((item) => item.id === (payload as CommunityPost).id)
            const next = existingIndex >= 0 ? [...prev] : [payload as CommunityPost, ...prev]
            if (existingIndex >= 0) {
              next[existingIndex] = payload as CommunityPost
            }
            return next.slice(0, FEED_LIMIT)
          }
          case "post-updated": {
            const updatedPost = payload as CommunityPost
            return prev.map((post) =>
              post.id === updatedPost.id
                ? {
                    ...post,
                    ...updatedPost,
                    isLiked: post.isLiked,
                  }
                : post
            )
          }
          case "post-deleted": {
            const { id } = payload as { id: string }
            return prev.filter((post) => post.id !== id)
          }
          case "post-engagement": {
            const { id, likesCount, userId, liked } = payload as {
              id: string
              likesCount: number
              userId: string
              liked: boolean
            }
            return prev.map((post) =>
              post.id === id
                ? {
                    ...post,
                    likes: likesCount,
                    isLiked: currentUserId === userId ? liked : post.isLiked,
                  }
                : post
            )
          }
          default:
            return prev
        }
      })
    }

    channel.bind("post-created", (payload: CommunityPost) => handleEvent("post-created", payload))
    channel.bind("post-updated", (payload: CommunityPost) => handleEvent("post-updated", payload))
    channel.bind("post-deleted", (payload: { id: string }) => handleEvent("post-deleted", payload))
    channel.bind(
      "post-engagement",
      (payload: { id: string; likesCount: number; userId: string; liked: boolean }) =>
        handleEvent("post-engagement", payload)
    )

    return () => {
      channel.unbind_all()
      pusherClient.unsubscribe("community-feed")
    }
  }, [currentUserId])

  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return posts.filter((post) => {
      const matchesQuery =
        query.length === 0 ||
        post.content.toLowerCase().includes(query) ||
        post.author.name.toLowerCase().includes(query) ||
        (post.location && post.location.toLowerCase().includes(query))

      if (!matchesQuery) return false

      switch (activeFilter) {
        case "featured":
          return post.likes >= 10 || post.comments >= 5
        case "listing":
          return Boolean(post.listing)
        case "unanswered":
          return post.comments === 0
        default:
          return true
      }
    })
  }, [posts, searchQuery, activeFilter])

  const formatTimeAgo = (timestamp: string) => {
    const formatter = new Intl.RelativeTimeFormat("vi", { numeric: "auto" })
    const now = Date.now()
    const value = new Date(timestamp).getTime()
    const diff = value - now
    const minutes = Math.round(diff / (1000 * 60))

    if (Math.abs(minutes) < 60) {
      return formatter.format(minutes, "minute")
    }
    const hours = Math.round(minutes / 60)
    if (Math.abs(hours) < 24) {
      return formatter.format(hours, "hour")
    }
    const days = Math.round(hours / 24)
    if (Math.abs(days) < 7) {
      return formatter.format(days, "day")
    }
    const weeks = Math.round(days / 7)
    if (Math.abs(weeks) < 5) {
      return formatter.format(weeks, "week")
    }
    const months = Math.round(days / 30)
    return formatter.format(months, "month")
  }

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return
    setSubmitting(true)
    try {
      const response = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newPostContent.trim() }),
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error || "Không thể đăng bài")
      }
      setNewPostContent("")
      toast({
        title: "Đã chia sẻ bài viết",
        description: "Bài viết của bạn đã xuất hiện trên cộng đồng.",
      })
    } catch (err) {
      console.error(err)
      const message = err instanceof Error ? err.message : "Không thể đăng bài. Vui lòng thử lại."
      setError(message)
      toast({
        variant: "destructive",
        title: "Đăng bài thất bại",
        description: message,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleLikeToggle = async (post: CommunityPost) => {
    try {
      setPosts((prev) =>
        prev.map((item) =>
          item.id === post.id
            ? {
                ...item,
                likes: item.isLiked ? item.likes - 1 : item.likes + 1,
                isLiked: !item.isLiked,
              }
            : item
        )
      )

      await fetch(`/api/community/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: post.isLiked ? "unlike" : "like" }),
      })
    } catch (error) {
      console.error(error)
      setPosts((prev) =>
        prev.map((item) =>
          item.id === post.id
            ? {
                ...item,
                likes: post.likes,
                isLiked: post.isLiked,
              }
            : item
        )
      )
      toast({
        variant: "destructive",
        title: "Không thể cập nhật lượt thích",
        description: "Vui lòng thử lại sau.",
      })
    }
  }

  const startEditing = (post: CommunityPost) => {
    setEditingPostId(post.id)
    setEditContent(post.content)
  }

  const cancelEditing = () => {
    setEditingPostId(null)
    setEditContent("")
  }

  const saveEdit = async (postId: string) => {
    const trimmed = editContent.trim()
    if (!trimmed) return

    try {
      const response = await fetch(`/api/community/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", content: trimmed }),
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      setEditingPostId(null)
      setEditContent("")
    } catch (error) {
      console.error(error)
      setError("Không thể cập nhật bài viết. Vui lòng thử lại.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Diễn đàn cộng đồng</h2>
          <p className="text-muted-foreground">
            Nơi các host chia sẻ kinh nghiệm, hỏi đáp và hỗ trợ nhau theo thời gian thực.
          </p>
        </div>
        {currentUserId ? (
          <Button onClick={() => document.getElementById("community-new-post")?.scrollIntoView({ behavior: "smooth" })}>
            <Sparkles className="h-4 w-4 mr-2" />
            Tạo bài viết mới
          </Button>
        ) : (
          <Badge variant="outline" className="text-xs">
            Đăng nhập để tham gia thảo luận
          </Badge>
        )}
      </div>

      {currentUserId && (
        <Card id="community-new-post">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Chia sẻ kinh nghiệm của bạn</CardTitle>
            <CardDescription>Mẹo vận hành, câu chuyện thực tế hoặc thắc mắc cần giải đáp.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={newPostContent}
              onChange={(event) => setNewPostContent(event.target.value)}
              placeholder="Bạn đang nghĩ gì về việc vận hành homestay hôm nay?"
              rows={4}
              maxLength={5000}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{newPostContent.length}/5000 ký tự</span>
              <Button onClick={handleCreatePost} disabled={submitting || newPostContent.trim().length === 0}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang đăng...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Đăng bài
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Tìm kiếm bài viết hoặc chủ đề..."
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <Button
              key={option.id}
              type="button"
              variant={activeFilter === option.id ? "default" : "outline"}
              onClick={() => setActiveFilter(option.id)}
              size="sm"
              className="rounded-full"
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">Đang tải các thảo luận mới nhất...</span>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">{error}</CardContent>
        </Card>
      ) : filteredPosts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-2">
            <Sparkles className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="font-semibold">Chưa có bài viết phù hợp</p>
            <p className="text-sm text-muted-foreground">Hãy thay đổi bộ lọc hoặc là người đầu tiên đặt câu hỏi.</p>
          </CardContent>
        </Card>
      ) : (
        filteredPosts.map((post) => {
          const isAuthor = currentUserId === post.author.id
          const isEditing = editingPostId === post.id

          return (
            <Card key={post.id} className="shadow-sm border border-border/60">
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.author.avatar ?? undefined} alt={post.author.name} />
                      <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{post.author.name}</span>
                        {post.author.verified && <Badge className="text-xs">Verified</Badge>}
                        <Badge variant="outline" className="text-xs capitalize">
                          {post.author.role}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatTimeAgo(post.timestamp)}</span>
                        {post.location && (
                          <>
                            <Separator orientation="vertical" className="h-3" />
                            <span>{post.location}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {isAuthor && !isEditing && (
                    <Button variant="ghost" size="sm" onClick={() => startEditing(post)}>
                      <Edit3 className="h-4 w-4 mr-2" />
                      Chỉnh sửa
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editContent}
                      onChange={(event) => setEditContent(event.target.value)}
                      rows={4}
                    />
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => saveEdit(post.id)}>
                        Lưu thay đổi
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelEditing}>
                        <X className="h-4 w-4 mr-1" />
                        Hủy
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm leading-6 whitespace-pre-wrap text-foreground">{post.content}</p>
                )}

                {post.listing && (
                  <div className="flex items-center gap-4 rounded-lg border border-border/60 p-3 bg-muted/30">
                    <div className="h-16 w-24 overflow-hidden rounded-md bg-muted">
                      {post.listing.image ? (
                        <img
                          src={post.listing.image}
                          alt={post.listing.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="text-sm">
                      <p className="font-medium">{post.listing.title}</p>
                      <p className="text-muted-foreground">{post.listing.location}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => handleLikeToggle(post)}
                    className={`inline-flex items-center gap-2 transition-colors ${
                      post.isLiked ? "text-primary font-medium" : "hover:text-primary"
                    }`}
                  >
                    <ThumbsUp className={`h-4 w-4 ${post.isLiked ? "fill-current" : ""}`} />
                    {post.likes}
                  </button>
                  <div className="inline-flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    {post.comments}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}
