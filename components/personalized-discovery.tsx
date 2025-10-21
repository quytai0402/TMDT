import { Flame, HeartHandshake, Leaf, Send } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const recommendedTrips = [
	{
		id: "tailor-family",
		title: "Gia đình thích hoạt động",
		description: "Các homestay rộng rãi với khu vui chơi, hồ bơi và dịch vụ trông trẻ theo giờ.",
		perks: ["Xếp lịch lớp nấu ăn", "Tour khám phá thiên nhiên", "Ưu tiên check-in sớm"],
		icon: Leaf,
	},
	{
		id: "romantic",
		title: "Kỳ nghỉ lãng mạn",
		description: "Không gian riêng tư với bồn tắm hoa, set-up champagne và bữa tối dưới ánh nến.",
		perks: ["Thiết kế lịch trình cá nhân", "Dịch vụ trang trí phòng", "Đưa đón sân bay"],
		icon: HeartHandshake,
	},
	{
		id: "bleisure",
		title: "Bleisure cho doanh nhân",
		description: "Căn hộ trung tâm với phòng họp mini, bàn làm việc chuẩn ergonomic và wifi 300Mbps.",
		perks: ["Pass coworking", "Hỗ trợ thư ký ảo", "Ưu đãi đối tác golf"],
		icon: Flame,
	},
]

export function PersonalizedDiscovery() {
	return (
		<section className="bg-gradient-to-b from-slate-50 to-white py-20" id="personalized-discovery">
			<div className="container mx-auto px-4 lg:px-8">
				<div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center">
					<div className="space-y-6">
						<div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1 text-sm font-semibold text-emerald-700">
							<Send className="h-4 w-4" />
							Dành riêng cho bạn
						</div>
						<h2 className="font-serif text-4xl font-bold text-slate-900 md:text-5xl">
							Khám phá trải nghiệm độc đáo
						</h2>
						<p className="text-lg text-slate-600">
							Thuật toán gợi ý dùng dữ liệu đặt phòng, lượt lưu và các theme yêu thích để đề xuất nơi ở, trải nghiệm
							và dịch vụ đính kèm phù hợp nhất.
						</p>
						<ul className="space-y-3 text-sm text-slate-600">
							<li className="flex items-center gap-3">
								<span className="h-2.5 w-2.5 rounded-full bg-primary" />
								Đồng bộ wishlist giữa web và ứng dụng
							</li>
							<li className="flex items-center gap-3">
								<span className="h-2.5 w-2.5 rounded-full bg-primary" />
								Đề xuất khung giờ giá tốt theo lịch rảnh của bạn
							</li>
							<li className="flex items-center gap-3">
								<span className="h-2.5 w-2.5 rounded-full bg-primary" />
								Gợi ý tiện nghi quan trọng và chính sách phù hợp
							</li>
						</ul>
						<Button className="rounded-xl bg-primary px-6 py-6 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90">
							Đăng nhập để xem gợi ý
						</Button>
					</div>

					<div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
						{recommendedTrips.map((trip) => {
							const Icon = trip.icon
							return (
								<Card
									key={trip.id}
									className="h-full rounded-3xl border border-slate-100 bg-white/90 shadow-[0_32px_80px_-60px_rgba(15,23,42,0.8)] backdrop-blur"
								>
									<CardHeader className="flex flex-row items-center gap-4 pb-3">
										<span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
											<Icon className="h-6 w-6" />
										</span>
										<div>
											<h3 className="text-xl font-semibold text-slate-900">{trip.title}</h3>
											<p className="text-sm text-primary/70">Đề xuất hôm nay</p>
										</div>
									</CardHeader>
									<CardContent className="space-y-4 text-slate-600">
										<p>{trip.description}</p>
										<div className="space-y-2">
											{trip.perks.map((perk) => (
												<div key={perk} className="flex items-center gap-2 text-sm">
													<span className="h-1.5 w-1.5 rounded-full bg-primary" />
													{perk}
												</div>
											))}
										</div>
									</CardContent>
								</Card>
							)
						})}
					</div>
				</div>
			</div>
		</section>
	)
}
