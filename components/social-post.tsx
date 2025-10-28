"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, MessageCircle, Share2, MapPin, MoreHorizontal, Bookmark } from "lucide-react"
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { CommentSection } from "@/components/comment-section"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface PostMedia {
  type: "image" | "video"
  url: string
  thumbnail?: string
}

interface PostAuthor {
  id: string
  name: string
  avatar: string
  role: "guest" | "host"
  verified?: boolean
}

interface PostListing {
  id: string
  title: string
  location: string
  image: string
}

interface SocialPostProps {
  id: string
  author: PostAuthor
  content: string
  media?: PostMedia[]
  listing?: PostListing
  location?: string
  likes: number
  comments: number
  shares: number
  timestamp: string
  isLiked?: boolean
  isBookmarked?: boolean
}

export function SocialPost({
  id,
  author,
  content,
  media,
  listing,
  location,
  likes: initialLikes,
  comments,
  shares,
  timestamp,
  isLiked: initialIsLiked = false,
  isBookmarked: initialIsBookmarked = false
}: SocialPostProps) {
  const [likes, setLikes] = useState(initialLikes)
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked)
  const [showComments, setShowComments] = useState(false)
  const [isLiking, setIsLiking] = useState(false)
  const [commentCount, setCommentCount] = useState<number>(comments)

  const handleLike = async () => {
    if (isLiking) return
    
    setIsLiking(true)
    const wasLiked = isLiked
    
    // Optimistic update
    setIsLiked(!isLiked)
    setLikes(isLiked ? likes - 1 : likes + 1)
    
    try {
      const response = await fetch(`/api/community/posts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: wasLiked ? 'unlike' : 'like' })
      })
      
      if (response.status === 401) {
        setIsLiked(wasLiked)
        setLikes(wasLiked ? likes : likes - 1)
        window.location.href = `/login?callbackUrl=%2Fcommunity`
        return
      }

      if (!response.ok) {
        // Revert on error
        setIsLiked(wasLiked)
        setLikes(wasLiked ? likes : likes - 1)
      }
    } catch (error) {
      console.error('Error liking post:', error)
      // Revert on error
      setIsLiked(wasLiked)
      setLikes(wasLiked ? likes : likes - 1)
    } finally {
      setIsLiking(false)
    }
  }

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked)
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return "Vừa xong"
    if (diffInHours < 24) return `${diffInHours} giờ trước`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} ngày trước`
    return date.toLocaleDateString('vi-VN')
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/profile/${author.id}`}>
              <Avatar className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity">
                <AvatarImage src={author.avatar} alt={author.name} />
                <AvatarFallback>{author.name[0]}</AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Link href={`/profile/${author.id}`}>
                  <p className="font-semibold hover:underline cursor-pointer">{author.name}</p>
                </Link>
                {author.verified && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                    ✓
                  </Badge>
                )}
                {author.role === "host" && (
                  <Badge variant="outline" className="h-5 px-1.5 text-xs">
                    Chủ nhà
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatTimestamp(timestamp)}</span>
                {location && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{location}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Báo cáo bài viết</DropdownMenuItem>
              <DropdownMenuItem>Ẩn bài viết</DropdownMenuItem>
              <DropdownMenuItem>Không theo dõi {author.name}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pb-3 space-y-3">
        {/* Content */}
        <p className="text-sm whitespace-pre-wrap">{content}</p>

        {/* Media Grid */}
        {media && media.length > 0 && (
          <div className={`grid gap-2 ${
            media.length === 1 ? "grid-cols-1" : 
            media.length === 2 ? "grid-cols-2" : 
            "grid-cols-2"
          }`}>
            {media.slice(0, 4).map((item, index) => (
              <div 
                key={index} 
                className={`relative overflow-hidden rounded-lg ${
                  media.length === 3 && index === 0 ? "col-span-2" : ""
                } ${media.length === 1 ? "aspect-video" : "aspect-square"}`}
              >
                <Image
                  src={item.type === "video" ? item.thumbnail || item.url : item.url}
                  alt={`Post media ${index + 1}`}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                />
                {item.type === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                      <div className="w-0 h-0 border-l-8 border-l-black border-y-6 border-y-transparent ml-1" />
                    </div>
                  </div>
                )}
                {media.length > 4 && index === 3 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">+{media.length - 4}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Linked Listing */}
        {listing && (
          <Link href={`/listing/${listing.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex gap-3 p-3">
                <div className="relative w-24 h-24 rounded-lg overflow-hidden shrink-0">
                  <Image
                    src={listing.image}
                    alt={listing.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm line-clamp-2">{listing.title}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{listing.location}</span>
                  </div>
                  <Button variant="outline" size="sm" className="mt-2 h-7 text-xs">
                    Xem homestay
                  </Button>
                </div>
              </div>
            </Card>
          </Link>
        )}
      </CardContent>

      <CardFooter className="flex-col pt-0 pb-4 gap-3">
        {/* Stats */}
        <div className="w-full flex items-center justify-between text-sm text-muted-foreground border-b pb-3">
          <div className="flex items-center gap-4">
            <span className="hover:underline cursor-pointer">
              {likes} lượt thích
            </span>
            <span className="hover:underline cursor-pointer">
              {commentCount} bình luận
            </span>
          </div>
          <span className="hover:underline cursor-pointer">
            {shares} chia sẻ
          </span>
        </div>

        {/* Actions */}
        <div className="w-full grid grid-cols-4 gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={isLiked ? "text-red-500" : ""}
            disabled={isLiking}
          >
            <Heart className={`h-4 w-4 mr-2 ${isLiked ? "fill-current" : ""}`} />
            Thích
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Bình luận
          </Button>
          <Button variant="ghost" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Chia sẻ
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBookmark}
            className={isBookmarked ? "text-primary" : ""}
          >
            <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""}`} />
          </Button>
        </div>

        {/* Comment Section */}
        {showComments && (
          <div className="w-full">
            <CommentSection
              postId={id}
              onCommentAdded={() => setCommentCount((prev) => prev + 1)}
            />
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
