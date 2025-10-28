'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Trophy,
  Target,
  Calendar,
  Star,
  Flame,
  Check,
  Lock,
  CheckCircle2,
  Heart as HeartIcon,
  Sparkles,
  Users,
  Gift,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import Link from 'next/link'
import { trackQuestProgress } from '@/lib/quests'

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

const questIconMap: Record<string, JSX.Element> = {
  CheckCircle2: <CheckCircle2 className="h-5 w-5 text-emerald-600" />, 
  Calendar: <Calendar className="h-5 w-5 text-sky-600" />,
  Heart: <HeartIcon className="h-5 w-5 text-pink-500" />,
  Star: <Star className="h-5 w-5 text-amber-500" />,
  Flame: <Flame className="h-5 w-5 text-orange-500" />,
  Users: <Users className="h-5 w-5 text-blue-500" />,
  Gift: <Gift className="h-5 w-5 text-primary" />,
  Trophy: <Trophy className="h-5 w-5 text-primary" />,
}

const questInstructionMap: Record<string, string> = {
  BOOKING: 'Hệ thống sẽ tự động ghi nhận sau khi bạn hoàn tất một booking hợp lệ.',
  REVIEW: 'Viết review cho chuyến đi đã hoàn thành để nhận thưởng.',
  EXPLORATION: 'Thêm homestay vào wishlist để tăng tiến độ nhiệm vụ.',
  DAILY_CHECK_IN: 'Check-in mỗi ngày tại trang Rewards để giữ streak.',
  REFERRAL: 'Mời bạn bè và đảm bảo họ hoàn tất booking để được tính.',
  PROFILE_COMPLETION: 'Cập nhật đầy đủ thông tin hồ sơ, ảnh đại diện và liên hệ.',
  SOCIAL: 'Chia sẻ bài viết hoặc tham gia hoạt động tại cộng đồng LuxeStay.',
}

const questActionLinks: Partial<Record<string, { href: string; label: string }>> = {
  BOOKING: { href: '/', label: 'Khám phá & đặt chỗ' },
  REVIEW: { href: '/trips', label: 'Viết review chuyến đi' },
  EXPLORATION: { href: '/wishlist', label: 'Mở wishlist' },
  DAILY_CHECK_IN: { href: '/rewards', label: 'Check-in ngay' },
  PROFILE_COMPLETION: { href: '/profile', label: 'Cập nhật hồ sơ' },
  SOCIAL: { href: '/community', label: 'Đi tới cộng đồng' },
  REFERRAL: { href: '/rewards', label: 'Mời bạn bè' },
}

export function QuestsPanel() {
  const [questData, setQuestData] = useState<QuestData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('daily')
  const [autoDailyTriggered, setAutoDailyTriggered] = useState(false)

  const loadQuests = useCallback(async (options?: { skipAuto?: boolean }) => {
    try {
      const response = await fetch('/api/quests', { cache: 'no-store' })

      if (!response.ok) {
        if (response.status === 401) {
          setQuestData(null)
          toast('Đăng nhập để xem bảng nhiệm vụ')
          return
        }

        const errorDetail = await response.json().catch(() => ({}))
        const message = errorDetail?.error ?? 'Không thể tải nhiệm vụ. Vui lòng thử lại.'
        toast.error(message)
        return
      }

      const data = await response.json()
      setQuestData(data)

      if (!options?.skipAuto && !autoDailyTriggered) {
        const dailyQuest = data.grouped?.daily?.find((quest: Quest) => quest.type === 'DAILY_CHECK_IN' && !quest.isCompleted)
        if (dailyQuest) {
          setAutoDailyTriggered(true)
          const result = await trackQuestProgress('DAILY_CHECK_IN', { questId: dailyQuest.id })
          if (result) {
            toast.success('Check-in streak +40 điểm!', {
              description: 'Bạn đã nhận thưởng check-in hôm nay.',
            })
            await loadQuests({ skipAuto: true })
          }
        }
      }
    } catch (error) {
      console.error('Error loading quests:', error)
      toast.error('Không thể tải nhiệm vụ', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setLoading(false)
    }
  }, [autoDailyTriggered])

  useEffect(() => {
    void loadQuests()
  }, [loadQuests])

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
        <p className="text-center text-muted-foreground">
          Không có nhiệm vụ nào. Hãy đăng nhập để kích hoạt bảng nhiệm vụ của bạn.
        </p>
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
          <QuestList quests={grouped.daily} />
        </TabsContent>

        <TabsContent value="weekly" className="mt-6 space-y-4">
          <QuestList quests={grouped.weekly} />
        </TabsContent>

        <TabsContent value="oneTime" className="mt-6 space-y-4">
          <QuestList quests={grouped.oneTime} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function QuestList({ quests }: { quests: Quest[] }) {
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
  const iconNode = quest.icon ? questIconMap[quest.icon] : undefined
  const iconBackground = quest.color ? `${quest.color}20` : 'rgba(37, 99, 235, 0.1)'
  const instruction = questInstructionMap[quest.type] ?? 'Hệ thống sẽ tự động ghi nhận tiến độ của nhiệm vụ này.'
  const actionLink = questActionLinks[quest.type]

  return (
    <Card className={`p-5 ${quest.isCompleted ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3 flex-1">
          <div 
            className="p-2 rounded-lg text-2xl"
            style={{ backgroundColor: iconBackground }}
          >
            {iconNode ?? <Sparkles className="h-5 w-5 text-primary" />}
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

      <div className="mt-4 flex items-center justify-end">
        {quest.isCompleted ? (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
            <Check className="h-3 w-3 mr-1" />
            Đã hoàn thành
          </Badge>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
            <p className="text-xs text-muted-foreground flex-1">{instruction}</p>
            {actionLink ? (
              <Button size="sm" variant="outline" className="h-8 text-xs" asChild>
                <Link href={actionLink.href}>{actionLink.label}</Link>
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </Card>
  )
}
