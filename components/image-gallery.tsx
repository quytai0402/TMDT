'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Grid, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageGalleryProps {
  images: string[]
  title: string
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [showAll, setShowAll] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  if (!images || images.length === 0) {
    return (
      <div className="relative h-96 bg-muted">
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Chưa có hình ảnh</p>
        </div>
      </div>
    )
  }

  const mainImage = images[0]
  const sideImages = images.slice(1, 5)

  return (
    <>
      <div className="relative">
        <div className="grid grid-cols-4 gap-2 h-[500px] overflow-hidden rounded-lg">
          {/* Main Image */}
          <button
            onClick={() => {
              setSelectedIndex(0)
              setShowAll(true)
            }}
            className="col-span-2 row-span-2 relative group overflow-hidden"
          >
            <Image
              src={mainImage}
              alt={`${title} - Main`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </button>

          {/* Side Images */}
          {sideImages.map((image, index) => (
            <button
              key={index}
              onClick={() => {
                setSelectedIndex(index + 1)
                setShowAll(true)
              }}
              className="relative group overflow-hidden"
            >
              <Image
                src={image}
                alt={`${title} - ${index + 2}`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </button>
          ))}
        </div>

        {/* Show All Button */}
        {images.length > 5 && (
          <Button
            variant="outline"
            size="sm"
            className="absolute bottom-4 right-4 bg-white hover:bg-white/90"
            onClick={() => setShowAll(true)}
          >
            <Grid className="h-4 w-4 mr-2" />
            Hiện tất cả {images.length} ảnh
          </Button>
        )}
      </div>

      {/* Lightbox */}
      <Dialog open={showAll} onOpenChange={setShowAll}>
        <DialogContent className="max-w-7xl h-[90vh] p-0">
          <div className="relative h-full">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white"
              onClick={() => setShowAll(false)}
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="flex h-full">
              {/* Main Viewer */}
              <div className="flex-1 relative bg-black">
                <Image
                  src={images[selectedIndex]}
                  alt={`${title} - ${selectedIndex + 1}`}
                  fill
                  className="object-contain"
                />

                {/* Navigation */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 rounded-full px-4 py-2">
                  <span className="text-sm font-medium">
                    {selectedIndex + 1} / {images.length}
                  </span>
                </div>
              </div>

              {/* Thumbnail Strip */}
              <div className="w-64 bg-muted p-4 overflow-y-auto">
                <div className="grid grid-cols-2 gap-2">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedIndex(index)}
                      className={cn(
                        'relative aspect-square overflow-hidden rounded-lg border-2 transition-all',
                        selectedIndex === index
                          ? 'border-primary ring-2 ring-primary ring-offset-2'
                          : 'border-transparent hover:border-primary/50'
                      )}
                    >
                      <Image
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
