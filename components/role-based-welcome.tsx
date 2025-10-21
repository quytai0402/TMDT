'use client'

import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { 
  Home, 
  Calendar, 
  TrendingUp, 
  Users, 
  Shield,
  Heart,
  MessageSquare,
  Star
} from 'lucide-react'

export function RoleBasedWelcome() {
  const { data: session, status } = useSession()
  const router = useRouter()

  if (status === 'loading') {
    return null
  }

  if (!session?.user) {
    return null
  }

  const { user } = session

  // Guest Welcome
  if (user.role === 'GUEST') {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 py-8">
        <div className="container mx-auto px-4">
          <Card className="border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    Xin chào, {user.name}! 👋
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    Khám phá những homestay tuyệt vời cho chuyến đi tiếp theo của bạn
                  </p>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <Button 
                      onClick={() => router.push('/trips')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Chuyến đi của tôi
                    </Button>
                    <Button 
                      onClick={() => router.push('/wishlist')}
                      variant="outline"
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      Yêu thích
                    </Button>
                  </div>
                </div>
                <div className="hidden md:flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      <Calendar className="w-8 h-8 mx-auto mb-1" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">Chuyến đi</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-500">
                      <Heart className="w-8 h-8 mx-auto mb-1" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">Yêu thích</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-500">
                      <Star className="w-8 h-8 mx-auto mb-1" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">Đánh giá</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Host Welcome
  if (user.role === 'HOST') {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 py-8">
        <div className="container mx-auto px-4">
          <Card className="border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <h2 className="text-2xl font-bold text-green-900 dark:text-green-100">
                    Chào chủ nhà {user.name}! 🏠
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    Quản lý homestay và tối ưu doanh thu của bạn
                  </p>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <Button 
                      onClick={() => router.push('/host/dashboard')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                    <Button 
                      onClick={() => router.push('/host/listings')}
                      variant="outline"
                    >
                      <Home className="w-4 h-4 mr-2" />
                      Quản lý listings
                    </Button>
                    <Button 
                      onClick={() => router.push('/host/calendar')}
                      variant="outline"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Lịch đặt phòng
                    </Button>
                  </div>
                </div>
                <div className="hidden md:flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      <Home className="w-8 h-8 mx-auto mb-1" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">Listings</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-500">
                      <Calendar className="w-8 h-8 mx-auto mb-1" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">Đặt phòng</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-500">
                      <TrendingUp className="w-8 h-8 mx-auto mb-1" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">Doanh thu</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Admin Welcome
  if (user.role === 'ADMIN') {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 py-8">
        <div className="container mx-auto px-4">
          <Card className="border-purple-200 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <h2 className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    Quản trị viên {user.name}! ⚡
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    Quản lý toàn bộ hệ thống và giám sát hoạt động
                  </p>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <Button 
                      onClick={() => router.push('/admin')}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Admin Panel
                    </Button>
                    <Button 
                      onClick={() => router.push('/admin/users')}
                      variant="outline"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Người dùng
                    </Button>
                    <Button 
                      onClick={() => router.push('/admin/listings')}
                      variant="outline"
                    >
                      <Home className="w-4 h-4 mr-2" />
                      Listings
                    </Button>
                  </div>
                </div>
                <div className="hidden md:flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      <Users className="w-8 h-8 mx-auto mb-1" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">Người dùng</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-500">
                      <Home className="w-8 h-8 mx-auto mb-1" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">Listings</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">
                      <TrendingUp className="w-8 h-8 mx-auto mb-1" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">Thống kê</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return null
}
