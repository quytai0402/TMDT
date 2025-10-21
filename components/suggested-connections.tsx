"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserPlus, UserCheck } from "lucide-react"
import { useState } from "react"
import Link from "next/link"

interface SuggestedUser {
  id: string
  name: string
  avatar: string
  role: "guest" | "host"
  bio: string
  mutualFriends?: number
  verified?: boolean
}

const suggestedUsers: SuggestedUser[] = [
  {
    id: "1",
    name: "Nguyễn Minh Anh",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
    role: "host",
    bio: "Chủ homestay tại Đà Lạt • Travel lover",
    mutualFriends: 12,
    verified: true
  },
  {
    id: "2",
    name: "Trần Văn Thành",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
    role: "guest",
    bio: "Digital nomad • 15 countries visited",
    mutualFriends: 8
  },
  {
    id: "3",
    name: "Lê Thị Hương",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
    role: "host",
    bio: "Villa owner in Nha Trang • Luxury stays",
    mutualFriends: 5,
    verified: true
  }
]

export function SuggestedConnections() {
  const [following, setFollowing] = useState<Set<string>>(new Set())

  const handleFollow = (userId: string) => {
    setFollowing(prev => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Gợi ý kết nối</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestedUsers.map((user) => (
          <div key={user.id} className="flex items-start gap-3">
            <Link href={`/profile/${user.id}`}>
              <Avatar className="h-12 w-12 cursor-pointer hover:opacity-80 transition-opacity">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{user.name[0]}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Link href={`/profile/${user.id}`}>
                  <p className="font-semibold text-sm hover:underline cursor-pointer truncate">
                    {user.name}
                  </p>
                </Link>
                {user.verified && (
                  <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                    ✓
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                {user.bio}
              </p>
              {user.mutualFriends && (
                <p className="text-xs text-muted-foreground mt-1">
                  {user.mutualFriends} bạn chung
                </p>
              )}
              <Button
                size="sm"
                variant={following.has(user.id) ? "outline" : "default"}
                className="mt-2 h-7 text-xs"
                onClick={() => handleFollow(user.id)}
              >
                {following.has(user.id) ? (
                  <>
                    <UserCheck className="h-3 w-3 mr-1" />
                    Đang theo dõi
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3 w-3 mr-1" />
                    Theo dõi
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}

        <Button variant="ghost" size="sm" className="w-full">
          Xem thêm
        </Button>
      </CardContent>
    </Card>
  )
}
