'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HostSidebar } from "@/components/host-sidebar"
import { DashboardStats } from "@/components/dashboard-stats"
import { RecentBookingsEnhanced } from "@/components/recent-bookings-enhanced"
import { RevenueChart } from "@/components/revenue-chart"
import { HostListings } from "@/components/host-listings"
import { useBooking } from '@/hooks/use-booking'
import { Loader2 } from 'lucide-react'

export default function HostDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { getBookings } = useBooking()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'HOST' && session?.user?.isHost !== true) {
        router.push('/')
      } else {
        loadDashboardData()
      }
    }
  }, [status, session])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load bookings for stats
      const bookingsData = await getBookings('host')
      
      // Calculate stats
      if (bookingsData?.bookings) {
        const bookings = bookingsData.bookings
        const totalRevenue = bookings
          .filter((b: any) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
          .reduce((sum: number, b: any) => sum + b.totalPrice, 0)
        
        const thisMonthBookings = bookings.filter((b: any) => {
          const bookingDate = new Date(b.createdAt)
          const now = new Date()
          return bookingDate.getMonth() === now.getMonth() && 
                 bookingDate.getFullYear() === now.getFullYear()
        })
        
        const pendingBookings = bookings.filter((b: any) => b.status === 'PENDING').length
        
        setStats({
          totalRevenue,
          monthlyBookings: thisMonthBookings.length,
          pendingBookings,
          totalBookings: bookings.length,
        })
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <HostSidebar />

            {/* Main Content */}
            <div className="flex-1 space-y-8">
              <div>
                <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">
                  Chào mừng trở lại, {session.user.name || 'Host'}
                </h1>
                <p className="text-muted-foreground">Quản lý các listing và booking của bạn</p>
              </div>

              <DashboardStats stats={stats} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <RevenueChart />
                <RecentBookingsEnhanced type="host" />
              </div>

              <HostListings />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
