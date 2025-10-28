"use client"

import { useMemo, useState } from "react"
import { ExperienceCard } from "@/components/experience-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Compass } from "lucide-react"
import type { ExperienceSummary } from "@/lib/experiences"

interface ExperiencesGridProps {
  initialExperiences: ExperienceSummary[]
  title?: string
  subtitle?: string
  badgeLabel?: string
}

const categoryLabelMap: Record<string, string> = {
  FOOD_DRINK: "Ẩm thực",
  ADVENTURE: "Mạo hiểm",
  CULTURE: "Văn hóa",
  WELLNESS: "Sức khỏe",
  WATER_SPORTS: "Hoạt động nước",
  WORKSHOP: "Workshop",
  SIGHTSEEING: "Tham quan",
  ENTERTAINMENT: "Giải trí",
  SHOPPING: "Mua sắm",
  NIGHTLIFE: "Cuộc sống về đêm",
}

const categories = [
  { value: "all", label: "Tất cả" },
  { value: "FOOD_DRINK", label: "Ẩm thực" },
  { value: "WATER_SPORTS", label: "Hoạt động nước" },
  { value: "ADVENTURE", label: "Mạo hiểm" },
  { value: "CULTURE", label: "Văn hóa" },
  { value: "WELLNESS", label: "Sức khỏe" },
  { value: "WORKSHOP", label: "Workshop" },
  { value: "SIGHTSEEING", label: "Tham quan" },
  { value: "ENTERTAINMENT", label: "Giải trí" },
  { value: "SHOPPING", label: "Mua sắm" },
  { value: "NIGHTLIFE", label: "Cuộc sống về đêm" },
]

export function ExperiencesGrid({ initialExperiences, title, subtitle, badgeLabel }: ExperiencesGridProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all")

  const headingTitle = title ?? "Trải nghiệm địa phương"
  const headingSubtitle = subtitle ?? "Khám phá văn hóa, ẩm thực và hoạt động độc đáo cùng người dân địa phương"
  const headingBadge = badgeLabel ?? "Local Experiences"

  const normalizedExperiences = useMemo(() => {
    return initialExperiences.map((experience) => ({
      ...experience,
      tags: experience.tags ?? [],
      host: {
        ...experience.host,
        avatar: experience.host.avatar || "/placeholder.svg",
      },
      displayCategory: categoryLabelMap[experience.category] || experience.category,
      membersOnly: experience.membersOnly ?? false,
    }))
  }, [initialExperiences])

  const categoryCounts = useMemo(() => {
    return categories.reduce<Record<string, number>>((acc, category) => {
      if (category.value === "all") {
        acc[category.value] = normalizedExperiences.length
      } else {
        acc[category.value] = normalizedExperiences.filter(
          (experience) => experience.category === category.value
        ).length
      }
      return acc
    }, {})
  }, [normalizedExperiences])

  const visibleExperiences = useMemo(() => {
    if (activeCategory === "all") {
      return normalizedExperiences
    }

    return normalizedExperiences.filter(
      (experience) => experience.category === activeCategory
    )
  }, [activeCategory, normalizedExperiences])

  if (normalizedExperiences.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Không tìm thấy trải nghiệm nào</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
          <Compass className="h-4 w-4" />
          <span className="text-sm font-medium">{headingBadge}</span>
        </div>
        <h1 className="text-4xl font-bold">{headingTitle}</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {headingSubtitle}
        </p>
      </div>

      <Tabs
        value={activeCategory}
        onValueChange={(value) => setActiveCategory(value)}
        className="space-y-8"
      >
        <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
          {categories.map((category) => (
            <TabsTrigger key={category.value} value={category.value} className="gap-2">
              {category.label}
              <span className="text-xs opacity-60">({categoryCounts[category.value] ?? 0})</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory}>
          {visibleExperiences.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Chưa có trải nghiệm phù hợp danh mục này</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleExperiences.map(({ displayCategory, ...experience }) => (
                <ExperienceCard
                  key={experience.id}
                  {...experience}
                  category={displayCategory}
                  membersOnly={experience.membersOnly}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
