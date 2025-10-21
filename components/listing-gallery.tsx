"use client"

import { useState } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ListingGalleryProps {
  images: string[]
}

export function ListingGallery({ images }: ListingGalleryProps) {
  const [showModal, setShowModal] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <>
      {/* Gallery Grid */}
      <div className="grid grid-cols-4 gap-2 rounded-xl overflow-hidden h-[400px] md:h-[500px]">
        {/* Main Image */}
        <button
          onClick={() => {
            setCurrentIndex(0)
            setShowModal(true)
          }}
          className="col-span-4 md:col-span-2 row-span-2 relative overflow-hidden group"
        >
          <img
            src={images[0] || "/placeholder.svg"}
            alt="Main"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </button>

        {/* Secondary Images */}
        {images.slice(1, 5).map((image, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentIndex(index + 1)
              setShowModal(true)
            }}
            className="col-span-2 md:col-span-1 relative overflow-hidden group"
          >
            <img
              src={image || "/placeholder.svg"}
              alt={`Gallery ${index + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {index === 3 && images.length > 5 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-semibold">+{images.length - 5} ảnh</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Full Screen Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => setShowModal(false)}
          >
            <X className="h-6 w-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 text-white hover:bg-white/20"
            onClick={prevImage}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>

          <div className="max-w-6xl max-h-[90vh] px-16">
            <img
              src={images[currentIndex] || "/placeholder.svg"}
              alt={`Image ${currentIndex + 1}`}
              className="w-full h-full object-contain"
            />
            <div className="text-center text-white mt-4">
              {currentIndex + 1} / {images.length}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 text-white hover:bg-white/20"
            onClick={nextImage}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        </div>
      )}
    </>
  )
}
