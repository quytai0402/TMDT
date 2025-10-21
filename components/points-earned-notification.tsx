"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Trophy, Award, TrendingUp } from "lucide-react"
import { Card } from "@/components/ui/card"

interface PointsNotification {
  id: string
  points: number
  action: string
  tierUpgraded?: boolean
  newTier?: string
  badges?: Array<{ name: string; icon: string }>
}

let notificationQueue: PointsNotification[] = []
let showNotificationCallback: ((notification: PointsNotification) => void) | null = null

export function showPointsNotification(notification: Omit<PointsNotification, "id">) {
  const id = `${Date.now()}-${Math.random()}`
  notificationQueue.push({ ...notification, id })
  
  if (showNotificationCallback) {
    showNotificationCallback({ ...notification, id })
  }
}

export function PointsEarnedNotification() {
  const [notifications, setNotifications] = useState<PointsNotification[]>([])
  const [currentNotification, setCurrentNotification] = useState<PointsNotification | null>(null)

  useEffect(() => {
    showNotificationCallback = (notification) => {
      setNotifications(prev => [...prev, notification])
    }

    // Process queue
    if (notificationQueue.length > 0) {
      setNotifications(notificationQueue)
      notificationQueue = []
    }

    return () => {
      showNotificationCallback = null
    }
  }, [])

  useEffect(() => {
    if (!currentNotification && notifications.length > 0) {
      const next = notifications[0]
      setCurrentNotification(next)
      setNotifications(prev => prev.slice(1))

      // Auto-dismiss after duration
      const duration = next.tierUpgraded ? 6000 : next.badges?.length ? 5000 : 4000
      setTimeout(() => {
        setCurrentNotification(null)
      }, duration)
    }
  }, [notifications, currentNotification])

  return (
    <AnimatePresence>
      {currentNotification && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25
          }}
          className="fixed top-20 right-4 z-[100] max-w-sm"
        >
          <Card className="overflow-hidden shadow-2xl border-2 border-primary/20">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-yellow-500/10" />
            
            <div className="relative p-4">
              {/* Points Display */}
              <div className="flex items-start gap-3 mb-3">
                <motion.div
                  initial={{ rotate: -180, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="p-2 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg"
                >
                  <Sparkles className="h-6 w-6 text-white" />
                </motion.div>
                
                <div className="flex-1">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h3 className="font-bold text-lg mb-1">
                      🎉 Bạn vừa nhận được điểm!
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {currentNotification.action}
                    </p>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    delay: 0.4,
                    type: "spring",
                    stiffness: 400,
                    damping: 10
                  }}
                  className="text-right"
                >
                  <div className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                    +{currentNotification.points}
                  </div>
                  <div className="text-xs text-muted-foreground">điểm</div>
                </motion.div>
              </div>

              {/* Tier Upgrade */}
              {currentNotification.tierUpgraded && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="mt-3 p-3 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-300/50"
                >
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <div>
                      <p className="font-semibold text-sm">Chúc mừng! Tier mới!</p>
                      <p className="text-xs text-muted-foreground">
                        Bạn đã lên {currentNotification.newTier}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Badges Earned */}
              {currentNotification.badges && currentNotification.badges.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="mt-3 space-y-2"
                >
                  {currentNotification.badges.map((badge, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-300/50"
                    >
                      <Award className="h-4 w-4 text-blue-500" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold">Badge mới: {badge.name}</p>
                      </div>
                      <span className="text-2xl">{badge.icon}</span>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* Progress indicator */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ 
                  delay: 0.8,
                  duration: currentNotification.tierUpgraded ? 6 : currentNotification.badges?.length ? 5 : 4,
                  ease: "linear"
                }}
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 origin-left"
                style={{ width: "100%" }}
              />
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
