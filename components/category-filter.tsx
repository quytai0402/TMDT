"use client"

import { Home, Mountain, Waves, TreePine, Building2, Sparkles, Heart, TrendingUp } from "lucide-react"
import { useListingFilters } from "@/hooks/use-listing-filters"

const categories = [
  { id: "trending", name: "Thịnh hành", icon: TrendingUp },
  { id: "luxury", name: "Sang trọng", icon: Sparkles },
  { id: "beach", name: "Biển", icon: Waves },
  { id: "mountain", name: "Núi", icon: Mountain },
  { id: "countryside", name: "Nông thôn", icon: TreePine },
  { id: "city", name: "Thành phố", icon: Building2 },
  { id: "villa", name: "Villa", icon: Home },
  { id: "favorite", name: "Yêu thích", icon: Heart },
]

export function CategoryFilter() {
  const { category: selected, setCategory } = useListingFilters()

  return (
    <div className="border-b border-border bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center space-x-8 overflow-x-auto py-4 scrollbar-hide">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <button
                key={category.id}
                onClick={() => setCategory(category.id)}
                className={`flex flex-col items-center space-y-2 min-w-fit transition-colors ${
                  selected === category.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs font-medium whitespace-nowrap">{category.name}</span>
                {selected === category.id && <div className="h-0.5 w-full bg-foreground rounded-full" />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
