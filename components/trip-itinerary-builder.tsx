"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Calendar, 
  MapPin, 
  Plus, 
  Clock, 
  Home,
  Utensils,
  Camera,
  ShoppingBag,
  Mountain,
  Trash2,
  GripVertical,
  Edit
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ItineraryItem {
  id: string
  day: number
  time: string
  type: "accommodation" | "dining" | "activity" | "shopping" | "sightseeing"
  title: string
  location: string
  notes?: string
  duration?: string
  cost?: number
}

const activityIcons = {
  accommodation: Home,
  dining: Utensils,
  activity: Mountain,
  shopping: ShoppingBag,
  sightseeing: Camera,
}

const activityColors = {
  accommodation: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300",
  dining: "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300",
  activity: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300",
  shopping: "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300",
  sightseeing: "bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-300",
}

export function TripItineraryBuilder() {
  const [selectedDay, setSelectedDay] = useState(1)
  const [items, setItems] = useState<ItineraryItem[]>([
    {
      id: "1",
      day: 1,
      time: "09:00",
      type: "accommodation",
      title: "Check-in tại Villa Đà Lạt",
      location: "123 Đường Trần Phú, Đà Lạt",
      notes: "Check-in từ 14:00, liên hệ host trước 30 phút",
      cost: 2500000,
    },
    {
      id: "2",
      day: 1,
      time: "12:00",
      type: "dining",
      title: "Ăn trưa tại Nhà Hàng Hoa Đà Lạt",
      location: "456 Phan Đình Phùng, Đà Lạt",
      duration: "1.5 giờ",
      cost: 400000,
    },
    {
      id: "3",
      day: 1,
      time: "15:00",
      type: "sightseeing",
      title: "Tham quan Hồ Xuân Hương",
      location: "Hồ Xuân Hương, Đà Lạt",
      duration: "2 giờ",
      cost: 0,
    },
  ])
  const [isAddingItem, setIsAddingItem] = useState(false)

  const totalDays = Math.max(...items.map(item => item.day), 3)
  const dayItems = items.filter(item => item.day === selectedDay)
  const totalCost = items.reduce((sum, item) => sum + (item.cost || 0), 0)

  const addNewItem = () => {
    const newItem: ItineraryItem = {
      id: Date.now().toString(),
      day: selectedDay,
      time: "10:00",
      type: "activity",
      title: "",
      location: "",
    }
    setItems([...items, newItem])
    setIsAddingItem(true)
  }

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Lịch trình chi tiết</h2>
          <p className="text-muted-foreground">
            Sắp xếp hoạt động theo từng ngày trong chuyến đi
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Tổng chi phí</p>
          <p className="text-2xl font-bold text-primary">
            {totalCost.toLocaleString("vi-VN")}₫
          </p>
        </div>
      </div>

      {/* Day Selector */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => {
          const dayItemCount = items.filter(item => item.day === day).length
          return (
            <Button
              key={day}
              variant={selectedDay === day ? "default" : "outline"}
              className={cn(
                "flex-shrink-0 min-w-[100px]",
                selectedDay === day && "shadow-md"
              )}
              onClick={() => setSelectedDay(day)}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Ngày {day}
              {dayItemCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {dayItemCount}
                </Badge>
              )}
            </Button>
          )
        })}
        <Button
          variant="outline"
          className="flex-shrink-0"
          onClick={() => {
            // Add new day logic
          }}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Timeline */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-lg">Ngày {selectedDay}</h3>
          <Button onClick={addNewItem} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Thêm hoạt động
          </Button>
        </div>

        {dayItems.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">Chưa có hoạt động</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Thêm các hoạt động, địa điểm ăn uống, và điểm tham quan
            </p>
            <Button onClick={addNewItem} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Thêm hoạt động đầu tiên
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {dayItems.map((item, index) => {
              const Icon = activityIcons[item.type]
              return (
                <div
                  key={item.id}
                  className="group relative flex items-start space-x-4 p-4 rounded-lg border hover:border-primary/50 hover:shadow-md transition-all"
                >
                  {/* Drag Handle */}
                  <button className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="w-5 h-5 text-muted-foreground" />
                  </button>

                  {/* Time */}
                  <div className="flex-shrink-0 w-20">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold">{item.time}</span>
                    </div>
                  </div>

                  {/* Icon */}
                  <div className={cn(
                    "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                    activityColors[item.type]
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{item.title}</h4>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                          <MapPin className="w-4 h-4" />
                          <span>{item.location}</span>
                        </div>
                        {item.notes && (
                          <p className="text-sm text-muted-foreground">{item.notes}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-2">
                          {item.duration && (
                            <Badge variant="outline" className="text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              {item.duration}
                            </Badge>
                          )}
                          {item.cost && item.cost > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {item.cost.toLocaleString("vi-VN")}₫
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => deleteItem(item.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>

                  {/* Connector Line */}
                  {index < dayItems.length - 1 && (
                    <div className="absolute left-[106px] top-[60px] w-[2px] h-[calc(100%+16px)] bg-border" />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Tổng ngày</div>
          <div className="text-2xl font-bold">{totalDays}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Hoạt động</div>
          <div className="text-2xl font-bold">{items.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Địa điểm</div>
          <div className="text-2xl font-bold">
            {new Set(items.map(item => item.location)).size}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Ước tính</div>
          <div className="text-2xl font-bold text-primary">
            {totalCost.toLocaleString("vi-VN")}₫
          </div>
        </Card>
      </div>
    </div>
  )
}
