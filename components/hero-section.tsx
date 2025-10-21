"use client"

import { SearchBar } from "./search-bar"
import { useState, useEffect } from "react"

const heroImages = [
  "/placeholder.svg?height=800&width=1600",
  "/placeholder.svg?height=800&width=1600",
  "/placeholder.svg?height=800&width=1600",
]

export function HeroSection() {
  const [currentImage, setCurrentImage] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative flex min-h-[700px] items-center justify-center overflow-hidden bg-gradient-to-br from-sky-50 via-white to-emerald-50">
      {/* Background Image Carousel */}
      <div className="absolute inset-0 z-0">
        {heroImages.map((img, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              idx === currentImage ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={img || "/placeholder.svg"}
              alt={`Hero background ${idx + 1}`}
              className="h-full w-full object-cover"
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-sky-100/60 to-white" />
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

        <SearchBar />

        {/* Quick Stats */}
        <div className="mt-16 grid max-w-4xl grid-cols-2 gap-8 rounded-3xl border border-white/60 bg-white/70 p-6 shadow-[0_30px_80px_-70px_rgba(15,23,42,0.9)] backdrop-blur mx-auto md:grid-cols-4">
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
      </div>
    </section>
  )
}
