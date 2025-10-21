import { Lightbulb, SmilePlus, ThumbsDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ReviewAiSummaryProps {
	highlights: Array<{ label: string; percentage: number; sentiment: "positive" | "negative" }>
	summary: string
	trendingTopics: string[]
}

const sentimentColor: Record<"positive" | "negative", string> = {
	positive: "text-emerald-600",
	negative: "text-rose-500",
}

const sentimentIcon = {
	positive: SmilePlus,
	negative: ThumbsDown,
}

export function ReviewAiSummary({ highlights, summary, trendingTopics }: ReviewAiSummaryProps) {
	return (
		<Card className="rounded-3xl border border-slate-100 bg-gradient-to-br from-white via-slate-50 to-white shadow-[0_28px_80px_-60px_rgba(15,23,42,0.85)]">
			<CardHeader className="flex flex-row items-center gap-3 pb-2">
				<span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
					<Lightbulb className="h-6 w-6" />
				</span>
				<div>
					<CardTitle className="text-xl text-foreground">AI tóm tắt đánh giá</CardTitle>
					<p className="text-sm text-muted-foreground">Tổng hợp cảm nhận của khách trong 12 tháng gần nhất</p>
				</div>
			</CardHeader>
			<CardContent className="space-y-6">
				<p className="text-base text-slate-600 leading-relaxed">{summary}</p>

				<div className="grid gap-4 sm:grid-cols-2">
					{highlights.map((item) => {
						const Icon = sentimentIcon[item.sentiment]
						return (
							<div
								key={`${item.label}-${item.sentiment}`}
								className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white/80 p-4"
							>
								<div className="flex items-center gap-3">
									<span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ${sentimentColor[item.sentiment]}`}>
										<Icon className="h-5 w-5" />
									</span>
									<p className="text-sm font-semibold text-slate-700">{item.label}</p>
								</div>
								<p className="text-sm font-semibold text-slate-900">{item.percentage}%</p>
							</div>
						)
					})}
				</div>

				<div className="space-y-2">
					<h4 className="text-sm font-semibold text-slate-700">Chủ đề nổi bật</h4>
					<div className="flex flex-wrap gap-3 text-sm">
						{trendingTopics.map((topic) => (
							<span key={topic} className="rounded-full bg-primary/10 px-4 py-2 font-medium text-primary">
								{topic}
							</span>
						))}
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
