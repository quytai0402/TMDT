"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Smartphone, Maximize2, RotateCcw, X, Info } from "lucide-react"
import { useState } from "react"
import Image from "next/image"

interface ARPreviewProps {
  roomName: string
  roomImage: string
  furnitureItems: Array<{
    id: string
    name: string
    image: string
    category: string
  }>
}

export function ARPreview({ roomName, roomImage, furnitureItems }: ARPreviewProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [placedItems, setPlacedItems] = useState<Array<{
    id: string
    x: number
    y: number
    scale: number
    rotation: number
  }>>([])
  const [selectedItem, setSelectedItem] = useState<string | null>(null)

  const handlePlaceItem = (itemId: string, x: number, y: number) => {
    setPlacedItems(prev => [
      ...prev,
      {
        id: itemId,
        x,
        y,
        scale: 1,
        rotation: 0
      }
    ])
  }

  const handleRemoveItem = (index: number) => {
    setPlacedItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleRoomClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selectedItem) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      handlePlaceItem(selectedItem, x, y)
      setSelectedItem(null)
    }
  }

  if (!isOpen) {
    return (
      <Card className="relative overflow-hidden group cursor-pointer" onClick={() => setIsOpen(true)}>
        <div className="relative h-64">
          <Image
            src={roomImage}
            alt={roomName}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
            <div className="text-white space-y-2">
              <Badge className="bg-purple-600 mb-2">
                AR Preview
              </Badge>
              <h3 className="font-semibold text-lg">AR Room Preview</h3>
              <p className="text-sm opacity-90">Xem trước phòng với AR, đặt đồ nội thất ảo</p>
            </div>
          </div>
          <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Smartphone className="h-6 w-6 text-white" />
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="text-white">
            <h2 className="font-semibold text-lg">AR Preview - {roomName}</h2>
            <p className="text-sm opacity-80">Đặt nội thất ảo để xem không gian</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main AR View */}
      <div
        className="relative w-full h-full flex items-center justify-center cursor-crosshair"
        onClick={handleRoomClick}
      >
        <Image
          src={roomImage}
          alt={roomName}
          fill
          className="object-cover"
          priority
        />

        {/* Placed Items */}
        {placedItems.map((item, index) => {
          const furnitureItem = furnitureItems.find(f => f.id === item.id)
          if (!furnitureItem) return null

          return (
            <div
              key={index}
              className="absolute group"
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                transform: `translate(-50%, -50%) scale(${item.scale}) rotate(${item.rotation}deg)`
              }}
            >
              <div className="relative">
                <Image
                  src={furnitureItem.image}
                  alt={furnitureItem.name}
                  width={120}
                  height={120}
                  className="object-contain drop-shadow-2xl"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveItem(index)
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )
        })}

        {selectedItem && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="text-white text-center space-y-2">
              <Smartphone className="h-12 w-12 mx-auto animate-bounce" />
              <p className="text-lg font-semibold">Click vào phòng để đặt vật dụng</p>
            </div>
          </div>
        )}
      </div>

      {/* Furniture Selector */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">Chọn đồ nội thất</h3>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPlacedItems([])}
              className="bg-white/20 hover:bg-white/30 text-white"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Xóa tất cả
            </Button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {furnitureItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item.id)}
                className={`shrink-0 group ${
                  selectedItem === item.id
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-black'
                    : ''
                }`}
              >
                <Card className="w-24 h-24 overflow-hidden bg-white/10 backdrop-blur-sm border-white/20">
                  <CardContent className="p-2 h-full flex flex-col items-center justify-center">
                    <div className="relative w-16 h-16">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                  </CardContent>
                </Card>
                <p className="text-white text-xs mt-1 text-center">{item.name}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
        <Card className="bg-black/60 backdrop-blur-sm border-white/20 text-white max-w-xs">
          <CardContent className="p-4 space-y-2 text-sm">
            <div className="flex items-center gap-2 font-semibold mb-2">
              <Info className="h-4 w-4" />
              <span>Hướng dẫn</span>
            </div>
            <div className="space-y-1">
              <p>1. Chọn đồ nội thất bên dưới</p>
              <p>2. Click vào phòng để đặt</p>
              <p>3. Hover để xóa vật dụng</p>
              <p>4. Click "Xóa tất cả" để reset</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
