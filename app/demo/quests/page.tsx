"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { 
  BookOpen, 
  Heart, 
  Star, 
  Eye, 
  Share2, 
  CheckCircle2,
  Trophy,
  Target,
  Loader2
} from "lucide-react"

interface Quest {
  id: string
  title: string
  description: string
  type: string
  category: string
  points: number
  targetCount: number
  isActive: boolean
  userProgress?: {
    currentCount: number
    completed: boolean
  }
}

interface QuestsByType {
  daily: Quest[]
  weekly: Quest[]
  oneTime: Quest[]
}

export default function QuestTestingPage() {
  const [quests, setQuests] = useState<QuestsByType>({ daily: [], weekly: [], oneTime: [] })
  const [loading, setLoading] = useState(true)
  const [testingAction, setTestingAction] = useState<string | null>(null)

  const loadQuests = async () => {
    try {
      const response = await fetch("/api/quests")
      if (response.ok) {
        const data = await response.json()
        setQuests(data)
      }
    } catch (error) {
      console.error("Error loading quests:", error)
      toast.error("Không thể tải quests")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQuests()
  }, [])

  const testQuestAction = async (trigger: string, metadata?: any) => {
    setTestingAction(trigger)
    try {
      const response = await fetch("/api/quests/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trigger, metadata })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.completed && result.completed.length > 0) {
          toast.success(`🎉 Quest hoàn thành! +${result.completed[0].points} points`, {
            description: result.completed[0].title
          })
        } else if (result.updated && result.updated.length > 0) {
          const quest = result.updated[0]
          toast.success(`✅ Quest progress updated: ${quest.progress.currentCount}/${quest.progress.targetCount}`)
        } else {
          toast.info("Quest action tracked!")
        }
        
        // Reload quests to show updated progress
        await loadQuests()
      } else {
        toast.error("Quest tracking failed")
      }
    } catch (error) {
      console.error("Error testing quest:", error)
      toast.error("Error testing quest")
    } finally {
      setTestingAction(null)
    }
  }

  const getQuestIcon = (type: string) => {
    switch (type) {
      case "BOOKING":
        return <BookOpen className="h-5 w-5" />
      case "EXPLORATION":
        return <Eye className="h-5 w-5" />
      case "REVIEW":
        return <Star className="h-5 w-5" />
      case "SOCIAL":
        return <Share2 className="h-5 w-5" />
      case "DAILY_CHECK_IN":
      case "STREAK":
        return <CheckCircle2 className="h-5 w-5" />
      case "REFERRAL":
        return <Heart className="h-5 w-5" />
      case "PROFILE_COMPLETION":
        return <Target className="h-5 w-5" />
      default:
        return <Target className="h-5 w-5" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "ONBOARDING": return "bg-blue-100 text-blue-800"
      case "ENGAGEMENT": return "bg-green-100 text-green-800"
      case "BOOKING": return "bg-purple-100 text-purple-800"
      case "SOCIAL": return "bg-pink-100 text-pink-800"
      case "EXPLORATION": return "bg-orange-100 text-orange-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const renderQuestCard = (quest: Quest) => {
    const progress = quest.userProgress?.currentCount || 0
    const percentage = (progress / quest.targetCount) * 100

    return (
      <Card key={quest.id} className={quest.userProgress?.completed ? "border-green-500 bg-green-50" : ""}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-1">{getQuestIcon(quest.type)}</div>
              <div className="flex-1">
                <CardTitle className="text-base flex items-center gap-2">
                  {quest.title}
                  {quest.userProgress?.completed && (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                </CardTitle>
                <CardDescription className="mt-1">{quest.description}</CardDescription>
              </div>
            </div>
            <Badge className={getCategoryColor(quest.category)} variant="secondary">
              {quest.category}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Progress: {progress}/{quest.targetCount}
              </span>
              <span className="font-semibold text-primary">+{quest.points} points</span>
            </div>
            <Progress value={percentage} className="h-2" />
            <div className="pt-2">
              <Button
                size="sm"
                variant={quest.userProgress?.completed ? "outline" : "default"}
                className="w-full"
                onClick={() => testQuestAction(getTestTrigger(quest.type), { questId: quest.id })}
                disabled={testingAction !== null || !quest.isActive}
              >
                {testingAction === getTestTrigger(quest.type) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {quest.userProgress?.completed ? "✓ Completed" : "Test Action"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getTestTrigger = (questType: string): string => {
    // Map from enum QuestType to trigger names
    const triggerMap: Record<string, string> = {
      "PROFILE_COMPLETION": "PROFILE_UPDATED",
      "BOOKING": "BOOKING_CREATED",
      "REVIEW": "REVIEW_CREATED",
      "EXPLORATION": "LISTING_VIEWED", // For view/wishlist quests
      "SOCIAL": "LISTING_SHARED", // For share/post quests
      "DAILY_CHECK_IN": "DAILY_CHECK_IN",
      "STREAK": "DAILY_CHECK_IN",
      "REFERRAL": "REFERRAL_COMPLETED"
    }
    return triggerMap[questType] || "PROFILE_UPDATED"
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading quests...</p>
        </div>
      </div>
    )
  }

  const allQuests = [...quests.daily, ...quests.weekly, ...quests.oneTime]
  const completedCount = allQuests.filter(q => q.userProgress?.completed).length
  const totalCount = allQuests.length
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🧪 Quest Testing Dashboard</h1>
        <p className="text-muted-foreground">
          Test quest tracking và xem progress realtime. Click "Test Action" để simulate user actions.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Quests</CardDescription>
            <CardTitle className="text-3xl">{totalCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-3xl text-green-600">{completedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>In Progress</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {allQuests.filter(q => !q.userProgress?.completed && (q.userProgress?.currentCount || 0) > 0).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Completion Rate</CardDescription>
            <CardTitle className="text-3xl text-purple-600">{completionRate}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Quest Tabs */}
      <Tabs defaultValue="oneTime" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily">
            Daily ({quests.daily.length})
          </TabsTrigger>
          <TabsTrigger value="weekly">
            Weekly ({quests.weekly.length})
          </TabsTrigger>
          <TabsTrigger value="oneTime">
            One-Time ({quests.oneTime.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          {quests.daily.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No daily quests available
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quests.daily.map(renderQuestCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4">
          {quests.weekly.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No weekly quests available
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quests.weekly.map(renderQuestCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="oneTime" className="space-y-4">
          {quests.oneTime.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No one-time quests available
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quests.oneTime.map(renderQuestCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Quick Actions Panel */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Quick Test Actions
          </CardTitle>
          <CardDescription>
            Simulate common user actions to test quest tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              onClick={() => testQuestAction("BOOKING_CREATED", { bookingId: "test-" + Date.now() })}
              disabled={testingAction !== null}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Create Booking
            </Button>
            <Button
              variant="outline"
              onClick={() => testQuestAction("REVIEW_CREATED", { reviewId: "test-" + Date.now(), rating: 5 })}
              disabled={testingAction !== null}
            >
              <Star className="mr-2 h-4 w-4" />
              Write Review
            </Button>
            <Button
              variant="outline"
              onClick={() => testQuestAction("WISHLIST_ADDED", { listingId: "test-" + Date.now() })}
              disabled={testingAction !== null}
            >
              <Heart className="mr-2 h-4 w-4" />
              Add Wishlist
            </Button>
            <Button
              variant="outline"
              onClick={() => testQuestAction("LISTING_VIEWED", { listingId: "test-" + Date.now() })}
              disabled={testingAction !== null}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Listing
            </Button>
            <Button
              variant="outline"
              onClick={() => testQuestAction("LISTING_SHARED", { listingId: "test-" + Date.now(), platform: "facebook" })}
              disabled={testingAction !== null}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share Listing
            </Button>
            <Button
              variant="outline"
              onClick={() => testQuestAction("DAILY_CHECK_IN")}
              disabled={testingAction !== null}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Daily Check-in
            </Button>
            <Button
              variant="outline"
              onClick={() => testQuestAction("PROFILE_UPDATED", { field: "bio" })}
              disabled={testingAction !== null}
            >
              <Target className="mr-2 h-4 w-4" />
              Update Profile
            </Button>
            <Button
              variant="outline"
              onClick={() => loadQuests()}
              disabled={testingAction !== null}
            >
              🔄 Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
