"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProfileForm } from "@/components/profile-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Camera, Loader2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { MembershipDashboard } from "@/components/membership-dashboard"

interface UserProfile {
  id: string
  name: string | null
  email: string | null
  image: string | null
  phone: string | null
  bio: string | null
  createdAt: string
  _count?: {
    bookingsAsGuest: number
    listings: number
    reviewsWritten: number
  }
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      fetchProfile()
    }
  }, [status, router])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (!response.ok) throw new Error('Failed to fetch profile')
      const data = await response.json()
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-muted/30 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-muted/30 flex items-center justify-center">
          <p className="text-muted-foreground">Không tìm thấy thông tin người dùng</p>
        </main>
        <Footer />
      </div>
    )
  }

  const memberSince = new Date(profile.createdAt).getFullYear()
  const initials = profile.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || 'U'

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <div>
              <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Thông tin cá nhân</h1>
              <p className="text-muted-foreground">Quản lý thông tin tài khoản của bạn</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Ảnh đại diện</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={profile.image || undefined} alt={profile.name || 'User'} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <Button
                      size="icon"
                      className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary hover:bg-primary-hover"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">{profile.name || 'Người dùng'}</p>
                    <p className="text-sm text-muted-foreground">Thành viên từ {memberSince}</p>
                    {profile._count && (
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{profile._count.bookingsAsGuest} đặt phòng</span>
                        <span>{profile._count.reviewsWritten} đánh giá</span>
                        {profile._count.listings > 0 && (
                          <span>{profile._count.listings} listings</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <MembershipDashboard />

            <ProfileForm profile={profile} onUpdate={fetchProfile} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
