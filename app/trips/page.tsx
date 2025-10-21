'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { TripCard } from "@/components/trip-card"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useBooking } from '@/hooks/use-booking'
import { Loader2, Calendar, Plus, Map, Users, Clock, Edit, Share2, Trash2, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { RewardsOverview } from '@/components/rewards-overview'
import { DailyCheckIn } from '@/components/daily-check-in'

export default function TripsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { getBookings, loading } = useBooking()
  const [upcomingTrips, setUpcomingTrips] = useState<any[]>([])
  const [currentTrips, setCurrentTrips] = useState<any[]>([])
  const [pastTrips, setPastTrips] = useState<any[]>([])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      loadTrips()
    }
  }, [status])

  const loadTrips = async () => {
    try {
      const bookings = await getBookings('guest')
      
      if (bookings?.bookings) {
        const now = new Date()
        
        // Categorize bookings
        const upcoming: any[] = []
        const current: any[] = []
        const past: any[] = []
        
        bookings.bookings.forEach((booking: any) => {
          const checkIn = new Date(booking.checkIn)
          const checkOut = new Date(booking.checkOut)
          
          if (now < checkIn) {
            upcoming.push(booking)
          } else if (now >= checkIn && now <= checkOut) {
            current.push(booking)
          } else {
            past.push(booking)
          }
        })
        
        setUpcomingTrips(upcoming)
        setCurrentTrips(current)
        setPastTrips(past)
      }
    } catch (error) {
      console.error('Error loading trips:', error)
    }
  }

  if (status === 'loading') {
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
      <main className="flex-1 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">
                Chuyến đi của bạn
              </h1>
              <p className="text-muted-foreground">
                Quản lý bookings và lên kế hoạch cho chuyến đi
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button asChild variant="outline">
                <Link href="/">
                  <Calendar className="mr-2 h-4 w-4" />
                  Tìm chỗ ở
                </Link>
              </Button>
              <Button asChild>
                <Link href="/trips/planner">
                  <Plus className="mr-2 h-4 w-4" />
                  Lập kế hoạch
                </Link>
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Tổng bookings</div>
              <div className="text-3xl font-bold">
                {upcomingTrips.length + currentTrips.length + pastTrips.length}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Sắp diễn ra</div>
              <div className="text-3xl font-bold text-orange-600">
                {upcomingTrips.length}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Đang diễn ra</div>
              <div className="text-3xl font-bold text-green-600">
                {currentTrips.length}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Đã hoàn thành</div>
              <div className="text-3xl font-bold text-blue-600">
                {pastTrips.length}
              </div>
            </Card>
          </div>

          {/* Rewards and Daily Check-in */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="md:col-span-2">
              <RewardsOverview />
            </div>
            <div className="md:col-span-1">
              <DailyCheckIn />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Tabs defaultValue="upcoming" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="upcoming">
                  Sắp tới ({upcomingTrips.length})
                </TabsTrigger>
                <TabsTrigger value="current">
                  Đang diễn ra ({currentTrips.length})
                </TabsTrigger>
                <TabsTrigger value="past">
                  Đã hoàn thành ({pastTrips.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="space-y-6">
                {upcomingTrips.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Bạn chưa có chuyến đi nào sắp tới
                    </p>
                    <Button asChild>
                      <Link href="/">Khám phá chỗ ở</Link>
                    </Button>
                  </div>
                ) : (
                  upcomingTrips.map((trip) => (
                    <TripCard key={trip.id} trip={trip} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="current" className="space-y-6">
                {currentTrips.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Bạn không có chuyến đi nào đang diễn ra
                    </p>
                  </div>
                ) : (
                  currentTrips.map((trip) => (
                    <TripCard key={trip.id} trip={trip} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="past" className="space-y-6">
                {pastTrips.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Bạn chưa có chuyến đi nào đã hoàn thành
                    </p>
                  </div>
                ) : (
                  pastTrips.map((trip) => (
                    <TripCard key={trip.id} trip={trip} />
                  ))
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
