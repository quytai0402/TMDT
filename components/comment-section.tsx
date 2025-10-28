"use client"

import { useState, useEffect, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Loader2, Send } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface Comment {
  id: string
  content: string
  createdAt: string
  author: {
    id: string
    name: string
    image: string | null
    isVerified: boolean
    role: string
  }
  likesCount: number
}

interface CommentSectionProps {
  postId: string
  onCommentAdded?: (comment: Comment) => void
}

export function CommentSection({ postId, onCommentAdded }: CommentSectionProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`)
      const data = await res.json()
      setComments(data.comments || [])
    } catch (error) {
      console.error("Error fetching comments:", error)
    } finally {
      setLoading(false)
    }
  }, [postId])

  useEffect(() => {
    void fetchComments()
  }, [fetchComments])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!session) {
      router.push('/login')
      return
    }

    if (!newComment.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment })
      })

      if (res.ok) {
        const data = await res.json()
        setComments([data.comment, ...comments])
        setNewComment("")
        onCommentAdded?.(data.comment)
      }
    } catch (error) {
      console.error("Error posting comment:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return "Vừa xong"
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`
    return `${Math.floor(diffInMinutes / 1440)} ngày trước`
  }

  return (
    <div className="border-t pt-4 space-y-4">
      {/* Comment Input */}
      {session ? (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={session.user?.image || ''} />
            <AvatarFallback>{session.user?.name?.[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 flex gap-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Viết bình luận..."
              className="min-h-[80px] resize-none"
              disabled={submitting}
            />
            <Button 
              type="submit" 
              size="sm" 
              disabled={!newComment.trim() || submitting}
              className="shrink-0"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      ) : (
        <div className="text-center py-4 text-sm text-muted-foreground">
          <Button variant="link" onClick={() => router.push('/login')}>
            Đăng nhập
          </Button>
          {' '}để bình luận
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-4">
          Chưa có bình luận nào
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={comment.author.image || ''} />
                <AvatarFallback>{comment.author.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="bg-muted rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{comment.author.name}</span>
                    {comment.author.isVerified && (
                      <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                        ✓
                      </Badge>
                    )}
                    {comment.author.role === 'HOST' && (
                      <Badge variant="outline" className="h-4 px-1 text-[10px]">
                        Chủ nhà
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm">{comment.content}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground px-3">
                  <span>{formatTimestamp(comment.createdAt)}</span>
                  <button className="hover:underline">Thích</button>
                  <button className="hover:underline">Trả lời</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
