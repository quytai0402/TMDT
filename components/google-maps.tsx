'use client'

import { useEffect, useState } from 'react'
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api'
import { Card } from '@/components/ui/card'
import { MapPin } from 'lucide-react'

interface LocationMapProps {
  latitude: number
  longitude: number
  title?: string
  zoom?: number
  height?: string
}

const mapContainerStyle = {
  width: '100%',
  height: '400px',
}

export function LocationMap({ 
  latitude, 
  longitude, 
  title,
  zoom = 15,
  height = '400px'
}: LocationMapProps) {
  const [showInfo, setShowInfo] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)

  const center = {
    lat: latitude,
    lng: longitude,
  }

  const customMapContainerStyle = {
    ...mapContainerStyle,
    height,
  }

  // Fallback to static map if Google Maps fails
  const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=${zoom}&size=600x400&markers=color:red%7C${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}`

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-5 w-5" />
          <p>Vị trí: {latitude.toFixed(6)}, {longitude.toFixed(6)}</p>
        </div>
        <div className="mt-4 bg-gray-100 rounded-lg overflow-hidden">
          <img 
            src={staticMapUrl}
            alt="Location"
            className="w-full h-auto"
            onError={(e) => {
              // If static map also fails, show coordinates only
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>
      </Card>
    )
  }

  return (
    <LoadScript
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
      onLoad={() => setMapLoaded(true)}
    >
      <GoogleMap
        mapContainerStyle={customMapContainerStyle}
        center={center}
        zoom={zoom}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        }}
      >
        <Marker
          position={center}
          onClick={() => setShowInfo(true)}
          title={title}
        />

        {showInfo && title && (
          <InfoWindow
            position={center}
            onCloseClick={() => setShowInfo(false)}
          >
            <div className="p-2">
              <p className="font-semibold">{title}</p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </LoadScript>
  )
}

interface MultipleLocationsMapProps {
  locations: Array<{
    id: string
    latitude: number
    longitude: number
    title: string
    pricePerNight?: number
  }>
  onMarkerClick?: (id: string) => void
  zoom?: number
  height?: string
}

export function MultipleLocationsMap({
  locations,
  onMarkerClick,
  zoom = 12,
  height = '600px',
}: MultipleLocationsMapProps) {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)

  if (!locations || locations.length === 0) {
    return (
      <Card className="p-8 text-center">
        <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-muted-foreground">Không có địa điểm nào để hiển thị</p>
      </Card>
    )
  }

  // Calculate center from all locations
  const center = {
    lat: locations.reduce((sum, loc) => sum + loc.latitude, 0) / locations.length,
    lng: locations.reduce((sum, loc) => sum + loc.longitude, 0) / locations.length,
  }

  const customMapContainerStyle = {
    ...mapContainerStyle,
    height,
  }

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <Card className="p-8 text-center">
        <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-muted-foreground">
          Google Maps API key chưa được cấu hình
        </p>
        <p className="text-sm text-gray-500 mt-2">
          {locations.length} địa điểm có sẵn
        </p>
      </Card>
    )
  }

  return (
    <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
      <GoogleMap
        mapContainerStyle={customMapContainerStyle}
        center={center}
        zoom={zoom}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        }}
      >
        {locations.map((location) => (
          <Marker
            key={location.id}
            position={{
              lat: location.latitude,
              lng: location.longitude,
            }}
            onClick={() => {
              setSelectedLocation(location.id)
              onMarkerClick?.(location.id)
            }}
            title={location.title}
          />
        ))}

        {selectedLocation && (
          <InfoWindow
            position={{
              lat: locations.find(l => l.id === selectedLocation)!.latitude,
              lng: locations.find(l => l.id === selectedLocation)!.longitude,
            }}
            onCloseClick={() => setSelectedLocation(null)}
          >
            <div className="p-2">
              <p className="font-semibold">
                {locations.find(l => l.id === selectedLocation)!.title}
              </p>
              {locations.find(l => l.id === selectedLocation)!.pricePerNight && (
                <p className="text-sm text-gray-600 mt-1">
                  {locations.find(l => l.id === selectedLocation)!.pricePerNight?.toLocaleString('vi-VN')} ₫/đêm
                </p>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </LoadScript>
  )
}
