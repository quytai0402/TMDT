"use client"

import { Home, Mountain, Waves, TreePine, Building2, Sparkles, Heart, TrendingUp } from "lucide-react"

import { useListingFilters } from "@/hooks/use-listing-filters"
import { cn } from "@/lib/utils"
import { useMembershipAccess } from "@/hooks/use-membership-access"
import { useToast } from "@/hooks/use-toast"

const categories = [
  { id: "trending", name: "Thịnh hành", icon: TrendingUp, access: "free" },
  { id: "luxury", name: "Sang trọng", icon: Sparkles, access: "membership" },
  { id: "beach", name: "Biển", icon: Waves, access: "free" },
  { id: "mountain", name: "Núi", icon: Mountain, access: "free" },
  { id: "countryside", name: "Nông thôn", icon: TreePine, access: "free" },
  { id: "city", name: "Thành phố", icon: Building2, access: "free" },
  { id: "villa", name: "Villa", icon: Home, access: "membership" },
  { id: "favorite", name: "Yêu thích", icon: Heart, access: "membership" },
] as const

type CategoryConfig = (typeof categories)[number]

export function CategoryFilter() {
  const { category: selected, setCategory } = useListingFilters()
  const { hasMembership, isAuthenticated } = useMembershipAccess()
  const { toast } = useToast()

  const handleClick = (category: CategoryConfig) => {
    if (category.access === "membership" && !hasMembership) {
      toast({
        title: isAuthenticated ? "Danh mục dành riêng cho hội viên" : "Đăng nhập để mở khóa",
        description: isAuthenticated
          ? "Nâng cấp membership để xem các lựa chọn sang trọng và bộ sưu tập bí mật."
          : "Vui lòng đăng nhập hoặc nâng cấp membership để truy cập danh mục này.",
      })
    }
    setCategory(category.id)
  }

  return (
    <div className="border-b border-slate-200 bg-gradient-to-r from-white via-slate-50 to-white">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center gap-3 overflow-x-auto py-5 scrollbar-hide">
          {categories.map((category) => {
            const Icon = category.icon
            const isActive = selected === category.id
            return (
              <button
                key={category.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => handleClick(category)}
                className={cn(
                  "flex min-w-[110px] items-center gap-3 rounded-2xl border px-4 py-2 text-sm font-semibold transition-all",
                  "hover:border-teal-200 hover:text-teal-700",
                  isActive
                    ? "border-primary bg-white text-primary shadow-[0_18px_40px_-30px_rgba(14,116,144,0.6)]"
                    : "border-transparent text-slate-500",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-2xl border text-sm",
                    isActive ? "border-primary/40 bg-primary/10 text-primary" : "border-slate-200 text-slate-500",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex flex-col whitespace-nowrap text-left leading-tight">
                  <span>{category.name}</span>
                  <span
                    className={cn(
                      "text-[11px] font-semibold uppercase tracking-wide",
                      category.access === "membership"
                        ? isActive
                          ? "text-amber-600"
                          : "text-amber-500"
                        : isActive
                          ? "text-emerald-600"
                          : "text-emerald-500",
                    )}
                  >
                    {category.access === "membership" ? "Membership" : "Free"}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
