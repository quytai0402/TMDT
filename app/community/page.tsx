import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CreatePost } from "@/components/create-post"
import { SocialFeed } from "@/components/social-feed"
import { SuggestedConnections } from "@/components/suggested-connections"
import { TrendingTopics } from "@/components/trending-topics"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users } from "lucide-react"

export default function CommunityPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-6 w-6" />
              <h1 className="text-3xl font-bold">Cộng đồng</h1>
            </div>
            <p className="text-muted-foreground">
              Kết nối, chia sẻ và khám phá trải nghiệm du lịch cùng cộng đồng yêu du lịch
            </p>
          </div>

          {/* Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Feed */}
            <div className="lg:col-span-2 space-y-6">
              <CreatePost />
              
              <Tabs defaultValue="following" className="space-y-6">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="following">Đang theo dõi</TabsTrigger>
                  <TabsTrigger value="discover">Khám phá</TabsTrigger>
                  <TabsTrigger value="popular">Phổ biến</TabsTrigger>
                </TabsList>

                <TabsContent value="following">
                  <SocialFeed />
                </TabsContent>

                <TabsContent value="discover">
                  <SocialFeed />
                </TabsContent>

                <TabsContent value="popular">
                  <SocialFeed />
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <SuggestedConnections />
              <TrendingTopics />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
