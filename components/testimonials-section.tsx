'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react'

interface Testimonial {
  id: string
  name: string
  avatar: string
  location: string
  rating: number
  comment: string
  stayLocation: string
  verified: boolean
}

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const testimonials: Testimonial[] = [
    {
      id: '1',
      name: 'Minh Anh',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Minh',
      location: 'TP. Hồ Chí Minh',
      rating: 5,
      comment: 'Trải nghiệm tuyệt vời! Căn hộ sạch sẽ, view đẹp và chủ nhà rất nhiệt tình. Chắc chắn sẽ quay lại.',
      stayLocation: 'Đà Lạt',
      verified: true,
    },
    {
      id: '2',
      name: 'Hoàng Nam',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hoang',
      location: 'Hà Nội',
      rating: 5,
      comment: 'Homestay đẹp như mơ, không gian yên tĩnh lý tưởng cho nghỉ dưỡng. Dịch vụ chuyên nghiệp!',
      stayLocation: 'Phú Quốc',
      verified: true,
    },
    {
      id: '3',
      name: 'Thu Trang',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Thu',
      location: 'Đà Nẵng',
      rating: 5,
      comment: 'Booking rất dễ dàng, thanh toán an toàn. Homestay vượt mong đợi, gia đình tôi rất hài lòng.',
      stayLocation: 'Hội An',
      verified: true,
    },
    {
      id: '4',
      name: 'Quốc Anh',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Quoc',
      location: 'Cần Thơ',
      rating: 5,
      comment: 'Platform tuyệt vời, nhiều lựa chọn homestay chất lượng. Hỗ trợ khách hàng nhanh chóng.',
      stayLocation: 'Nha Trang',
      verified: true,
    },
    {
      id: '5',
      name: 'Phương Linh',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Phuong',
      location: 'Hải Phòng',
      rating: 5,
      comment: 'Giá cả hợp lý, chỗ nghỉ đúng như mô tả. Tôi đã giới thiệu cho bạn bè và họ cũng rất thích.',
      stayLocation: 'Sapa',
      verified: true,
    },
    {
      id: '6',
      name: 'Đức Minh',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Duc',
      location: 'Vũng Tàu',
      rating: 5,
      comment: 'Chuyến đi gia đình tuyệt vời nhờ có homestay này. Không gian rộng rãi, đầy đủ tiện nghi!',
      stayLocation: 'Hạ Long',
      verified: true,
    },
  ]

  const itemsPerPage = 3
  const maxIndex = Math.ceil(testimonials.length / itemsPerPage) - 1

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === maxIndex ? 0 : prev + 1))
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? maxIndex : prev - 1))
  }

  const visibleTestimonials = testimonials.slice(
    currentIndex * itemsPerPage,
    (currentIndex + 1) * itemsPerPage
  )

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl font-bold mb-2">
            Khách Hàng Nói Gì Về Chúng Tôi
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Hàng nghìn khách hàng đã tin tưởng và có những trải nghiệm tuyệt vời
          </p>
        </div>

        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {visibleTestimonials.map((testimonial) => (
              <Card
                key={testimonial.id}
                className="hover:shadow-xl transition-all duration-300 border-0"
              >
                <CardContent className="p-6">
                  <Quote className="w-8 h-8 text-primary/20 mb-4" />
                  
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>

                  <p className="text-foreground mb-6 line-clamp-4 italic">
                    "{testimonial.comment}"
                  </p>

                  <div className="flex items-center gap-3 pt-4 border-t">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                      <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{testimonial.name}</h4>
                        {testimonial.verified && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            ✓ Đã xác thực
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.location} • Đã ở tại {testimonial.stayLocation}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="hidden md:block">
            <Button
              variant="outline"
              size="icon"
              onClick={prevSlide}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 rounded-full shadow-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={nextSlide}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 rounded-full shadow-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
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
        <div className="flex justify-center gap-2 mt-8">
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

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 pt-12 border-t">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">10,000+</div>
            <div className="text-sm text-muted-foreground">Khách hàng hài lòng</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">1,500+</div>
            <div className="text-sm text-muted-foreground">Chỗ nghỉ chất lượng</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">4.9/5</div>
            <div className="text-sm text-muted-foreground">Đánh giá trung bình</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">24/7</div>
            <div className="text-sm text-muted-foreground">Hỗ trợ khách hàng</div>
          </div>
        </div>
      </div>
    </section>
  )
}
