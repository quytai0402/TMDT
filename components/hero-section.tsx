"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

import { EnhancedSearchBar } from "./enhanced-search-bar"

const HERO_SLIDES = [
  {
    src: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=2000&q=80",
    alt: "Biệt thự hướng biển với hồ bơi riêng tại Phú Quốc",
  },
  {
    src: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=2000&q=80",
    alt: "Không gian đọc sách ấm áp nhìn ra rừng thông Đà Lạt",
  },
  {
    src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=80",
    alt: "Hồ bơi vô cực nhìn ra biển xanh ngọc",
  },
  {
    src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2000&q=80",
    alt: "Penthouse với tường kính đón bình minh",
  },
]

export function HeroSection() {
  const [currentImage, setCurrentImage] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % HERO_SLIDES.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative flex min-h-[720px] items-center justify-center overflow-hidden bg-gradient-to-br from-sky-50 via-white to-emerald-50">
      {/* Background Image Carousel */}
      <div className="absolute inset-0 z-0">
        {HERO_SLIDES.map((slide, idx) => (
          <div
            key={slide.src}
            className={`absolute inset-0 transition-all duration-[1600ms] ${
              idx === currentImage ? "opacity-100 scale-100" : "opacity-0 scale-105"
            }`}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              priority={idx === 0}
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-sky-100/70 to-white" />
            <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px]" />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 lg:px-8 py-24">
        <div className="mb-12 text-center animate-fade-in">
          <h1 className="text-balance font-serif text-5xl font-bold text-slate-900 md:text-6xl lg:text-7xl">
            Khám phá những nơi ở
            <br />
            <span className="bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
              độc đáo & sang trọng
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-pretty text-xl leading-relaxed text-slate-600 md:text-2xl">
            Trải nghiệm kỳ nghỉ đáng nhớ tại những homestay cao cấp được tuyển chọn kỹ lưỡng khắp Việt Nam và thế giới
          </p>
        </div>

        <EnhancedSearchBar />

        {/* Quick Stats */}
        <div className="mt-16 grid max-w-4xl grid-cols-2 gap-8 rounded-3xl border border-white/60 bg-white/80 p-6 shadow-[0_30px_80px_-70px_rgba(15,23,42,0.9)] backdrop-blur mx-auto md:grid-cols-4">
          {[
            { label: "Homestay cao cấp", value: "5,000+" },
            { label: "Thành phố", value: "200+" },
            { label: "Khách hài lòng", value: "98%" },
            { label: "Đánh giá 5 sao", value: "50,000+" },
          ].map((stat) => (
            <div key={stat.label} className="text-center text-slate-700">
              <div className="font-serif text-3xl font-bold text-slate-900 md:text-4xl">{stat.value}</div>
              <div className="text-sm text-slate-600 md:text-base">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Slide indicators */}
        <div className="mt-10 flex justify-center gap-2">
          {HERO_SLIDES.map((slide, idx) => (
            <button
              key={slide.src}
              type="button"
              aria-label={`Hiển thị ảnh ${idx + 1}`}
              className={`h-2 rounded-full transition-all ${
                idx === currentImage ? "w-10 bg-primary" : "w-4 bg-white/60 hover:bg-white"
              }`}
              onClick={() => setCurrentImage(idx)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
