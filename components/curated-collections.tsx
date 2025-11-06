import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"

const collections = [
  {
    id: "healing",
    title: "Homestay chữa lành tại Đà Lạt",
    description:
      "Không gian xanh mát với khí hậu se lạnh, lý tưởng để tái tạo năng lượng và ngắm sương mai.",
    image: "https://images.unsplash.com/photo-1470246973918-29a93221c455?auto=format&fit=crop&w=1200&q=80",
    tags: ["Rừng thông", "Trà chiều", "Spa"],
  },
  {
    id: "luxury-villa",
    title: "Biệt thự sang chảnh tại Phú Quốc",
    description: "Phòng ngủ hướng biển, hồ bơi vô cực và dịch vụ quản gia riêng chuẩn resort 5 sao.",
    image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
    tags: ["Hồ bơi vô cực", "Bữa tối riêng", "Beach club"],
  },
  {
    id: "weekend",
    title: "Weekend getaway gần Sài Gòn",
    description: "Di chuyển 2 giờ là tới, phù hợp cho nhóm bạn đổi gió cuối tuần với BBQ và karaoke.",
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
    tags: ["BBQ", "Phòng karaoke", "Sân vườn"],
  },
  {
    id: "workation",
    title: "Workation tại Đà Nẵng",
    description:
      "Làm việc từ xa với WiFi 300Mbps, workspace riêng và view biển tuyệt đẹp. Work-life balance hoàn hảo.",
    image: "https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=1200&q=80",
    tags: ["WiFi cao tốc", "Coworking", "Beach view"],
  },
]

export function CuratedCollections() {
	return (
		<section className="bg-gradient-to-b from-white via-sky-50/60 to-white py-20">
			<div className="container mx-auto px-4 lg:px-8">
				<div className="flex flex-col gap-4 text-center">
					<div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-4 py-1 text-sm font-semibold text-primary shadow-sm">
						<Sparkles className="h-4 w-4" />
						Bộ sưu tập được tuyển chọn
					</div>
					<h2 className="font-serif text-4xl font-bold text-slate-900 md:text-5xl">Gợi ý cho hành trình tiếp theo</h2>
					<p className="mx-auto max-w-3xl text-lg text-slate-600">
						Đội ngũ LuxeStay tuyển chọn kỹ lưỡng để bạn tiết kiệm thời gian tìm kiếm và trải nghiệm đúng gu.
					</p>
				</div>

				<div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {collections.map((collection) => (
            <div
              key={collection.id}
              className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_24px_50px_-30px_rgba(15,23,42,0.4)] transition-all duration-500 hover:-translate-y-2"
            >
              <div className="relative h-64 overflow-hidden">
                <Image
                  src={collection.image}
                  alt={collection.title}
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  priority={collection.id === "healing"}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/20 to-transparent" />
              </div>
							<div className="space-y-4 px-6 pb-6 pt-6">
								<div className="flex flex-wrap gap-2">
									{collection.tags.map((tag) => (
										<Badge key={tag} variant="secondary" className="rounded-full bg-primary/10 text-primary">
											{tag}
										</Badge>
									))}
								</div>
								<div className="space-y-3">
									<h3 className="text-2xl font-semibold text-slate-900">{collection.title}</h3>
									<p className="text-base text-slate-600">{collection.description}</p>
								</div>
								<Link
									href={`/collections/${collection.id}`}
									className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
								>
									Khám phá ngay
									<ArrowRight className="h-4 w-4" />
								</Link>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	)
}
