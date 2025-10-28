"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { ImagePlus, Video, MapPin, Smile, Loader2 } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useSession } from "next-auth/react"

interface CreatePostProps {
  userAvatar?: string
  userName?: string
  onPostCreated?: (post: any) => void
}

export function CreatePost({ userAvatar, userName, onPostCreated }: CreatePostProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [content, setContent] = useState("")
  const [showFullEditor, setShowFullEditor] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const displayName = userName ?? session?.user?.name ?? "Bạn"
  const displayAvatar =
    userAvatar ||
    session?.user?.image ||
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200"

  const resetComposer = () => {
    setContent("")
    setShowFullEditor(false)
    setSubmitting(false)
  }

  const handlePost = async () => {
    if (!content.trim()) {
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch("/api/community/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: content.trim(),
          media: [],
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || "Không thể đăng bài viết")
      }

      const post = await response.json()
      onPostCreated?.(post)
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("community:post-created", { detail: post }))
      }

      toast({
        title: "Đã đăng bài",
        description: "Bài chia sẻ của bạn đã gửi tới cộng đồng.",
      })

      resetComposer()
    } catch (error) {
      console.error(error)
      toast({
        variant: "destructive",
        title: "Đăng bài không thành công",
        description: error instanceof Error ? error.message : "Vui lòng thử lại.",
      })
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={displayAvatar} alt={displayName} />
              <AvatarFallback>{displayName?.[0] || "U"}</AvatarFallback>
            </Avatar>
            
            {!showFullEditor ? (
              <div 
                className="flex-1 px-4 py-3 rounded-full bg-muted cursor-text hover:bg-muted/80 transition-colors"
                onClick={() => setShowFullEditor(true)}
              >
                <span className="text-muted-foreground">Chia sẻ trải nghiệm của bạn...</span>
              </div>
            ) : (
              <div className="flex-1 space-y-3">
                <Textarea
                  placeholder="Chia sẻ trải nghiệm của bạn về chuyến đi, homestay, hoặc địa điểm du lịch..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[120px] resize-none"
                  autoFocus
                />
                
                {/* Attach Options */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-9">
                      <ImagePlus className="h-4 w-4 mr-2" />
                      Ảnh
                    </Button>
                    <Button variant="ghost" size="sm" className="h-9">
                      <Video className="h-4 w-4 mr-2" />
                      Video
                    </Button>
                    <Button variant="ghost" size="sm" className="h-9">
                      <MapPin className="h-4 w-4 mr-2" />
                      Địa điểm
                    </Button>
                    <Button variant="ghost" size="sm" className="h-9">
                      <Smile className="h-4 w-4 mr-2" />
                      Cảm xúc
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setShowFullEditor(false)
                        setContent("")
                      }}
                    >
                      Hủy
                    </Button>
                    <Button 
                      size="sm"
                      onClick={handlePost}
                      disabled={!content.trim() || submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Đang đăng
                        </>
                      ) : (
                        "Đăng"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {!showFullEditor && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <Button variant="ghost" size="sm" className="flex-1 h-9">
                <ImagePlus className="h-4 w-4 mr-2" />
                Ảnh/Video
              </Button>
              <Button variant="ghost" size="sm" className="flex-1 h-9">
                <MapPin className="h-4 w-4 mr-2" />
                Địa điểm
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
