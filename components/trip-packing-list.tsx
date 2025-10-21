"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Backpack,
  Plus,
  Check,
  Trash2,
  ShoppingCart,
  Shirt,
  Pill,
  Camera,
  Laptop,
  FileText
} from "lucide-react"
import { cn } from "@/lib/utils"

interface PackingItem {
  id: string
  category: string
  item: string
  quantity: number
  packed: boolean
}

const categoryIcons = {
  clothing: Shirt,
  toiletries: Pill,
  electronics: Laptop,
  documents: FileText,
  equipment: Camera,
  misc: ShoppingCart,
}

export function TripPackingList() {
  const [items, setItems] = useState<PackingItem[]>([
    { id: "1", category: "clothing", item: "Áo thun", quantity: 3, packed: true },
    { id: "2", category: "clothing", item: "Quần jeans", quantity: 2, packed: false },
    { id: "3", category: "toiletries", item: "Kem chống nắng", quantity: 1, packed: true },
    { id: "4", category: "electronics", item: "Sạc điện thoại", quantity: 1, packed: false },
    { id: "5", category: "documents", item: "CMND/CCCD", quantity: 1, packed: true },
    { id: "6", category: "equipment", item: "Máy ảnh", quantity: 1, packed: false },
  ])

  const [newItem, setNewItem] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("clothing")

  const categories = [
    { id: "clothing", label: "Quần áo", icon: Shirt },
    { id: "toiletries", label: "Đồ dùng cá nhân", icon: Pill },
    { id: "electronics", label: "Thiết bị điện tử", icon: Laptop },
    { id: "documents", label: "Giấy tờ", icon: FileText },
    { id: "equipment", label: "Trang thiết bị", icon: Camera },
    { id: "misc", label: "Khác", icon: ShoppingCart },
  ]

  const togglePacked = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, packed: !item.packed } : item
    ))
  }

  const addItem = () => {
    if (newItem.trim()) {
      setItems([...items, {
        id: Date.now().toString(),
        category: selectedCategory,
        item: newItem,
        quantity: 1,
        packed: false,
      }])
      setNewItem("")
    }
  }

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const getCategoryItems = (categoryId: string) => {
    return items.filter(item => item.category === categoryId)
  }

  const totalItems = items.length
  const packedItems = items.filter(item => item.packed).length
  const progress = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2 flex items-center">
            <Backpack className="w-6 h-6 mr-3 text-primary" />
            Danh sách đồ đạc
          </h2>
          <p className="text-muted-foreground">
            Chuẩn bị đồ cho chuyến đi của bạn
          </p>
        </div>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-primary mb-1">{progress}%</div>
          <div className="text-xs text-muted-foreground">Đã chuẩn bị</div>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Tiến độ chuẩn bị</span>
          <span className="text-sm text-muted-foreground">
            {packedItems} / {totalItems} món
          </span>
        </div>
        <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-green-500 to-emerald-500 h-full transition-all duration-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </Card>

      {/* Add New Item */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Thêm món đồ mới</h3>
        <div className="flex items-end space-x-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Tên món đồ</label>
            <Input
              placeholder="VD: Áo khoác, Dép..."
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addItem()}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Danh mục</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>
          <Button onClick={addItem}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm
          </Button>
        </div>
      </Card>

      {/* Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map(category => {
          const categoryItems = getCategoryItems(category.id)
          const packedCount = categoryItems.filter(item => item.packed).length
          const Icon = category.icon

          return (
            <Card key={category.id} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{category.label}</h3>
                    <p className="text-xs text-muted-foreground">
                      {packedCount} / {categoryItems.length} món
                    </p>
                  </div>
                </div>
                <Badge variant={packedCount === categoryItems.length && categoryItems.length > 0 ? "default" : "outline"}>
                  {categoryItems.length}
                </Badge>
              </div>

              {categoryItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Chưa có món đồ nào
                </p>
              ) : (
                <div className="space-y-2">
                  {categoryItems.map(item => (
                    <div
                      key={item.id}
                      className={cn(
                        "group flex items-center space-x-3 p-3 rounded-lg border hover:shadow-sm transition-all",
                        item.packed && "bg-muted/50"
                      )}
                    >
                      <Checkbox
                        checked={item.packed}
                        onCheckedChange={() => togglePacked(item.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "font-medium text-sm",
                          item.packed && "line-through text-muted-foreground"
                        )}>
                          {item.item}
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-xs text-muted-foreground">
                            Số lượng: {item.quantity}
                          </p>
                        )}
                      </div>
                      {item.packed && (
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold mb-1">{totalItems}</div>
          <div className="text-sm text-muted-foreground">Tổng món đồ</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">{packedItems}</div>
          <div className="text-sm text-muted-foreground">Đã chuẩn bị</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-600 mb-1">{totalItems - packedItems}</div>
          <div className="text-sm text-muted-foreground">Còn lại</div>
        </Card>
      </div>
    </div>
  )
}
