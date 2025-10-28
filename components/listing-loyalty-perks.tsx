"use client"

import Link from "next/link"
import { Gift, Trophy, Users } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RewardsOverview } from "@/components/rewards-overview"

interface ListingLoyaltyPerksProps {
  hostName: string
  isSuperHost?: boolean
  listingId: string
}

const defaultPerks = [
  "Tặng thêm 200 điểm khi đặt liên tiếp 2 đêm.",
  "Nhiệm vụ \"Check-in hoàn hảo\" nhận voucher trải nghiệm địa phương.",
  "Host dành riêng ưu đãi nâng hạng phòng khi quay lại.",
]

export function ListingLoyaltyPerks({ hostName, isSuperHost, listingId }: ListingLoyaltyPerksProps) {
  return (
    <Card className="rounded-3xl border border-primary/20 bg-white/90 shadow-[0_24px_80px_-60px_rgba(34,197,94,0.55)]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg text-primary">
          <Trophy className="h-5 w-5" />
          Đặc quyền thành viên
        </CardTitle>
        <div className="text-xs text-muted-foreground">
          {isSuperHost ? `${hostName} là SuperHost – ưu tiên quyền lợi cho khách trung thành.` : `Đặt lại lần tới để unlock thêm quyền lợi với ${hostName}.`}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <RewardsOverview compact />

        <div className="space-y-3">
          {defaultPerks.map((perk) => (
            <div key={perk} className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary-700">
              <Gift className="mt-0.5 h-4 w-4" />
              <span>{perk}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-dashed border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary-700">
          <div>
            <p className="font-semibold">Hoàn thành nhiệm vụ để nhận ưu đãi</p>
            <p className="text-xs text-primary-600">Ví dụ: đăng review chi tiết, sắp xếp lịch concierge, chia sẻ chuyến đi với bạn bè.</p>
          </div>
          <Badge variant="outline" className="border-primary/40 bg-white text-primary">
            <Users className="mr-1 h-3 w-3" /> Quest mới
          </Badge>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" asChild>
            <Link href={`/rewards?from=${listingId}`}>Xem bảng xếp hạng</Link>
          </Button>
          <Button className="flex-1" asChild>
            <Link href="/quests">Mở nhiệm vụ</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
