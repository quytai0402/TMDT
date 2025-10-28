"use client"

import { useMemo, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar,
  Map,
  Heart,
  Backpack,
  DollarSign,
  Users,
  Plus,
  Download,
  Share2,
  Clock
} from "lucide-react"
import { TripItineraryBuilder } from "@/components/trip-itinerary-builder"
import { MultiDestinationBooking } from "@/components/multi-destination-booking"
import { TripInspirationBoard } from "@/components/trip-inspiration-board"
import { TripPackingList } from "@/components/trip-packing-list"
import { TripBudgetTracker } from "@/components/trip-budget-tracker"
import { SharedTripPlanning } from "@/components/shared-trip-planning"
import { DESTINATIONS } from "@/data/destinations"

export default function TripPlanningHubPage() {
  const selectedDestinations = useMemo(() => DESTINATIONS.slice(0, 3), [])
  const [tripInfo] = useState(() => {
    const start = new Date()
    const end = new Date(start)
    end.setDate(start.getDate() + selectedDestinations.length * 3)

    return {
      name: `Hành trình khám phá ${selectedDestinations.map((d) => d.name).slice(0, 2).join(" & ")}`,
      startDate: start.toLocaleDateString("vi-VN"),
      endDate: end.toLocaleDateString("vi-VN"),
      destinations: selectedDestinations.map((destination) => destination.name),
      members: 4,
      status: "planning" as "planning" | "upcoming" | "ongoing" | "completed",
    }
  })

  const quickStats = useMemo(() => {
    const totalActivities = selectedDestinations.reduce((sum, destination) => sum + destination.experiences.length, 0)
    const totalIdeas = selectedDestinations.reduce((sum, destination) => sum + destination.mustTry.length, 0)
    const estimatedBudget = selectedDestinations.reduce((sum, destination) => sum + destination.avgPrice * 3, 0)
    const readinessRatio = Math.min(1, totalIdeas / (selectedDestinations.length * 6 || 1))

    return {
      activities: totalActivities,
      ideas: totalIdeas,
      budget: estimatedBudget,
      readiness: Math.round(readinessRatio * 100),
      heroImage: selectedDestinations[0]?.heroImage ?? "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200",
    }
  }, [selectedDestinations])

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Hero Section */}
        <div className="relative mb-8 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-blue-600/90 z-10" />
          <img
            src={quickStats.heroImage}
            alt="Trip planning"
            className="w-full h-64 object-cover"
          />
          <div className="absolute inset-0 z-20 flex items-center">
            <div className="container mx-auto px-8">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Badge className="mb-4 bg-white/20 backdrop-blur-sm">
                    {tripInfo.status === "planning" && "🗓️ Đang lên kế hoạch"}
                    {tripInfo.status === "upcoming" && "⏰ Sắp diễn ra"}
                    {tripInfo.status === "ongoing" && "✈️ Đang diễn ra"}
                    {tripInfo.status === "completed" && "✅ Đã hoàn thành"}
                  </Badge>
                  <h1 className="text-4xl font-bold text-white mb-3">
                    {tripInfo.name}
                  </h1>
                  <div className="flex items-center space-x-6 text-white/90">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5" />
                      <span>{tripInfo.startDate} - {tripInfo.endDate}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Map className="w-5 h-5" />
                      <span>{tripInfo.destinations.join(", ")}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-5 h-5" />
                      <span>{tripInfo.members} thành viên</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Button variant="outline" className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20">
                    <Share2 className="w-4 h-4 mr-2" />
                    Chia sẻ
                  </Button>
                  <Button className="bg-white text-primary hover:bg-white/90">
                    <Download className="w-4 h-4 mr-2" />
                    Xuất PDF
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{quickStats.activities}</p>
                <p className="text-sm text-muted-foreground">Hoạt động</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <Heart className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{quickStats.ideas}</p>
                <p className="text-sm text-muted-foreground">Ý tưởng</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {quickStats.budget.toLocaleString("vi-VN", {
                    style: "currency",
                    currency: "VND",
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p className="text-sm text-muted-foreground">Ngân sách</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                <Backpack className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{quickStats.readiness}%</p>
                <p className="text-sm text-muted-foreground">Đã chuẩn bị</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="itinerary" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-auto">
            <TabsTrigger value="itinerary" className="flex items-center space-x-2 py-3">
              <Calendar className="w-4 h-4" />
              <span>Lịch trình</span>
            </TabsTrigger>
            <TabsTrigger value="destinations" className="flex items-center space-x-2 py-3">
              <Map className="w-4 h-4" />
              <span>Điểm đến</span>
            </TabsTrigger>
            <TabsTrigger value="inspiration" className="flex items-center space-x-2 py-3">
              <Heart className="w-4 h-4" />
              <span>Ý tưởng</span>
            </TabsTrigger>
            <TabsTrigger value="packing" className="flex items-center space-x-2 py-3">
              <Backpack className="w-4 h-4" />
              <span>Đồ đạc</span>
            </TabsTrigger>
            <TabsTrigger value="budget" className="flex items-center space-x-2 py-3">
              <DollarSign className="w-4 h-4" />
              <span>Ngân sách</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center space-x-2 py-3">
              <Users className="w-4 h-4" />
              <span>Nhóm</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="itinerary">
            <TripItineraryBuilder />
          </TabsContent>

          <TabsContent value="destinations">
            <MultiDestinationBooking />
          </TabsContent>

          <TabsContent value="inspiration">
            <TripInspirationBoard />
          </TabsContent>

          <TabsContent value="packing">
            <TripPackingList />
          </TabsContent>

          <TabsContent value="budget">
            <TripBudgetTracker />
          </TabsContent>

          <TabsContent value="team">
            <SharedTripPlanning />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
