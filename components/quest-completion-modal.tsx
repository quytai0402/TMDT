"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Trophy, X, Star, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import confetti from "canvas-confetti"

interface QuestCompletionModalProps {
  quest: {
    id: string
    title: string
    description: string
    points: number
    category: string
  } | null
  onClose: () => void
}

export function QuestCompletionModal({ quest, onClose }: QuestCompletionModalProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (quest) {
      setShow(true)
      
      // Trigger confetti animation
      const duration = 3000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          return clearInterval(interval)
        }

        const particleCount = 50 * (timeLeft / duration)
        
        confetti({
          ...defaults,
          particleCount,
          origin: { x: Math.random(), y: Math.random() - 0.2 }
        })
      }, 250)

      return () => clearInterval(interval)
    } else {
      setShow(false)
    }
  }, [quest])

  const handleClose = () => {
    setShow(false)
    setTimeout(onClose, 300)
  }

  return (
    <AnimatePresence>
      {show && quest && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 50 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="w-full max-w-md"
            >
              <Card className="relative overflow-hidden border-2 border-yellow-400 shadow-2xl">
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 via-orange-300/20 to-pink-400/20" />
                
                {/* Close Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 z-10"
                  onClick={handleClose}
                >
                  <X className="h-4 w-4" />
                </Button>

                <CardContent className="relative p-8 text-center space-y-6">
                  {/* Trophy Icon with Animation */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: "spring", duration: 0.8 }}
                    className="flex justify-center"
                  >
                    <div className="relative">
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatType: "reverse"
                        }}
                        className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg"
                      >
                        <Trophy className="w-12 h-12 text-white" />
                      </motion.div>
                      
                      {/* Sparkles */}
                      <motion.div
                        animate={{
                          scale: [0, 1, 0],
                          rotate: [0, 180, 360]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatType: "loop"
                        }}
                        className="absolute -top-2 -right-2"
                      >
                        <Sparkles className="w-8 h-8 text-yellow-400" />
                      </motion.div>
                      <motion.div
                        animate={{
                          scale: [0, 1, 0],
                          rotate: [0, -180, -360]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatType: "loop",
                          delay: 1
                        }}
                        className="absolute -bottom-2 -left-2"
                      >
                        <Sparkles className="w-8 h-8 text-pink-400" />
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Title */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-2"
                  >
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                      Quest Completed! 🎉
                    </h2>
                    <p className="text-xl font-semibold text-gray-900">
                      {quest.title}
                    </p>
                    <p className="text-sm text-gray-600">
                      {quest.description}
                    </p>
                  </motion.div>

                  {/* Points Badge */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6, type: "spring" }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-lg"
                  >
                    <Star className="w-6 h-6 text-white fill-white" />
                    <span className="text-2xl font-bold text-white">
                      +{quest.points} Points
                    </span>
                  </motion.div>

                  {/* Category Badge */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    <span className="inline-block px-4 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                      {quest.category}
                    </span>
                  </motion.div>

                  {/* Action Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                  >
                    <Button
                      onClick={handleClose}
                      className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-semibold"
                      size="lg"
                    >
                      Continue Exploring
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
