"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  MessageSquare,
  Utensils,
  Car,
  HelpCircle,
  Sparkles,
  Phone,
  Mail,
  Clock,
  Lock
} from "lucide-react"
import { ConciergeChat } from "@/components/concierge-chat"
import { LocalRestaurantRecommendations } from "@/components/local-restaurant-recommendations"
import { TransportationBooking } from "@/components/transportation-booking"
import { SpecialRequestsHandler } from "@/components/special-requests-handler"
import { normalizeMembershipTier, resolveHighestMembershipTier } from "@/lib/membership-tier"

export default function ConciergePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const membershipTier = normalizeMembershipTier(session?.user?.membership)
  const planTier = normalizeMembershipTier(session?.user?.membershipPlan?.slug)
  const isDiamondMember = resolveHighestMembershipTier(membershipTier, planTier) === "DIAMOND"

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?redirect=/concierge")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Đang tải...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="p-8 max-w-md text-center">
            <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Yêu cầu đăng nhập</h2>
            <p className="text-muted-foreground mb-4">
              Bạn cần đăng nhập để sử dụng dịch vụ Concierge
            </p>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  if (session && !isDiamondMember) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <Card className="p-8 max-w-md text-center space-y-4">
            <Lock className="h-16 w-16 mx-auto text-muted-foreground" />
            <h2 className="text-2xl font-bold">Concierge chỉ dành cho Diamond</h2>
            <p className="text-muted-foreground">
              Dịch vụ Concierge 24/7 hiện chỉ khả dụng cho thành viên Diamond. Nâng cấp membership để mở khóa trợ lý cá nhân và các đặc quyền độc quyền.
            </p>
            <Button onClick={() => router.push("/membership")} className="w-full">
              Nâng cấp membership
            </Button>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Concierge 24/7</h1>
            <p className="text-muted-foreground">
              Chúng tôi luôn sẵn sàng hỗ trợ mọi nhu cầu của bạn
            </p>
          </div>
          <Badge className="bg-green-500 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-white mr-2"></span>
            Đang online
          </Badge>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Thời gian phản hồi</p>
                <p className="font-bold">~ 5 phút</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Đánh giá dịch vụ</p>
                <p className="font-bold">4.9/5 ⭐</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Phone className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Hotline 24/7</p>
                <p className="font-bold text-sm">1900 xxxx</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-bold text-sm">concierge@...</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="chat" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chat" className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4" />
            <span>Chat</span>
          </TabsTrigger>
          <TabsTrigger value="restaurants" className="flex items-center space-x-2">
            <Utensils className="w-4 h-4" />
            <span>Nhà hàng</span>
          </TabsTrigger>
          <TabsTrigger value="transport" className="flex items-center space-x-2">
            <Car className="w-4 h-4" />
            <span>Di chuyển</span>
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center space-x-2">
            <HelpCircle className="w-4 h-4" />
            <span>Yêu cầu</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <ConciergeChat />
        </TabsContent>

        <TabsContent value="restaurants">
          <LocalRestaurantRecommendations />
        </TabsContent>

        <TabsContent value="transport">
          <TransportationBooking />
        </TabsContent>

        <TabsContent value="requests">
          <SpecialRequestsHandler />
        </TabsContent>
      </Tabs>

      {/* Help Section */}
      <Card className="mt-8 p-6 bg-gradient-to-r from-primary/10 via-blue-500/10 to-purple-500/10">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">Concierge Premium</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Nâng cấp lên Concierge Premium để được hỗ trợ ưu tiên, tư vấn cá nhân hóa, và nhiều đặc quyền khác
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">✨ Hỗ trợ ưu tiên</Badge>
              <Badge variant="outline">🎯 Tư vấn cá nhân</Badge>
              <Badge variant="outline">🎁 Quà tặng đặc biệt</Badge>
              <Badge variant="outline">🚗 Đưa đón miễn phí</Badge>
              <Badge variant="outline">🍽️ Ưu đãi nhà hàng</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Contact Methods */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
          <Phone className="w-8 h-8 mx-auto mb-3 text-primary" />
          <h4 className="font-semibold mb-2">Gọi điện</h4>
          <p className="text-sm text-muted-foreground mb-2">Hotline 24/7</p>
          <p className="font-bold text-primary">1900 xxxx</p>
        </Card>

        <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
          <MessageSquare className="w-8 h-8 mx-auto mb-3 text-blue-500" />
          <h4 className="font-semibold mb-2">Chat trực tiếp</h4>
          <p className="text-sm text-muted-foreground mb-2">Phản hồi trong 5 phút</p>
          <p className="font-bold text-blue-500">Bắt đầu chat</p>
        </Card>

        <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
          <Mail className="w-8 h-8 mx-auto mb-3 text-purple-500" />
          <h4 className="font-semibold mb-2">Email</h4>
          <p className="text-sm text-muted-foreground mb-2">Phản hồi trong 1 giờ</p>
          <p className="font-bold text-purple-500">concierge@example.com</p>
        </Card>
      </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
