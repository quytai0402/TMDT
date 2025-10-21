'use client'

import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  Star,
  PlusCircle,
  BarChart3,
  Settings,
  FileText
} from 'lucide-react'

export function QuickActions() {
  const { data: session, status } = useSession()
  const router = useRouter()

  if (status === 'loading' || !session?.user) {
    return null
  }

  const { user } = session

  // Guest Quick Actions
  if (user.role === 'GUEST') {
    const actions = [
      {
        title: 'Tìm homestay',
        description: 'Khám phá và đặt chỗ',
        icon: Home,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 dark:bg-blue-950',
        onClick: () => {
          window.scrollTo({ top: 600, behavior: 'smooth' })
        }
      },
      {
        title: 'Chuyến đi',
        description: 'Xem các chuyến đã đặt',
        icon: Calendar,
        color: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-950',
        onClick: () => router.push('/trips')
      },
      {
        title: 'Yêu thích',
        description: 'Danh sách yêu thích',
        icon: Heart,
        color: 'text-red-600',
        bgColor: 'bg-red-50 dark:bg-red-950',
        onClick: () => router.push('/wishlist')
      },
      {
        title: 'Hồ sơ',
        description: 'Cài đặt tài khoản',
        icon: Settings,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50 dark:bg-gray-950',
        onClick: () => router.push('/profile')
      }
    ]

    return (
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Thao tác nhanh</h2>
          <p className="text-muted-foreground">Truy cập nhanh các tính năng chính</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action, index) => (
            <Card 
              key={index}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={action.onClick}
            >
              <CardContent className="p-6">
                <div className={`w-12 h-12 rounded-lg ${action.bgColor} flex items-center justify-center mb-4`}>
                  <action.icon className={`w-6 h-6 ${action.color}`} />
                </div>
                <h3 className="font-semibold mb-1">{action.title}</h3>
                <p className="text-sm text-muted-foreground">{action.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Host Quick Actions
  if (user.role === 'HOST') {
    const actions = [
      {
        title: 'Dashboard',
        description: 'Tổng quan kinh doanh',
        icon: BarChart3,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50 dark:bg-purple-950',
        onClick: () => router.push('/host/dashboard')
      },
      {
        title: 'Thêm listing',
        description: 'Tạo homestay mới',
        icon: PlusCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-950',
        onClick: () => router.push('/host/listings/new')
      },
      {
        title: 'Quản lý listings',
        description: 'Chỉnh sửa homestay',
        icon: Home,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 dark:bg-blue-950',
        onClick: () => router.push('/host/listings')
      },
      {
        title: 'Lịch đặt phòng',
        description: 'Xem lịch và booking',
        icon: Calendar,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50 dark:bg-orange-950',
        onClick: () => router.push('/host/calendar')
      },
      {
        title: 'Đánh giá',
        description: 'Reviews từ khách',
        icon: Star,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50 dark:bg-yellow-950',
        onClick: () => router.push('/host/reviews')
      },
      {
        title: 'Doanh thu',
        description: 'Báo cáo tài chính',
        icon: TrendingUp,
        color: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-950',
        onClick: () => router.push('/host/revenue')
      },
      {
        title: 'Tin nhắn',
        description: 'Chat với khách',
        icon: MessageSquare,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50 dark:bg-indigo-950',
        onClick: () => router.push('/messages')
      },
      {
        title: 'Cài đặt',
        description: 'Thiết lập tài khoản',
        icon: Settings,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50 dark:bg-gray-950',
        onClick: () => router.push('/profile')
      }
    ]

    return (
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Quản lý chủ nhà</h2>
          <p className="text-muted-foreground">Công cụ quản lý homestay và doanh thu</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action, index) => (
            <Card 
              key={index}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={action.onClick}
            >
              <CardContent className="p-6">
                <div className={`w-12 h-12 rounded-lg ${action.bgColor} flex items-center justify-center mb-4`}>
                  <action.icon className={`w-6 h-6 ${action.color}`} />
                </div>
                <h3 className="font-semibold mb-1">{action.title}</h3>
                <p className="text-sm text-muted-foreground">{action.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Admin Quick Actions
  if (user.role === 'ADMIN') {
    const actions = [
      {
        title: 'Admin Panel',
        description: 'Tổng quan hệ thống',
        icon: Shield,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50 dark:bg-purple-950',
        onClick: () => router.push('/admin')
      },
      {
        title: 'Người dùng',
        description: 'Quản lý users',
        icon: Users,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 dark:bg-blue-950',
        onClick: () => router.push('/admin/users')
      },
      {
        title: 'Listings',
        description: 'Duyệt homestay',
        icon: Home,
        color: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-950',
        onClick: () => router.push('/admin/listings')
      },
      {
        title: 'Bookings',
        description: 'Quản lý đặt phòng',
        icon: Calendar,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50 dark:bg-orange-950',
        onClick: () => router.push('/admin/bookings')
      },
      {
        title: 'Thống kê',
        description: 'Báo cáo & phân tích',
        icon: BarChart3,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50 dark:bg-indigo-950',
        onClick: () => router.push('/admin/analytics')
      },
      {
        title: 'Reviews',
        description: 'Kiểm duyệt đánh giá',
        icon: Star,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50 dark:bg-yellow-950',
        onClick: () => router.push('/admin/reviews')
      },
      {
        title: 'Báo cáo',
        description: 'Xử lý reports',
        icon: FileText,
        color: 'text-red-600',
        bgColor: 'bg-red-50 dark:bg-red-950',
        onClick: () => router.push('/admin/reports')
      },
      {
        title: 'Cài đặt',
        description: 'Cấu hình hệ thống',
        icon: Settings,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50 dark:bg-gray-950',
        onClick: () => router.push('/admin/settings')
      }
    ]

    return (
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Quản trị hệ thống</h2>
          <p className="text-muted-foreground">Công cụ quản lý toàn bộ nền tảng</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action, index) => (
            <Card 
              key={index}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={action.onClick}
            >
              <CardContent className="p-6">
                <div className={`w-12 h-12 rounded-lg ${action.bgColor} flex items-center justify-center mb-4`}>
                  <action.icon className={`w-6 h-6 ${action.color}`} />
                </div>
                <h3 className="font-semibold mb-1">{action.title}</h3>
                <p className="text-sm text-muted-foreground">{action.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return null
}
