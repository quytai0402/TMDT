"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Flame, Gift, Sparkles } from "lucide-react"
import { toast } from "sonner"

interface CheckInData {
  checkedInToday: boolean
  currentStreak: number
  longestStreak: number
  lastCheckIn: string | null
  nextRewardAt: number
  pointsEarned: number
}

export function DailyCheckIn() {
  const [checkInData, setCheckInData] = useState<CheckInData | null>(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [showCard, setShowCard] = useState(false)

  useEffect(() => {
    loadCheckInStatus()
  }, [])

  const loadCheckInStatus = async () => {
    try {
      // Get current streak from user or create a simple check
      const lastCheckIn = localStorage.getItem('lastCheckIn')
      const currentStreak = parseInt(localStorage.getItem('currentStreak') || '0')
      const longestStreak = parseInt(localStorage.getItem('longestStreak') || '0')
      
      const today = new Date().toDateString()
      const checkedInToday = lastCheckIn === today

      setCheckInData({
        checkedInToday,
        currentStreak,
        longestStreak,
        lastCheckIn,
        nextRewardAt: Math.ceil((currentStreak + 1) / 7) * 7,
        pointsEarned: 10 + Math.floor(currentStreak / 7) * 5
      })

      // Show card if not checked in today
      if (!checkedInToday) {
        setShowCard(true)
      }
    } catch (error) {
      console.error('Error loading check-in status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async () => {
    if (!checkInData || checkInData.checkedInToday) return

    try {
      setClaiming(true)
      
      // Award points via API
      const response = await fetch('/api/rewards/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'DAILY_CHECK_IN',
          metadata: {
            streak: checkInData.currentStreak + 1,
            timestamp: new Date().toISOString()
          }
        })
      })

      if (response.ok) {
        const result = await response.json()
        
        // Update local storage
        const today = new Date().toDateString()
        const newStreak = checkInData.currentStreak + 1
        localStorage.setItem('lastCheckIn', today)
        localStorage.setItem('currentStreak', newStreak.toString())
        localStorage.setItem('longestStreak', Math.max(newStreak, checkInData.longestStreak).toString())

        // Update state
        setCheckInData({
          ...checkInData,
          checkedInToday: true,
          currentStreak: newStreak,
          longestStreak: Math.max(newStreak, checkInData.longestStreak)
        })

        // Show success with confetti effect
        toast.success(`Check-in thành công! +${result.transaction?.points || 10} điểm`, {
          description: `Streak hiện tại: ${newStreak} ngày 🔥`,
          duration: 5000
        })

        // Hide card after 3 seconds
        setTimeout(() => setShowCard(false), 3000)
      } else {
        throw new Error('Failed to check in')
      }
    } catch (error) {
      console.error('Error checking in:', error)
      toast.error('Không thể check-in. Vui lòng thử lại!')
    } finally {
      setClaiming(false)
    }
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
        <Card className="overflow-hidden border-2 border-primary/20 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-yellow-500/10 to-red-500/10" />
          
          <CardContent className="relative p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                  className="p-3 rounded-full bg-gradient-to-br from-orange-400 to-red-500 shadow-lg"
                >
                  <Calendar className="h-6 w-6 text-white" />
                </motion.div>
                
                <div>
                  <h3 className="font-bold text-lg mb-1">Check-in hàng ngày</h3>
                  <p className="text-sm text-muted-foreground">
                    Nhận điểm thưởng mỗi ngày!
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

            {/* Streak Progress */}
            {checkInData.currentStreak > 0 && (
              <div className="mb-4 p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Streak tiến độ</span>
                  <span className="text-xs text-muted-foreground">
                    {checkInData.currentStreak} / {checkInData.nextRewardAt}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${(checkInData.currentStreak / checkInData.nextRewardAt) * 100}%` 
                    }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {checkInData.nextRewardAt - checkInData.currentStreak} ngày nữa để nhận phần thưởng đặc biệt!
                </p>
              </div>
            )}

            {/* Check-in Button */}
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
                  Đã check-in hôm nay
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Check-in ngay (+{checkInData.pointsEarned} điểm)
                </>
              )}
            </Button>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">
                  {checkInData.currentStreak}
                </div>
                <div className="text-xs text-muted-foreground">Streak hiện tại</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">
                  {checkInData.longestStreak}
                </div>
                <div className="text-xs text-muted-foreground">Streak tốt nhất</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
