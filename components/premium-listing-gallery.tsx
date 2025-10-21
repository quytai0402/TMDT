'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2,
  Grid3x3,
  Video,
  Layers,
  Share2,
  Heart,
  Download
} from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface GalleryImage {
  id: string
  url: string
  type: 'photo' | 'video' | 'tour360' | 'floorplan'
  title?: string
  thumbnail?: string
}

interface PremiumGalleryProps {
  images: GalleryImage[]
  title: string
}

export function PremiumListingGallery({ images, title }: PremiumGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [filter, setFilter] = useState<string>('all')
  const [isLiked, setIsLiked] = useState(false)

  const filteredImages = filter === 'all' 
    ? images 
    : images.filter(img => img.type === filter)

  const currentImage = filteredImages[currentIndex] || images[0]

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredImages.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + filteredImages.length) % filteredImages.length)
  }

  const openLightbox = (index: number) => {
    setCurrentIndex(index)
    setIsLightboxOpen(true)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />
      case 'tour360': return <Layers className="w-4 h-4" />
      case 'floorplan': return <Grid3x3 className="w-4 h-4" />
      default: return null
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'video': return 'Video'
      case 'tour360': return '360° Tour'
      case 'floorplan': return 'Sơ đồ mặt bằng'
      default: return 'Ảnh'
    }
  }

  const typeCounts = {
    all: images.length,
    photo: images.filter(i => i.type === 'photo').length,
    video: images.filter(i => i.type === 'video').length,
    tour360: images.filter(i => i.type === 'tour360').length,
    floorplan: images.filter(i => i.type === 'floorplan').length,
  }

  return (
    <>
      {/* Main Gallery Grid */}
      <div className="relative">
        {/* Featured Image */}
        <div className="relative h-[400px] md:h-[500px] lg:h-[600px] rounded-t-2xl overflow-hidden group">
          <img
            src={currentImage?.url || images[0]?.url}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          
          {/* Overlay Controls */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Top Bar */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
              <Badge variant="secondary" className="backdrop-blur bg-white/90">
                {currentIndex + 1} / {filteredImages.length}
              </Badge>
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  className="backdrop-blur bg-white/90 hover:bg-white"
                  onClick={() => setIsLiked(!isLiked)}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="backdrop-blur bg-white/90 hover:bg-white"
                >
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Navigation Arrows */}
            <Button
              size="icon"
              variant="ghost"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-black"
              onClick={prevImage}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-black"
              onClick={nextImage}
            >
              <ChevronRight className="w-6 h-6" />
            </Button>

            {/* Bottom Bar */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              {currentImage?.type && currentImage.type !== 'photo' && (
                <Badge className="backdrop-blur bg-primary/90 gap-2">
                  {getTypeIcon(currentImage.type)}
                  {getTypeLabel(currentImage.type)}
                </Badge>
              )}
              <div className="ml-auto">
                <Button
                  variant="secondary"
                  className="backdrop-blur bg-white/90 hover:bg-white gap-2"
                  onClick={() => openLightbox(currentIndex)}
                >
                  <Maximize2 className="w-4 h-4" />
                  Xem toàn màn hình
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={filter === 'all' ? 'default' : 'secondary'}
              onClick={() => setFilter('all')}
              className="backdrop-blur"
            >
              Tất cả ({typeCounts.all})
            </Button>
            {typeCounts.photo > 0 && (
              <Button
                size="sm"
                variant={filter === 'photo' ? 'default' : 'secondary'}
                onClick={() => setFilter('photo')}
                className="backdrop-blur"
              >
                Ảnh ({typeCounts.photo})
              </Button>
            )}
            {typeCounts.video > 0 && (
              <Button
                size="sm"
                variant={filter === 'video' ? 'default' : 'secondary'}
                onClick={() => setFilter('video')}
                className="backdrop-blur gap-2"
              >
                <Video className="w-4 h-4" />
                Video ({typeCounts.video})
              </Button>
            )}
            {typeCounts.tour360 > 0 && (
              <Button
                size="sm"
                variant={filter === 'tour360' ? 'default' : 'secondary'}
                onClick={() => setFilter('tour360')}
                className="backdrop-blur gap-2"
              >
                <Layers className="w-4 h-4" />
                360° Tour ({typeCounts.tour360})
              </Button>
            )}
            {typeCounts.floorplan > 0 && (
              <Button
                size="sm"
                variant={filter === 'floorplan' ? 'default' : 'secondary'}
                onClick={() => setFilter('floorplan')}
                className="backdrop-blur gap-2"
              >
                <Grid3x3 className="w-4 h-4" />
                Sơ đồ ({typeCounts.floorplan})
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Thumbnail Grid */}
      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 mt-4">
        {filteredImages.slice(0, 16).map((image, index) => (
          <button
            key={image.id}
            onClick={() => setCurrentIndex(index)}
            className={`relative aspect-square rounded-lg overflow-hidden group ${
              index === currentIndex ? 'ring-2 ring-primary' : ''
            }`}
          >
            <img
              src={image.thumbnail || image.url}
              alt={image.title || `Image ${index + 1}`}
              className="w-full h-full object-cover transition-transform group-hover:scale-110"
            />
            {image.type !== 'photo' && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="text-white">
                  {getTypeIcon(image.type)}
                </div>
              </div>
            )}
          </button>
        ))}
        {filteredImages.length > 16 && (
          <button
            onClick={() => openLightbox(16)}
            className="aspect-square rounded-lg bg-muted flex flex-col items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <Grid3x3 className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">+{filteredImages.length - 16}</span>
          </button>
        )}
      </div>

      {/* Lightbox Modal */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-[95vw] h-[95vh] p-0">
          <div className="relative w-full h-full bg-black">
            {/* Close Button */}
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-4 right-4 z-50 bg-white/10 hover:bg-white/20 text-white"
              onClick={() => setIsLightboxOpen(false)}
            >
              <X className="w-6 h-6" />
            </Button>

            {/* Image */}
            <div className="w-full h-full flex items-center justify-center p-8">
              {currentImage?.type === 'tour360' ? (
                <div className="w-full h-full flex items-center justify-center text-white">
                  <div className="text-center">
                    <Layers className="w-16 h-16 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-2">360° Virtual Tour</h3>
                    <p className="text-white/70">
                      Chức năng tham quan ảo 360° sẽ được tích hợp ở đây
                    </p>
                  </div>
                </div>
              ) : currentImage?.type === 'video' ? (
                <div className="w-full h-full flex items-center justify-center text-white">
                  <div className="text-center">
                    <Video className="w-16 h-16 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Video Preview</h3>
                    <p className="text-white/70">
                      Video player sẽ được hiển thị ở đây
                    </p>
                  </div>
                </div>
              ) : (
                <img
                  src={currentImage?.url}
                  alt={currentImage?.title || title}
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>

            {/* Navigation */}
            <Button
              size="icon"
              variant="ghost"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white"
              onClick={prevImage}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white"
              onClick={nextImage}
            >
              <ChevronRight className="w-6 h-6" />
            </Button>

            {/* Bottom Info Bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/70 mb-1">
                    {currentIndex + 1} / {filteredImages.length}
                  </p>
                  {currentImage?.title && (
                    <h3 className="text-lg font-semibold">{currentImage.title}</h3>
                  )}
                </div>
                <Button variant="ghost" className="text-white hover:bg-white/10 gap-2">
                  <Download className="w-4 h-4" />
                  Tải xuống
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
