"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  DollarSign,
  Plus,
  TrendingDown,
  TrendingUp,
  PieChart,
  Wallet,
  CreditCard,
  Home,
  Utensils,
  Car,
  ShoppingBag,
  Camera
} from "lucide-react"
import { cn } from "@/lib/utils"

interface BudgetItem {
  id: string
  category: string
  name: string
  planned: number
  spent: number
}

const categoryIcons = {
  accommodation: Home,
  food: Utensils,
  transport: Car,
  activities: Camera,
  shopping: ShoppingBag,
  misc: Wallet,
}

const categoryColors = {
  accommodation: "bg-blue-500",
  food: "bg-orange-500",
  transport: "bg-green-500",
  activities: "bg-purple-500",
  shopping: "bg-pink-500",
  misc: "bg-gray-500",
}

export function TripBudgetTracker() {
  const [budget, setBudget] = useState<BudgetItem[]>([
    { id: "1", category: "accommodation", name: "Khách sạn Đà Lạt", planned: 2500000, spent: 2500000 },
    { id: "2", category: "accommodation", name: "Khách sạn Nha Trang", planned: 1800000, spent: 0 },
    { id: "3", category: "food", name: "Ăn uống", planned: 2000000, spent: 500000 },
    { id: "4", category: "transport", name: "Vé máy bay", planned: 3000000, spent: 3000000 },
    { id: "5", category: "transport", name: "Thuê xe", planned: 1500000, spent: 0 },
    { id: "6", category: "activities", name: "Tour tham quan", planned: 1000000, spent: 0 },
    { id: "7", category: "shopping", name: "Mua sắm", planned: 1000000, spent: 200000 },
  ])

  const categories = [
    { id: "accommodation", label: "Chỗ nghỉ", icon: Home },
    { id: "food", label: "Ẩm thực", icon: Utensils },
    { id: "transport", label: "Di chuyển", icon: Car },
    { id: "activities", label: "Hoạt động", icon: Camera },
    { id: "shopping", label: "Mua sắm", icon: ShoppingBag },
    { id: "misc", label: "Khác", icon: Wallet },
  ]

  const totalPlanned = budget.reduce((sum, item) => sum + item.planned, 0)
  const totalSpent = budget.reduce((sum, item) => sum + item.spent, 0)
  const remaining = totalPlanned - totalSpent
  const percentSpent = totalPlanned > 0 ? Math.round((totalSpent / totalPlanned) * 100) : 0

  const getCategoryStats = (categoryId: string) => {
    const items = budget.filter(item => item.category === categoryId)
    const planned = items.reduce((sum, item) => sum + item.planned, 0)
    const spent = items.reduce((sum, item) => sum + item.spent, 0)
    return { planned, spent, remaining: planned - spent, percent: planned > 0 ? Math.round((spent / planned) * 100) : 0 }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2 flex items-center">
            <DollarSign className="w-6 h-6 mr-3 text-primary" />
            Quản lý ngân sách
          </h2>
          <p className="text-muted-foreground">
            Theo dõi chi tiêu cho chuyến đi của bạn
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tổng ngân sách</p>
              <p className="text-3xl font-bold">{totalPlanned.toLocaleString("vi-VN")}₫</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Đã chi tiêu</p>
              <p className="text-3xl font-bold">{totalSpent.toLocaleString("vi-VN")}₫</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Progress value={percentSpent} className="h-2" />
            <span className="text-sm font-medium">{percentSpent}%</span>
          </div>
        </Card>

        <Card className={cn(
          "p-6 bg-gradient-to-br border-green-200",
          remaining >= 0 
            ? "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20" 
            : "from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200"
        )}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Còn lại</p>
              <p className="text-3xl font-bold">{remaining.toLocaleString("vi-VN")}₫</p>
            </div>
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              remaining >= 0 ? "bg-green-500/20" : "bg-red-500/20"
            )}>
              {remaining >= 0 ? (
                <TrendingDown className="w-6 h-6 text-green-600" />
              ) : (
                <TrendingUp className="w-6 h-6 text-red-600" />
              )}
            </div>
          </div>
          {remaining < 0 && (
            <Badge variant="destructive" className="text-xs">
              Vượt quá ngân sách!
            </Badge>
          )}
        </Card>
      </div>

      {/* Categories Breakdown */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Chi tiết theo danh mục</h3>
        <div className="space-y-4">
          {categories.map(category => {
            const stats = getCategoryStats(category.id)
            const Icon = category.icon
            
            if (stats.planned === 0) return null

            return (
              <div key={category.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      categoryColors[category.id as keyof typeof categoryColors],
                      "bg-opacity-20"
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold">{category.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {stats.spent.toLocaleString("vi-VN")}₫ / {stats.planned.toLocaleString("vi-VN")}₫
                      </p>
                    </div>
                  </div>
                  <Badge variant={stats.percent > 100 ? "destructive" : "outline"}>
                    {stats.percent}%
                  </Badge>
                </div>
                <div className="ml-13">
                  <Progress 
                    value={Math.min(stats.percent, 100)} 
                    className="h-2"
                  />
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Detailed Items */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Chi tiết chi tiêu</h3>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Thêm chi phí
          </Button>
        </div>
        <div className="space-y-2">
          {budget.map(item => {
            const Icon = categoryIcons[item.category as keyof typeof categoryIcons]
            const percent = item.planned > 0 ? Math.round((item.spent / item.planned) * 100) : 0
            
            return (
              <div key={item.id} className="flex items-center space-x-4 p-4 rounded-lg border hover:shadow-sm transition-shadow">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                  categoryColors[item.category as keyof typeof categoryColors],
                  "bg-opacity-20"
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{item.name}</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-sm text-muted-foreground">
                      Kế hoạch: {item.planned.toLocaleString("vi-VN")}₫
                    </span>
                    <span className="text-sm font-medium">
                      Đã chi: {item.spent.toLocaleString("vi-VN")}₫
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-3 flex-shrink-0">
                  <Badge variant={percent > 100 ? "destructive" : percent === 100 ? "default" : "outline"}>
                    {percent}%
                  </Badge>
                  {item.spent === item.planned && item.spent > 0 && (
                    <Badge variant="default" className="bg-green-500">
                      Đã thanh toán
                    </Badge>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Budget Insights */}
      {remaining < 0 && (
        <Card className="p-6 bg-red-50 dark:bg-red-900/10 border-red-200">
          <div className="flex items-start space-x-3">
            <TrendingUp className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-300 mb-2">
                Cảnh báo vượt ngân sách
              </h3>
              <p className="text-sm text-red-800 dark:text-red-400">
                Bạn đã chi tiêu vượt quá {Math.abs(remaining).toLocaleString("vi-VN")}₫ so với kế hoạch ban đầu. 
                Hãy xem xét điều chỉnh ngân sách hoặc cắt giảm một số chi phí không cần thiết.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
