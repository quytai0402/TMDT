"use client"

interface LocationMapProps {
  coordinates: {
    lat: number
    lng: number
  }
  address: string
}

export function LocationMap({ coordinates, address }: LocationMapProps) {
  return (
    <div className="pb-8 border-b border-border">
      <h3 className="font-semibold text-xl text-foreground mb-4">Vị trí</h3>
      <p className="text-muted-foreground mb-4">{address}</p>

      {/* Placeholder for map - will integrate Google Maps later */}
      <div className="w-full h-[400px] bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">Bản đồ sẽ được hiển thị tại đây</p>
          <p className="text-sm text-muted-foreground">
            Tọa độ: {coordinates.lat}, {coordinates.lng}
          </p>
        </div>
      </div>
    </div>
  )
}
