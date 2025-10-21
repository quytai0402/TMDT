'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, MapPin, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface Destination {
  id: string
  name: string
  image: string
  listings: number
  avgPrice: number
  description: string
  trending?: boolean
}

export function FeaturedDestinations() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const destinations: Destination[] = [
    {
      id: '1',
      name: 'Đà Lạt',
      image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80',
      listings: 245,
      avgPrice: 850000,
      description: 'Thành phố ngàn hoa với khí hậu mát mẻ quanh năm',
      trending: true,
    },
    {
      id: '2',
      name: 'Phú Quốc',
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
      listings: 189,
      avgPrice: 1200000,
      description: 'Thiên đường biển đảo với bãi cát trắng tuyệt đẹp',
      trending: true,
    },
    {
      id: '3',
      name: 'Hội An',
      image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80',
      listings: 156,
      avgPrice: 750000,
      description: 'Phố cổ với di sản văn hóa thế giới',
    },
    {
      id: '4',
      name: 'Sapa',
      image: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80',
      listings: 123,
      avgPrice: 650000,
      description: 'Ruộng bậc thang và văn hóa vùng cao đặc sắc',
    },
    {
      id: '5',
      name: 'Nha Trang',
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
      listings: 198,
      avgPrice: 950000,
      description: 'Bãi biển xanh ngắt và các hoạt động thể thao nước',
      trending: true,
    },
    {
      id: '6',
      name: 'Hạ Long',
      image: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80',
      listings: 167,
      avgPrice: 1100000,
      description: 'Kỳ quan thiên nhiên với vịnh biển đẹp nhất Việt Nam',
    },
  ]

  const itemsPerPage = 3
  const maxIndex = Math.ceil(destinations.length / itemsPerPage) - 1

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === maxIndex ? 0 : prev + 1))
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? maxIndex : prev - 1))
  }

  const visibleDestinations = destinations.slice(
    currentIndex * itemsPerPage,
    (currentIndex + 1) * itemsPerPage
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-serif text-3xl font-bold mb-2">
              Điểm Đến Nổi Bật
            </h2>
            <p className="text-muted-foreground">
              Khám phá những địa điểm du lịch hấp dẫn nhất Việt Nam
            </p>
          </div>
          <div className="hidden md:flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={prevSlide}
              className="rounded-full"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={nextSlide}
              className="rounded-full"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {visibleDestinations.map((destination) => (
            <Link key={destination.id} href={`/search?location=${destination.name}`}>
              <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-0">
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={destination.image}
                    alt={destination.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {destination.trending && (
                    <div className="absolute top-4 right-4">
                      <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Trending
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="font-serif text-2xl font-bold mb-1">
                      {destination.name}
                    </h3>
                    <p className="text-sm text-white/90 line-clamp-2">
                      {destination.description}
                    </p>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{destination.listings} chỗ nghỉ</span>
                    </div>
                    <div className="font-semibold">
                      Từ {formatCurrency(destination.avgPrice)}/đêm
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="icon"
            onClick={prevSlide}
            className="rounded-full"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={nextSlide}
            className="rounded-full"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Pagination Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-primary w-8'
                  : 'bg-muted-foreground/30'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
