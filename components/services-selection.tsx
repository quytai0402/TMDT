"use client"

import { useEffect, useMemo, useState } from "react"
import { type LucideIcon, Wifi, Car, Utensils, Coffee, Dumbbell, Sparkles, Shirt, Users, Wine, Baby, Info, PawPrint } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type ServiceCategory = "amenities" | "food" | "transport" | "experience" | "pet"
type ServiceUnit = "once" | "daily" | "person" | "pet"

interface Service {
  id: string
  name: string
  description: string
  price: number
  icon: LucideIcon
  category: ServiceCategory
  unit: ServiceUnit
}

const SERVICES: Service[] = [
  {
    id: "airport-pickup",
    name: "Đón sân bay",
    description: "Dịch vụ đưa đón sân bay VIP",
    price: 500_000,
    icon: Car,
    category: "transport",
    unit: "once",
  },
  {
    id: "breakfast",
    name: "Bữa sáng",
    description: "Buffet sáng với nhiều món Á - Âu",
    price: 150_000,
    icon: Coffee,
    category: "food",
    unit: "person",
  },
  {
    id: "lunch",
    name: "Bữa trưa",
    description: "Set lunch đặc sản địa phương",
    price: 200_000,
    icon: Utensils,
    category: "food",
    unit: "person",
  },
  {
    id: "dinner",
    name: "Bữa tối",
    description: "Dinner BBQ hoặc lẩu",
    price: 300_000,
    icon: Wine,
    category: "food",
    unit: "person",
  },
  {
    id: "wifi-premium",
    name: "WiFi Premium",
    description: "Nâng cấp tốc độ lên 500 Mbps",
    price: 100_000,
    icon: Wifi,
    category: "amenities",
    unit: "daily",
  },
  {
    id: "gym",
    name: "Phòng gym",
    description: "Truy cập phòng tập gym 24/7",
    price: 200_000,
    icon: Dumbbell,
    category: "amenities",
    unit: "daily",
  },
  {
    id: "cleaning",
    name: "Dọn phòng hàng ngày",
    description: "Dịch vụ dọn phòng và thay đồ giường",
    price: 150_000,
    icon: Sparkles,
    category: "amenities",
    unit: "daily",
  },
  {
    id: "laundry",
    name: "Giặt là",
    description: "Dịch vụ giặt ủi quần áo",
    price: 100_000,
    icon: Shirt,
    category: "amenities",
    unit: "once",
  },
  {
    id: "tour-guide",
    name: "Hướng dẫn viên địa phương",
    description: "HDV riêng cho cả nhóm",
    price: 800_000,
    icon: Users,
    category: "experience",
    unit: "daily",
  },
  {
    id: "babysitting",
    name: "Trông trẻ",
    description: "Dịch vụ trông trẻ chuyên nghiệp",
    price: 250_000,
    icon: Baby,
    category: "amenities",
    unit: "daily",
  },
  {
    id: "pet-stay",
    name: "Phí thú cưng",
    description: "Cho phép mang thú cưng đi cùng",
    price: 100_000,
    icon: PawPrint,
    category: "pet",
    unit: "pet",
  },
]

const UNIT_RATE_SUFFIX: Record<ServiceUnit, string> = {
  once: " mỗi lần",
  daily: " mỗi đêm",
  person: " mỗi khách mỗi đêm",
  pet: " mỗi thú cưng mỗi đêm",
}

export interface SelectedServiceSummary {
  id: string
  name: string
  description: string
  basePrice: number
  totalPrice: number
  unit: ServiceUnit
  quantity: number
  quantityLabel: string
  category: ServiceCategory
  metadata?: Record<string, any>
}

interface ServicesSelectionProps {
  nights: number
  guests: number
  value?: SelectedServiceSummary[]
  onServicesChange?: (total: number, selected: SelectedServiceSummary[]) => void
}

