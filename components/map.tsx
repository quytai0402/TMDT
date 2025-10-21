'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MapLocation {
  id: string
  lat: number
  lng: number
  title?: string
  price?: number
  image?: string
}

interface MapComponentProps {
  center?: { lat: number; lng: number }
  zoom?: number
  locations?: MapLocation[]
  selectedLocationId?: string
  onLocationClick?: (location: MapLocation) => void
  height?: string
  className?: string
  interactive?: boolean
}

export default function MapComponent({
  center = { lat: 40.7128, lng: -74.0060 }, // NYC default
  zoom = 12,
  locations = [],
  selectedLocationId,
  onLocationClick,
  height = '500px',
  className,
  interactive = true,
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    let mounted = true

    // Dynamically import Leaflet
    const initMap = async () => {
      try {
        const L = await import('leaflet')
        // Import CSS dynamically via link tag
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link')
          link.id = 'leaflet-css'
          link.rel = 'stylesheet'
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
          document.head.appendChild(link)
        }

        // Fix Leaflet default marker icon issue
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        })

        if (!mounted || !mapRef.current) return

        // Initialize map
        const map = L.map(mapRef.current, {
          center: [center.lat, center.lng],
          zoom: zoom,
          zoomControl: interactive,
          dragging: interactive,
          touchZoom: interactive,
          scrollWheelZoom: interactive,
          doubleClickZoom: interactive,
        })

        mapInstanceRef.current = map

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map)

        // Add markers for locations
        locations.forEach((location) => {
          // Create custom icon with price
          const iconHtml = location.price
            ? `
              <div class="relative">
                <div class="bg-white px-3 py-1.5 rounded-full shadow-lg border-2 border-gray-900 font-semibold text-sm whitespace-nowrap hover:scale-110 transition-transform cursor-pointer ${
                  selectedLocationId === location.id ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
                }">
                  $${location.price}
                </div>
              </div>
            `
            : undefined

          const customIcon = iconHtml
            ? L.divIcon({
                html: iconHtml,
                className: 'custom-marker-icon',
                iconSize: [0, 0],
                iconAnchor: [0, 0],
              })
            : undefined

          const marker = L.marker([location.lat, location.lng], {
            icon: customIcon,
          }).addTo(map)

          // Add popup if title exists
          if (location.title) {
            const popupContent = `
              <div class="p-2">
                ${location.image ? `<img src="${location.image}" alt="${location.title}" class="w-full h-32 object-cover rounded-lg mb-2" />` : ''}
                <div class="font-semibold mb-1">${location.title}</div>
                ${location.price ? `<div class="text-sm text-gray-600">$${location.price} / night</div>` : ''}
              </div>
            `
            marker.bindPopup(popupContent)
          }

          // Handle click
          if (onLocationClick) {
            marker.on('click', () => {
              onLocationClick(location)
            })
          }

          markersRef.current.push(marker)
        })

        // Fit bounds if multiple locations
        if (locations.length > 1) {
          const bounds = L.latLngBounds(
            locations.map((loc) => [loc.lat, loc.lng])
          )
          map.fitBounds(bounds, { padding: [50, 50] })
        }

        setIsLoading(false)
      } catch (err) {
        console.error('Map initialization error:', err)
        if (mounted) {
          setError('Failed to load map')
          setIsLoading(false)
        }
      }
    }

    initMap()

    return () => {
      mounted = false
      // Cleanup map
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
      markersRef.current = []
    }
  }, [center.lat, center.lng, zoom, locations, selectedLocationId, onLocationClick, interactive])

  if (error) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gray-100 rounded-lg',
          className
        )}
        style={{ height }}
      >
        <div className="text-center text-gray-500">
          <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('relative rounded-lg overflow-hidden', className)}>
      {isLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10"
          style={{ height }}
        >
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      )}
      <div ref={mapRef} style={{ height }} className="w-full" />
    </div>
  )
}

// Simple static map preview (for non-interactive displays)
export function StaticMapPreview({
  center,
  zoom = 13,
  className,
}: {
  center: { lat: number; lng: number }
  zoom?: number
  className?: string
}) {
  const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+000(${center.lng},${center.lat})/${center.lng},${center.lat},${zoom},0/600x400@2x?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw`

  return (
    <div className={cn('relative aspect-video rounded-lg overflow-hidden bg-gray-200', className)}>
      <img
        src={mapUrl}
        alt="Map preview"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <MapPin className="w-8 h-8 text-red-500" />
      </div>
    </div>
  )
}

// Skeleton loader for map
export function MapSkeleton({
  height = '500px',
  className,
}: {
  height?: string
  className?: string
}) {
  return (
    <div
      className={cn('bg-gray-200 rounded-lg animate-pulse', className)}
      style={{ height }}
    >
      <div className="w-full h-full flex items-center justify-center">
        <MapPin className="w-12 h-12 text-gray-300" />
      </div>
    </div>
  )
}
