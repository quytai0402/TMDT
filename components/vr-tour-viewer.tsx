"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Maximize2, RotateCcw, ZoomIn, ZoomOut, Move, X } from "lucide-react"
import { useState } from "react"
import Image from "next/image"

interface VRTourViewerProps {
  panoramas: Array<{
    id: string
    title: string
    image: string
    hotspots?: Array<{
      x: number
      y: number
      label: string
      target?: string
    }>
  }>
  initialPanorama?: string
}

export function VRTourViewer({ panoramas, initialPanorama }: VRTourViewerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentPanorama, setCurrentPanorama] = useState(
    panoramas.find(p => p.id === initialPanorama) || panoramas[0]
  )
  const [rotation, setRotation] = useState(0)
  const [zoom, setZoom] = useState(1)

  const handleRotateLeft = () => {
    setRotation(prev => (prev - 15) % 360)
  }

  const handleRotateRight = () => {
    setRotation(prev => (prev + 15) % 360)
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5))
  }

  const handleReset = () => {
    setRotation(0)
    setZoom(1)
  }

  if (!isOpen) {
    return (
      <Card className="relative overflow-hidden group cursor-pointer" onClick={() => setIsOpen(true)}>
        <div className="relative h-64">
          <Image
            src={currentPanorama.image}
            alt={currentPanorama.title}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-center justify-center">
            <div className="text-center text-white space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Eye className="h-8 w-8" />
              </div>
              <div>
                <p className="font-semibold text-lg">360° Virtual Tour</p>
                <p className="text-sm opacity-90">Khám phá không gian như bạn đang ở đó</p>
              </div>
            </div>
          </div>
          <Badge className="absolute top-4 left-4 bg-blue-600">
            VR Tour
          </Badge>
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
            <h2 className="font-semibold text-lg">{currentPanorama.title}</h2>
            <p className="text-sm opacity-80">360° Virtual Tour</p>
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

      {/* Main Viewer */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <div
          className="relative w-full h-full transition-transform duration-300"
          style={{
            transform: `rotate(${rotation}deg) scale(${zoom})`
          }}
        >
          <Image
            src={currentPanorama.image}
            alt={currentPanorama.title}
            fill
            className="object-cover"
            priority
          />

          {/* Hotspots */}
          {currentPanorama.hotspots?.map((hotspot, index) => (
            <button
              key={index}
              className="absolute w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white hover:bg-white/40 transition-colors flex items-center justify-center group"
              style={{
                left: `${hotspot.x}%`,
                top: `${hotspot.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
              onClick={() => {
                if (hotspot.target) {
                  const target = panoramas.find(p => p.id === hotspot.target)
                  if (target) {
                    setCurrentPanorama(target)
                    handleReset()
                  }
                }
              }}
            >
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <div className="absolute bottom-full mb-2 px-3 py-1.5 bg-black/80 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {hotspot.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-6">
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="secondary"
            size="icon"
            onClick={handleRotateLeft}
            className="bg-white/20 hover:bg-white/30 text-white border-white/20"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
          
          <Button
            variant="secondary"
            size="icon"
            onClick={handleRotateRight}
            className="bg-white/20 hover:bg-white/30 text-white border-white/20"
          >
            <RotateCcw className="h-5 w-5 scale-x-[-1]" />
          </Button>

          <Button
            variant="secondary"
            size="icon"
            onClick={handleZoomOut}
            className="bg-white/20 hover:bg-white/30 text-white border-white/20"
          >
            <ZoomOut className="h-5 w-5" />
          </Button>

          <Button
            variant="secondary"
            size="icon"
            onClick={handleZoomIn}
            className="bg-white/20 hover:bg-white/30 text-white border-white/20"
          >
            <ZoomIn className="h-5 w-5" />
          </Button>

          <Button
            variant="secondary"
            size="icon"
            onClick={handleReset}
            className="bg-white/20 hover:bg-white/30 text-white border-white/20"
          >
            <Maximize2 className="h-5 w-5" />
          </Button>
        </div>

        {/* Panorama Selector */}
        {panoramas.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4 overflow-x-auto pb-2">
            {panoramas.map((panorama) => (
              <button
                key={panorama.id}
                onClick={() => {
                  setCurrentPanorama(panorama)
                  handleReset()
                }}
                className={`relative w-20 h-20 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                  currentPanorama.id === panorama.id
                    ? 'border-white scale-110'
                    : 'border-white/30 hover:border-white/60'
                }`}
              >
                <Image
                  src={panorama.image}
                  alt={panorama.title}
                  fill
                  className="object-cover"
                />
                {currentPanorama.id === panorama.id && (
                  <div className="absolute inset-0 bg-primary/20" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
        <Card className="bg-black/60 backdrop-blur-sm border-white/20 text-white max-w-xs">
          <CardContent className="p-4 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Move className="h-4 w-4" />
              <span>Click hotspots để di chuyển</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              <span>Xoay view 360°</span>
            </div>
            <div className="flex items-center gap-2">
              <ZoomIn className="h-4 w-4" />
              <span>Zoom in/out chi tiết</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
