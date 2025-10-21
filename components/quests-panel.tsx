'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trophy, Target, Calendar, Star, Flame, Check, Lock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface Quest {
  id: string
  title: string
  description: string
  type: string
  category: string
  targetCount: number
  rewardPoints: number
  rewardBadge?: string
  isDaily: boolean
  isWeekly: boolean
  isActive: boolean
  icon?: string
  color?: string
  currentCount: number
  isCompleted: boolean
  completedAt?: Date
  progress: number
}

interface QuestData {
  quests: Quest[]
  grouped: {
    daily: Quest[]
    weekly: Quest[]
    oneTime: Quest[]
  }
  total: number
  completed: number
}

export function QuestsPanel() {
  const [questData, setQuestData] = useState<QuestData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('daily')

  useEffect(() => {
    loadQuests()
  }, [])

  const loadQuests = async () => {
    try {
      const response = await fetch('/api/quests')
      if (!response.ok) throw new Error('Failed to load quests')
      
      const data = await response.json()
      setQuestData(data)
    } catch (error) {
      console.error('Error loading quests:', error)
      toast.error('Không thể tải nhiệm vụ')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!questData) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">Không có nhiệm vụ nào</p>
      </Card>
    )
  }

  const { grouped, completed, total } = questData

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Hoàn thành</p>
              <p className="text-2xl font-bold">{completed}/{total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Đang tiến hành</p>
              <p className="text-2xl font-bold">{total - completed}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Star className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tỷ lệ</p>
              <p className="text-2xl font-bold">{total > 0 ? Math.round((completed / total) * 100) : 0}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quest Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily" className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Hàng ngày ({grouped.daily.length})</span>
          </TabsTrigger>
          <TabsTrigger value="weekly" className="flex items-center space-x-2">
            <Flame className="h-4 w-4" />
            <span>Hàng tuần ({grouped.weekly.length})</span>
          </TabsTrigger>
          <TabsTrigger value="oneTime" className="flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>Một lần ({grouped.oneTime.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-6 space-y-4">
          <QuestList quests={grouped.daily} type="daily" />
        </TabsContent>

        <TabsContent value="weekly" className="mt-6 space-y-4">
          <QuestList quests={grouped.weekly} type="weekly" />
        </TabsContent>

        <TabsContent value="oneTime" className="mt-6 space-y-4">
          <QuestList quests={grouped.oneTime} type="oneTime" />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function QuestList({ quests, type }: { quests: Quest[], type: string }) {
  if (quests.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <Lock className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">Chưa có nhiệm vụ nào</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {quests.map((quest) => (
          <motion.div
            key={quest.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <QuestCard quest={quest} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

function QuestCard({ quest }: { quest: Quest }) {
  const progressPercentage = quest.progress

  return (
    <Card className={`p-5 ${quest.isCompleted ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3 flex-1">
          <div 
            className="p-2 rounded-lg text-2xl"
            style={{ backgroundColor: `${quest.color}15` }}
          >
            {quest.icon || '🎯'}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-semibold text-base">{quest.title}</h4>
              {quest.isCompleted && (
                <Badge variant="outline" className="bg-green-500 text-white border-green-600">
                  <Check className="h-3 w-3 mr-1" />
                  Hoàn thành
                </Badge>
              )}
              {quest.isDaily && !quest.isCompleted && (
                <Badge variant="outline">Hôm nay</Badge>
              )}
              {quest.isWeekly && !quest.isCompleted && (
                <Badge variant="outline">Tuần này</Badge>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mb-3">{quest.description}</p>
            
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Tiến độ: {quest.currentCount}/{quest.targetCount}
                </span>
                <span className="font-medium">{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </div>
        </div>

        <div className="text-right ml-4">
          <div className="flex items-center justify-end space-x-1 text-primary">
            <Star className="h-4 w-4 fill-current" />
            <span className="font-bold">{quest.rewardPoints}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">điểm</p>
        </div>
      </div>
    </Card>
  )
}
