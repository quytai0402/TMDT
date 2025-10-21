import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { GamificationDashboard } from "@/components/gamification-dashboard"
import { QuestsPanel } from "@/components/quests-panel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles, Trophy, Target } from "lucide-react"

export default function GamificationPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gradient-to-b from-purple-50 to-white">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-8 w-8 text-purple-600" />
              <h1 className="text-4xl font-bold">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Rewards & Achievements
                </span>
              </h1>
            </div>
            <p className="text-gray-600 text-lg">
              Hoàn thành quests, mở khóa badges và leo rank để nhận ưu đãi độc quyền!
            </p>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="overview" className="flex items-center space-x-2">
                <Trophy className="h-4 w-4" />
                <span>Tổng quan</span>
              </TabsTrigger>
              <TabsTrigger value="quests" className="flex items-center space-x-2">
                <Target className="h-4 w-4" />
                <span>Nhiệm vụ</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <GamificationDashboard />
            </TabsContent>

            <TabsContent value="quests">
              <QuestsPanel />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  )
}
