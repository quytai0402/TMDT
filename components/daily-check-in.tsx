"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Flame, Gift, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { trackDailyCheckInQuest } from "@/lib/quests"

interface CheckInData {
  checkedInToday: boolean
  currentStreak: number
  longestStreak: number
  lastCheckIn: string | null
  nextRewardAt: number
  pointsEarned: number
}

export function DailyCheckIn() {
  const { status } = useSession()
  const [checkInData, setCheckInData] = useState<CheckInData | null>(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [showCard, setShowCard] = useState(false)

  useEffect(() => {
    if (status === "authenticated") {
      loadCheckInStatus()
    } else if (status === "unauthenticated") {
      setLoading(false)
      setShowCard(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const loadCheckInStatus = () => {
    try {
      const lastCheckIn = localStorage.getItem("lastCheckIn")
      const currentStreak = parseInt(localStorage.getItem("currentStreak") || "0")
      const longestStreak = parseInt(localStorage.getItem("longestStreak") || "0")

      const today = new Date().toDateString()
      const checkedInToday = lastCheckIn === today

      setCheckInData({
        checkedInToday,
        currentStreak,
        longestStreak,
        lastCheckIn,
        nextRewardAt: Math.ceil((currentStreak + 1) / 7) * 7,
        pointsEarned: 10 + Math.floor(currentStreak / 7) * 5,
      })

      if (!checkedInToday) {
        setShowCard(true)
      }
    } catch (error) {
      console.error("Error loading check-in status:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async () => {
    if (status !== "authenticated") {
      toast.error("Vui lòng đăng nhập để check-in và tích điểm.")
      return
    }
    if (!checkInData || checkInData.checkedInToday) return

    try {
      setClaiming(true)

      const response = await fetch("/api/rewards/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          actionType: "DAILY_CHECK_IN",
          metadata: {
            streak: checkInData.currentStreak + 1,
            timestamp: new Date().toISOString(),
          },
        }),
      })

      if (response.status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.")
        setShowCard(false)
        return
      }

      if (!response.ok) {
        throw new Error("Failed to check in")
      }

      const result = await response.json()

      const today = new Date().toDateString()
      const newStreak = checkInData.currentStreak + 1
      localStorage.setItem("lastCheckIn", today)
      localStorage.setItem("currentStreak", newStreak.toString())
      localStorage.setItem("longestStreak", Math.max(newStreak, checkInData.longestStreak).toString())

      setCheckInData({
        ...checkInData,
        checkedInToday: true,
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, checkInData.longestStreak),
      })

      toast.success(`Check-in thành công! +${result.transaction?.points || 10} điểm`, {
        description: `Streak hiện tại: ${newStreak} ngày 🔥`,
        duration: 5000,
      })

      // Trigger quest progress tracking
      trackDailyCheckInQuest().catch((error) => {
        console.error("Failed to sync quest progress for daily check-in:", error)
      })

      setTimeout(() => setShowCard(false), 3000)
    } catch (error) {
      console.error("Error checking in:", error)
      toast.error("Không thể check-in. Vui lòng thử lại!")
    } finally {
      setClaiming(false)
    }
  }

  if (status === "unauthenticated") {
    return (
      <Card className="border border-dashed border-primary/30 bg-muted/20">
        <CardContent className="py-6 text-center space-y-3">
          <h3 className="font-semibold">Đăng nhập để nhận điểm mỗi ngày</h3>
          <p className="text-sm text-muted-foreground">
            Check-in hàng ngày để giữ streak và mở khóa phần thưởng độc quyền cho thành viên.
          </p>
          <Button asChild size="sm">
            <Link href="/login">Đăng nhập ngay</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (loading || !checkInData || !showCard) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <Card className="overflow-hidden border border-primary/20 bg-gradient-to-br from-orange-50 via-amber-50 to-white shadow-sm">
          <CardContent className="relative p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 8, -8, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 4,
                  }}
                  className="p-3 rounded-full bg-gradient-to-br from-orange-500 to-red-500 shadow-lg"
                >
                  <Calendar className="h-6 w-6 text-white" />
                </motion.div>

                <div>
                  <h3 className="font-bold text-lg mb-1">Check-in hàng ngày</h3>
                  <p className="text-sm text-muted-foreground">
                    Nhận điểm thưởng mỗi ngày để leo bảng xếp hạng.
                  </p>
                </div>
              </div>

              {checkInData.currentStreak > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Flame className="h-3 w-3 text-orange-500" />
                  {checkInData.currentStreak} ngày
                </Badge>
              )}
            </div>

            {checkInData.currentStreak > 0 && (
              <div className="mb-4 rounded-lg bg-white/70 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Tiến độ streak</span>
                  <span className="text-xs text-muted-foreground">
                    {checkInData.currentStreak} / {checkInData.nextRewardAt}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(100, (checkInData.currentStreak / checkInData.nextRewardAt) * 100)}%`,
                    }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {checkInData.nextRewardAt - checkInData.currentStreak} ngày nữa để nhận quà streak đặc biệt!
                </p>
              </div>
            )}

            <Button
              onClick={handleCheckIn}
              disabled={checkInData.checkedInToday || claiming}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              {claiming ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  Đang check-in...
                </>
              ) : checkInData.checkedInToday ? (
                <>
                  <Gift className="h-4 w-4 mr-2" />
                  Bạn đã check-in hôm nay
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Check-in ngay (+{checkInData.pointsEarned} điểm)
                </>
              )}
            </Button>

            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>Streak hiện tại: {checkInData.currentStreak} ngày</span>
              <span>Streak tốt nhất: {checkInData.longestStreak} ngày</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
