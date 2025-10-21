"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Heart, 
  Plus,
  MapPin,
  Calendar,
  Users,
  Grid3x3,
  List,
  Search,
  Filter,
  Share2,
  Bookmark
} from "lucide-react"
import { cn } from "@/lib/utils"

interface InspirationCard {
  id: string
  image: string
  title: string
  location: string
  category: string
  saved: boolean
  notes?: string
}

export function TripInspirationBoard() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  
  const [inspirations, setInspirations] = useState<InspirationCard[]>([
    {
      id: "1",
      image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400",
      title: "Villa núi Đà Lạt",
      location: "Đà Lạt, Lâm Đồng",
      category: "accommodation",
      saved: true,
      notes: "Perfect for honeymoon",
    },
    {
      id: "2",
      image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400",
      title: "Bãi biển Nha Trang",
      location: "Nha Trang, Khánh Hòa",
      category: "destination",
      saved: true,
    },
    {
      id: "3",
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400",
      title: "Nhà hàng hải sản",
      location: "Nha Trang",
      category: "dining",
      saved: false,
    },
    {
      id: "4",
      image: "https://images.unsplash.com/photo-1464746133101-a2c3f88e0dd9?w=400",
      title: "Trekking Fansipan",
      location: "Sapa, Lào Cai",
      category: "activity",
      saved: true,
    },
    {
      id: "5",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
      title: "Vịnh Hạ Long",
      location: "Quảng Ninh",
      category: "destination",
      saved: false,
    },
    {
      id: "6",
      image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400",
      title: "Phố cổ Hội An",
      location: "Hội An, Quảng Nam",
      category: "destination",
      saved: true,
      notes: "Đi vào chiều tối để chụp ảnh đẹp",
    },
  ])

  const categories = [
    { id: "all", label: "Tất cả", count: inspirations.length },
    { id: "accommodation", label: "Chỗ nghỉ", count: inspirations.filter(i => i.category === "accommodation").length },
    { id: "destination", label: "Điểm đến", count: inspirations.filter(i => i.category === "destination").length },
    { id: "activity", label: "Hoạt động", count: inspirations.filter(i => i.category === "activity").length },
    { id: "dining", label: "Ẩm thực", count: inspirations.filter(i => i.category === "dining").length },
  ]

  const toggleSave = (id: string) => {
    setInspirations(inspirations.map(item => 
      item.id === id ? { ...item, saved: !item.saved } : item
    ))
  }

  const filteredInspirations = selectedCategory === "all" 
    ? inspirations 
    : inspirations.filter(item => item.category === selectedCategory)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Bảng cảm hứng chuyến đi</h2>
          <p className="text-muted-foreground">
            Lưu ý tưởng và lập kế hoạch cho chuyến đi của bạn
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Chia sẻ
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Thêm ý tưởng
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm ý tưởng..."
            className="pl-10"
          />
        </div>
        <div className="flex items-center space-x-2 border rounded-lg p-1">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {categories.map(category => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
            className="flex-shrink-0"
          >
            {category.label}
            <Badge variant="secondary" className="ml-2">
              {category.count}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Inspiration Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInspirations.map(item => (
            <Card key={item.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                
                {/* Save Button */}
                <button
                  onClick={() => toggleSave(item.id)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:scale-110 transition-transform"
                >
                  <Heart
                    className={cn(
                      "w-5 h-5",
                      item.saved ? "fill-red-500 text-red-500" : "text-gray-600"
                    )}
                  />
                </button>

                {/* Category Badge */}
                <div className="absolute top-4 left-4">
                  <Badge className="bg-white/90 backdrop-blur-sm text-gray-900">
                    {categories.find(c => c.id === item.category)?.label}
                  </Badge>
                </div>

                {/* Title and Location */}
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                  <div className="flex items-center text-sm">
                    <MapPin className="w-4 h-4 mr-1" />
                    {item.location}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {item.notes && (
                <div className="p-4 border-t">
                  <p className="text-sm text-muted-foreground">{item.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="p-4 border-t flex items-center justify-between">
                <Button variant="ghost" size="sm">
                  <Bookmark className="w-4 h-4 mr-2" />
                  Thêm vào chuyến đi
                </Button>
                <Button variant="ghost" size="sm">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInspirations.map(item => (
            <Card key={item.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-4">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-32 h-24 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 mr-1" />
                        {item.location}
                      </div>
                    </div>
                    <Badge variant="outline">
                      {categories.find(c => c.id === item.category)?.label}
                    </Badge>
                  </div>
                  {item.notes && (
                    <p className="text-sm text-muted-foreground mb-3">{item.notes}</p>
                  )}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={item.saved ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleSave(item.id)}
                    >
                      <Heart className={cn("w-4 h-4 mr-2", item.saved && "fill-current")} />
                      {item.saved ? "Đã lưu" : "Lưu"}
                    </Button>
                    <Button variant="outline" size="sm">
                      <Bookmark className="w-4 h-4 mr-2" />
                      Thêm vào chuyến đi
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredInspirations.length === 0 && (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Chưa có ý tưởng nào</h3>
          <p className="text-muted-foreground mb-4">
            Bắt đầu lưu các địa điểm và hoạt động yêu thích
          </p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Thêm ý tưởng đầu tiên
          </Button>
        </Card>
      )}
    </div>
  )
}
