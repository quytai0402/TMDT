import { BadgeCheck, Camera, Film, Map, Scan } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ListingDigitalExperiencesProps {
	items: Array<{
		title: string
		description: string
		status: "ready" | "upcoming"
		icon: "virtual-tour" | "floor-plan" | "drone" | "guide"
	}>
}

const iconMap = {
	"virtual-tour": Scan,
	"floor-plan": Map,
	drone: Camera,
	guide: Film,
}

export function ListingDigitalExperiences({ items }: ListingDigitalExperiencesProps) {
	return (
		<div className="space-y-6 border-b border-border pb-8">
			<div className="flex items-center gap-3">
				<span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
					<BadgeCheck className="h-5 w-5" />
				</span>
				<div>
					<h3 className="text-xl font-semibold text-foreground">Trải nghiệm số nổi bật</h3>
					<p className="text-sm text-muted-foreground">
						Khám phá trước khi đặt phòng với tài nguyên số độc quyền từ LuxeStay.
					</p>
				</div>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
						{items.map((item) => {
							const Icon = iconMap[item.icon] ?? Scan
					return (
						<Card
							key={item.title}
							className="rounded-2xl border border-slate-100 bg-white/80 shadow-[0_24px_60px_-50px_rgba(15,23,42,0.7)]"
						>
							<CardHeader className="flex flex-row items-center gap-3 pb-2">
								<span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
									<Icon className="h-6 w-6" />
								</span>
								<div>
									<CardTitle className="text-lg text-foreground">{item.title}</CardTitle>
									<p className="text-xs font-semibold text-primary/70">
										{item.status === "ready" ? "Đã sẵn sàng xem" : "Sắp ra mắt"}
									</p>
								</div>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
							</CardContent>
						</Card>
					)
				})}
			</div>
		</div>
	)
}
