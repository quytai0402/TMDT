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

      {/* Google Maps iframe */}
      <div className="w-full h-[400px] bg-muted rounded-lg overflow-hidden">
        <iframe
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}&output=embed&z=15`}
        />
      </div>
      
      <div className="mt-2 text-xs text-muted-foreground text-center">
        Tọa độ: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
      </div>
    </div>
  )
}
