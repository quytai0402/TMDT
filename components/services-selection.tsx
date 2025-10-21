"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Wifi,
  Car,
  Utensils,
  Coffee,
  Dumbbell,
  Sparkles,
  Shirt,
  Users,
  Wine,
  Baby,
  Info,
  PawPrint
} from "lucide-react"

interface Service {
  id: string
  name: string
  description: string
  price: number
  icon: any
  category: "amenities" | "food" | "transport" | "experience" | "pet"
  unit: "once" | "daily" | "person" | "pet"
}

interface ServicesSelectionProps {
  nights: number
  guests: number
  onServicesChange?: (total: number, selected: Service[]) => void
}

export function ServicesSelection({ 
  nights = 1, 
  guests = 1,
  onServicesChange 
}: ServicesSelectionProps) {
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [petNights, setPetNights] = useState(1)
  const [numberOfPets, setNumberOfPets] = useState(1)

  const services: Service[] = [
    {
      id: "airport-pickup",
      name: "Đón sân bay",
      description: "Dịch vụ đưa đón sân bay VIP",
      price: 500000,
      icon: Car,
      category: "transport",
      unit: "once",
    },
    {
      id: "breakfast",
      name: "Bữa sáng",
      description: "Buffet sáng với nhiều món Á - Âu",
      price: 150000,
      icon: Coffee,
      category: "food",
      unit: "person",
    },
    {
      id: "lunch",
      name: "Bữa trưa",
      description: "Set lunch đặc sản địa phương",
      price: 200000,
      icon: Utensils,
      category: "food",
      unit: "person",
    },
    {
      id: "dinner",
      name: "Bữa tối",
      description: "Dinner BBQ hoặc lẩu",
      price: 300000,
      icon: Wine,
      category: "food",
      unit: "person",
    },
    {
      id: "wifi-premium",
      name: "WiFi Premium",
      description: "Nâng cấp tốc độ lên 500 Mbps",
      price: 100000,
      icon: Wifi,
      category: "amenities",
      unit: "daily",
    },
    {
      id: "gym",
      name: "Phòng gym",
      description: "Truy cập phòng tập gym 24/7",
      price: 200000,
      icon: Dumbbell,
      category: "amenities",
      unit: "daily",
    },
    {
      id: "cleaning",
      name: "Dọn phòng hàng ngày",
      description: "Dịch vụ dọn phòng và thay đồ giường",
      price: 150000,
      icon: Sparkles,
      category: "amenities",
      unit: "daily",
    },
    {
      id: "laundry",
      name: "Giặt là",
      description: "Dịch vụ giặt ủi quần áo",
      price: 100000,
      icon: Shirt,
      category: "amenities",
      unit: "once",
    },
    {
      id: "tour-guide",
      name: "Hướng dẫn viên địa phương",
      description: "HDV riêng cho cả nhóm",
      price: 800000,
      icon: Users,
      category: "experience",
      unit: "daily",
    },
    {
      id: "babysitting",
      name: "Trông trẻ",
      description: "Dịch vụ trông trẻ chuyên nghiệp",
      price: 250000,
      icon: Baby,
      category: "amenities",
      unit: "daily",
    },
    {
      id: "pet-stay",
      name: "Phí thú cưng",
      description: "Cho phép mang thú cưng đi cùng",
      price: 100000,
      icon: PawPrint,
      category: "pet",
      unit: "pet",
    },
  ]

  const toggleService = (serviceId: string) => {
    const updated = selectedServices.includes(serviceId)
      ? selectedServices.filter(id => id !== serviceId)
      : [...selectedServices, serviceId]
    
    setSelectedServices(updated)
    
    // Calculate total and notify parent
    const selected = services.filter(s => updated.includes(s.id))
    const total = calculateTotal(selected)
    onServicesChange?.(total, selected)
  }

  const calculateServicePrice = (service: Service): number => {
    if (service.unit === "pet") {
      return service.price * petNights * numberOfPets
    }
    
    switch (service.unit) {
      case "once":
        return service.price
      case "daily":
        return service.price * nights
      case "person":
        return service.price * guests * nights
      default:
        return service.price
    }
  }

  const calculateTotal = (selected: Service[]): number => {
    return selected.reduce((sum, service) => sum + calculateServicePrice(service), 0)
  }

  const totalServicesPrice = calculateTotal(
    services.filter(s => selectedServices.includes(s.id))
  )

  const categories = [
    { id: "pet", label: "Thú cưng", services: services.filter(s => s.category === "pet") },
    { id: "amenities", label: "Tiện nghi", services: services.filter(s => s.category === "amenities") },
    { id: "food", label: "Ẩm thực", services: services.filter(s => s.category === "food") },
    { id: "transport", label: "Di chuyển", services: services.filter(s => s.category === "transport") },
    { id: "experience", label: "Trải nghiệm", services: services.filter(s => s.category === "experience") },
  ]

  const getUnitLabel = (unit: string, service: Service): string => {
    if (unit === "pet") {
      return `${numberOfPets} thú cưng × ${petNights} đêm`
    }
    
    switch (unit) {
      case "once":
        return "1 lần"
      case "daily":
        return `${nights} đêm`
      case "person":
        return `${guests} người × ${nights} đêm`
      default:
        return ""
    }
  }

  const handlePetNightsChange = (value: number) => {
    const validValue = Math.max(1, Math.min(value, nights))
    setPetNights(validValue)
    
    // Recalculate if pet service is selected
    if (selectedServices.includes("pet-stay")) {
      const selected = services.filter(s => selectedServices.includes(s.id))
      const total = calculateTotal(selected)
      onServicesChange?.(total, selected)
    }
  }

  const handleNumberOfPetsChange = (value: number) => {
    const validValue = Math.max(1, value)
    setNumberOfPets(validValue)
    
    // Recalculate if pet service is selected
    if (selectedServices.includes("pet-stay")) {
      const selected = services.filter(s => selectedServices.includes(s.id))
      const total = calculateTotal(selected)
      onServicesChange?.(total, selected)
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="font-semibold text-lg mb-2">Dịch vụ bổ sung</h3>
          <p className="text-sm text-muted-foreground">
            Chọn các dịch vụ để nâng cao trải nghiệm của bạn
          </p>
        </div>
        {selectedServices.length > 0 && (
          <Badge className="text-base px-4 py-2">
            {selectedServices.length} dịch vụ
          </Badge>
        )}
      </div>

      {/* Services by Category */}
      <div className="space-y-6">
        {categories.map((category, idx) => (
          <div key={category.id}>
            {category.services.length > 0 && (
              <>
                <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">
                  {category.label}
                </h4>
                <div className="space-y-3 mb-6">
                  {category.services.map(service => {
                    const Icon = service.icon
                    const isSelected = selectedServices.includes(service.id)
                    const servicePrice = calculateServicePrice(service)

                    return (
                      <div
                        key={service.id}
                        className={`
                          flex items-start space-x-4 p-4 rounded-lg border-2 transition-all cursor-pointer
                          ${isSelected 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                          }
                        `}
                        onClick={() => toggleService(service.id)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleService(service.id)}
                          className="mt-1"
                          onClick={(e) => e.stopPropagation()}
                        />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className={`
                                w-8 h-8 rounded-lg flex items-center justify-center
                                ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted"}
                              `}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div>
                                <h5 className="font-semibold">{service.name}</h5>
                                <p className="text-sm text-muted-foreground">
                                  {service.description}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Pet Configuration */}
                          {service.id === "pet-stay" && isSelected && (
                            <div className="grid grid-cols-2 gap-3 mt-3 mb-3" onClick={(e) => e.stopPropagation()}>
                              <div>
                                <Label className="text-xs text-muted-foreground mb-1">Số lượng thú cưng</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={numberOfPets}
                                  onChange={(e) => handleNumberOfPetsChange(parseInt(e.target.value) || 1)}
                                  className="h-9"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground mb-1">Số đêm lưu trú</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  max={nights}
                                  value={petNights}
                                  onChange={(e) => handlePetNightsChange(parseInt(e.target.value) || 1)}
                                  className="h-9"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  Tối đa {nights} đêm
                                </p>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <Info className="w-4 h-4" />
                              <span>{getUnitLabel(service.unit, service)}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground line-through">
                                {service.price.toLocaleString("vi-VN")}₫
                              </p>
                              <p className="font-bold text-primary">
                                {servicePrice.toLocaleString("vi-VN")}₫
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
            {idx < categories.length - 1 && category.services.length > 0 && (
              <Separator className="my-4" />
            )}
          </div>
        ))}
      </div>

      {/* Total Services Cost */}
      {selectedServices.length > 0 && (
        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Tổng chi phí dịch vụ</p>
              <p className="text-sm text-muted-foreground">
                {selectedServices.length} dịch vụ đã chọn
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">
                {totalServicesPrice.toLocaleString("vi-VN")}₫
              </p>
              <p className="text-xs text-muted-foreground">
                Sẽ được cộng vào tổng giá
              </p>
            </div>
          </div>
        </div>
      )}

      {/* No Services Selected */}
      {selectedServices.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Chưa có dịch vụ nào được chọn
        </div>
      )}
    </Card>
  )
}
