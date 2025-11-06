import { 
  Wifi, 
  Wind, 
  Tv, 
  Waves, 
  Dumbbell, 
  Shield,
  Car,
  UtensilsCrossed,
  Refrigerator,
  Briefcase,
  WashingMachine,
  Droplet,
  PawPrint,
  Coffee
} from "lucide-react"

interface AmenitiesSectionProps {
  amenities: Array<{
    category: string
    items: string[]
  }>
}

// Mapping from English keys to Vietnamese labels
const amenityTranslations: Record<string, string> = {
  WIFI: "WiFi",
  AIR_CONDITIONING: "Điều hòa",
  PARKING: "Bãi đậu xe",
  GYM: "Phòng gym",
  KITCHEN: "Nhà bếp",
  POOL: "Hồ bơi",
  WORKSPACE: "Không gian làm việc",
  WASHER: "Máy giặt",
  TV: "TV",
  DRYER: "Máy sấy",
  PET_FRIENDLY: "Thú cưng được phép",
  BREAKFAST: "Bữa sáng",
}

const iconMap: Record<string, any> = {
  WIFI: Wifi,
  AIR_CONDITIONING: Wind,
  PARKING: Car,
  GYM: Dumbbell,
  KITCHEN: Refrigerator,
  POOL: Waves,
  WORKSPACE: Briefcase,
  WASHER: WashingMachine,
  TV: Tv,
  DRYER: Droplet,
  PET_FRIENDLY: PawPrint,
  BREAKFAST: Coffee,
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
                // Translate if needed
                const translatedItem = amenityTranslations[item] || item
                const Icon = iconMap[item] || iconMap[translatedItem] || Wifi
                return (
                  <div key={itemIndex} className="flex items-center space-x-3">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-foreground">{translatedItem}</span>
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