export function ServicesSelection({ nights = 1, guests = 1, value, onServicesChange }: ServicesSelectionProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(value?.map((service) => service.id) ?? [])
  const [selectedSummaries, setSelectedSummaries] = useState<SelectedServiceSummary[]>(value ?? [])
  const [petOptions, setPetOptions] = useState(() => {
    const petService = value?.find((service) => service.id === "pet-stay")
    return {
      nights: petService?.metadata?.petNights ?? 1,
      count: petService?.metadata?.numberOfPets ?? 1,
    }
  })

  useEffect(() => {
    if (!value) {
      setSelectedIds([])
      setSelectedSummaries([])
      setPetOptions({ nights: 1, count: 1 })
      return
    }

    setSelectedIds(value.map((service) => service.id))
    setSelectedSummaries(value)

    const petService = value.find((service) => service.id === "pet-stay")
    if (petService) {
      setPetOptions({
        nights: petService.metadata?.petNights ?? 1,
        count: petService.metadata?.numberOfPets ?? 1,
      })
    }
  }, [value])

  const categories = useMemo(
    () => [
      { id: "pet", label: "Thú cưng", services: SERVICES.filter((service) => service.category === "pet") },
      { id: "amenities", label: "Tiện nghi", services: SERVICES.filter((service) => service.category === "amenities") },
      { id: "food", label: "Ẩm thực", services: SERVICES.filter((service) => service.category === "food") },
      { id: "transport", label: "Di chuyển", services: SERVICES.filter((service) => service.category === "transport") },
      { id: "experience", label: "Trải nghiệm", services: SERVICES.filter((service) => service.category === "experience") },
    ],
    [],
  )

  const calculateServicePrice = (
    service: Service,
    overrides?: { petNights?: number; numberOfPets?: number },
  ): number => {
    const petNights = overrides?.petNights ?? petOptions.nights
    const numberOfPets = overrides?.numberOfPets ?? petOptions.count

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

  const getUnitLabel = (
    service: Service,
    overrides?: { petNights?: number; numberOfPets?: number },
  ): string => {
    const petNights = overrides?.petNights ?? petOptions.nights
    const numberOfPets = overrides?.numberOfPets ?? petOptions.count

    if (service.unit === "pet") {
      return `${numberOfPets} thú cưng × ${petNights} đêm`
    }

    switch (service.unit) {
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

  const buildSelectedSummaries = (
    ids: string[],
    overrides?: { petNights?: number; numberOfPets?: number },
  ): SelectedServiceSummary[] => {
    return SERVICES.filter((service) => ids.includes(service.id)).map((service) => {
      const totalPrice = calculateServicePrice(service, overrides)
      const quantityLabel = getUnitLabel(service, overrides)
      let quantity = 1

      if (service.unit === "daily") {
        quantity = nights
      } else if (service.unit === "person") {
        quantity = guests * nights
      } else if (service.unit === "pet") {
        const petNights = overrides?.petNights ?? petOptions.nights
        const numberOfPets = overrides?.numberOfPets ?? petOptions.count
        quantity = petNights * numberOfPets
      }

      const metadata =
        service.unit === "pet"
          ? {
              petNights: overrides?.petNights ?? petOptions.nights,
              numberOfPets: overrides?.numberOfPets ?? petOptions.count,
            }
          : undefined

      return {
        id: service.id,
        name: service.name,
        description: service.description,
        basePrice: service.price,
        totalPrice,
        unit: service.unit,
        quantity,
        quantityLabel,
        category: service.category,
        metadata,
      }
    })
  }

  const emitChange = (ids: string[], overrides?: { petNights?: number; numberOfPets?: number }) => {
    const summaries = buildSelectedSummaries(ids, overrides)
    setSelectedSummaries(summaries)

    const total = summaries.reduce((sum, service) => sum + service.totalPrice, 0)
    onServicesChange?.(total, summaries)
  }

  const toggleService = (serviceId: string) => {
    const updated = selectedIds.includes(serviceId)
      ? selectedIds.filter((id) => id !== serviceId)
      : [...selectedIds, serviceId]

    setSelectedIds(updated)
    emitChange(updated)
  }

  const handlePetOptionChange = (option: "nights" | "count", value: number) => {
    const sanitized = option === "nights" ? Math.max(1, Math.min(value, nights)) : Math.max(1, value)
    const updatedOptions = {
      nights: option === "nights" ? sanitized : petOptions.nights,
      count: option === "count" ? sanitized : petOptions.count,
    }
    setPetOptions(updatedOptions)

    if (selectedIds.includes("pet-stay")) {
      emitChange(selectedIds, {
        petNights: updatedOptions.nights,
        numberOfPets: updatedOptions.count,
      })
    }
  }

  const totalServicesPrice = useMemo(
    () => selectedSummaries.reduce((sum, service) => sum + service.totalPrice, 0),
    [selectedSummaries],
  )

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="font-semibold text-lg mb-2">Dịch vụ bổ sung</h3>
          <p className="text-sm text-muted-foreground">Chọn các dịch vụ để nâng cao trải nghiệm của bạn</p>
        </div>
        {selectedIds.length > 0 && <Badge className="text-base px-4 py-2">{selectedIds.length} dịch vụ</Badge>}
      </div>

      <div className="space-y-6">
        {categories.map((category, idx) => (
          <div key={category.id}>
            {category.services.length > 0 && (
              <>
                <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">
                  {category.label}
                </h4>
                <div className="space-y-3 mb-6">
                  {category.services.map((service) => {
                    const Icon = service.icon
                    const isSelected = selectedIds.includes(service.id)
                    const servicePrice = calculateServicePrice(service)

                    return (
                      <div
                        key={service.id}
                        className={`flex items-start space-x-4 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                          isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50"
                        }`}
                        onClick={() => toggleService(service.id)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleService(service.id)}
                          className="mt-1"
                          onClick={(event) => event.stopPropagation()}
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                              </div>
                              <div>
                                <h5 className="font-semibold">{service.name}</h5>
                                <p className="text-sm text-muted-foreground">{service.description}</p>
                              </div>
                            </div>
                          </div>

                          {service.id === "pet-stay" && isSelected && (
                            <div className="grid grid-cols-2 gap-3 mt-3 mb-3" onClick={(event) => event.stopPropagation()}>
                              <div>
                                <Label className="text-xs text-muted-foreground mb-1">Số lượng thú cưng</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={petOptions.count}
                                  onChange={(event) => handlePetOptionChange("count", parseInt(event.target.value) || 1)}
                                  className="h-9"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground mb-1">Số đêm lưu trú</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  max={nights}
                                  value={petOptions.nights}
                                  onChange={(event) => handlePetOptionChange("nights", parseInt(event.target.value) || 1)}
                                  className="h-9"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Tối đa {nights} đêm</p>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <Info className="w-4 h-4" />
                              <span>{getUnitLabel(service)}</span>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-primary">{servicePrice.toLocaleString("vi-VN")}₫</p>
                              <p className="text-xs text-muted-foreground">
                                {service.price.toLocaleString("vi-VN")}₫{UNIT_RATE_SUFFIX[service.unit]}
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
            {idx < categories.length - 1 && category.services.length > 0 && <Separator className="my-4" />}
          </div>
        ))}
      </div>

      {selectedIds.length > 0 ? (
        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Tổng chi phí dịch vụ</p>
              <p className="text-sm text-muted-foreground">{selectedIds.length} dịch vụ đã chọn</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{totalServicesPrice.toLocaleString("vi-VN")}₫</p>
              <p className="text-xs text-muted-foreground">Sẽ được cộng vào tổng giá</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground text-sm">Chưa có dịch vụ nào được chọn</div>
      )}
    </Card>
  )
}
