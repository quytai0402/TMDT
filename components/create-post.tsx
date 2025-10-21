"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { ImagePlus, Video, MapPin, Smile } from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"

interface CreatePostProps {
  userAvatar?: string
  userName?: string
}

export function CreatePost({ userAvatar, userName }: CreatePostProps) {
  const [content, setContent] = useState("")
  const [showFullEditor, setShowFullEditor] = useState(false)

  const handlePost = () => {
    // Handle post creation
    console.log("Creating post:", content)
    setContent("")
    setShowFullEditor(false)
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={userAvatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200"} alt={userName || "User"} />
              <AvatarFallback>{userName?.[0] || "U"}</AvatarFallback>
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
                      disabled={!content.trim()}
                    >
                      Đăng
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
