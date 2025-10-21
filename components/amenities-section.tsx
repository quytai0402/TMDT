import { Wifi, Wind, Tv, Waves, Dumbbell, Shield } from "lucide-react"

interface AmenitiesSectionProps {
  amenities: Array<{
    category: string
    items: string[]
  }>
}

const iconMap: Record<string, any> = {
  WiFi: Wifi,
  "Điều hòa": Wind,
  TV: Tv,
  "Hồ bơi riêng": Waves,
  Gym: Dumbbell,
  "Camera an ninh": Shield,
}

export function AmenitiesSection({ amenities }: AmenitiesSectionProps) {
  return (
    <div className="pb-8 border-b border-border">
      <h3 className="font-semibold text-xl text-foreground mb-6">Tiện nghi</h3>
      <div className="space-y-6">
        {amenities.map((category, index) => (
          <div key={index}>
            <h4 className="font-semibold text-foreground mb-3">{category.category}</h4>
            <div className="grid grid-cols-2 gap-4">
              {category.items.map((item, itemIndex) => {
                const Icon = iconMap[item] || Wifi
                return (
                  <div key={itemIndex} className="flex items-center space-x-3">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-foreground">{item}</span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
