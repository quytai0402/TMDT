"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircle, CheckCircle2, Gift, Loader2, Sparkles } from "lucide-react"

interface CatalogItem {
  id: string
  name: string
  description?: string | null
  pointsCost: number
  category?: string | null
  image?: string | null
  imageUrl?: string | null
  quantityAvailable?: number | null
  canAfford?: boolean
  isActive?: boolean
  isAvailable?: boolean
  userPoints?: number
  requiredTier?: string | null
  validityDays?: number | null
}

type PreviewItem = CatalogItem & {
  previewImage: string | null
  canRedeem: boolean
}

export function RewardsCatalogPreview() {
  const router = useRouter()
  const { toast } = useToast()
  const [items, setItems] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<PreviewItem | null>(null)
  const [redeeming, setRedeeming] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [userPoints, setUserPoints] = useState(0)

  useEffect(() => {
    void fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/rewards/catalog?limit=6&available=true", { cache: "no-store" })
      if (!res.ok) {
        throw new Error("Không thể tải danh mục quà tặng")
      }
      const payload = await res.json()
      setItems(Array.isArray(payload?.items) ? payload.items : [])
      setUserPoints(typeof payload?.userPoints === "number" ? payload.userPoints : 0)
    } catch (error) {
      console.error("Rewards catalog preview error:", error)
      toast({
        variant: "destructive",
        title: "Không thể tải danh mục",
        description: "Vui lòng thử lại sau.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRedeemClick = (item: PreviewItem) => {
    setSelectedItem(item)
    setDialogOpen(true)
  }

  const handleRedeem = async () => {
    if (!selectedItem) return

    try {
      setRedeeming(true)
      const res = await fetch("/api/rewards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catalogItemId: selectedItem.id, quantity: 1 }),
      })

      const data = await res.json()

      if (!res.ok) {
        const shortfall = typeof data?.shortfall === "number" ? data.shortfall : null
        toast({
          variant: "destructive",
          title: data?.error ?? "Đổi quà không thành công",
          description: shortfall ? `Bạn cần thêm ${shortfall.toLocaleString("vi-VN")} điểm` : undefined,
        })
        return
      }

      toast({
        title: "Đổi quà thành công!",
        description: data?.redemption?.code ? `Mã đổi quà: ${data.redemption.code}` : undefined,
      })

      setDialogOpen(false)
      void fetchItems()
      router.push("/rewards/history")
    } catch (error) {
      console.error("Redeem reward error:", error)
      toast({
        variant: "destructive",
        title: "Không thể đổi quà",
        description: "Vui lòng thử lại sau.",
      })
    } finally {
      setRedeeming(false)
    }
  }

  const derivedItems = useMemo<PreviewItem[]>(() => {
    return items.map((item) => ({
      ...item,
      previewImage: item.imageUrl ?? item.image ?? null,
      canRedeem: item.canAfford !== false && item.isActive !== false && item.isAvailable !== false,
    }))
  }, [items])

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Đổi quà nhanh
          </CardTitle>
          <CardDescription>Chọn quà tặng nổi bật và đổi ngay bằng điểm thưởng.</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push("/rewards/catalog")}>Xem tất cả</Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="animate-pulse rounded-lg border bg-muted/60 p-4">
                <div className="mb-3 h-32 rounded-md bg-muted" />
                <div className="mb-2 h-4 w-2/3 rounded bg-muted" />
                <div className="mb-4 h-3 w-full rounded bg-muted" />
                <div className="h-9 w-full rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : derivedItems.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {derivedItems.map((item) => (
              <div key={item.id} className="flex flex-col justify-between rounded-lg border p-4 shadow-sm">
                <div className="space-y-3">
                  {item.previewImage && (
                    <img
                      src={item.previewImage}
                      alt={item.name}
                      className="h-32 w-full rounded-md object-cover"
                    />
                  )}
                  <div>
                    <h3 className="text-base font-semibold text-foreground line-clamp-1">{item.name}</h3>
                    {item.description && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-primary">
                      {item.pointsCost.toLocaleString("vi-VN")} điểm
                    </span>
                    {item.quantityAvailable !== undefined && item.quantityAvailable !== null && item.quantityAvailable <= 5 && item.quantityAvailable >= 0 ? (
                      <Badge variant="destructive">Sắp hết</Badge>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  {item.requiredTier && (
                    <p className="text-xs text-muted-foreground">Yêu cầu hạng {item.requiredTier}</p>
                  )}
                  <Button
                    onClick={() => handleRedeemClick(item)}
                    disabled={!item.canRedeem || (item.canAfford === false)}
                    className="flex items-center justify-center gap-2"
                  >
                    <Gift className="h-4 w-4" />
                    {item.canAfford === false ? "Chưa đủ điểm" : "Đổi ngay"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Hiện chưa có quà tặng khả dụng. Hãy quay lại sau nhé!
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Xác nhận đổi quà</DialogTitle>
              <DialogDescription>Quà tặng sẽ được giữ trong lịch sử Rewards của bạn sau khi đổi thành công.</DialogDescription>
            </DialogHeader>

            {selectedItem && (
              <div className="space-y-4 py-2">
                <div className="flex items-start gap-4">
                  {selectedItem.previewImage && (
                    <img
                      src={selectedItem.previewImage}
                      alt={selectedItem.name}
                      className="h-24 w-24 rounded-md object-cover"
                    />
                  )}
                  <div className="flex-1 space-y-2">
                    <h3 className="text-lg font-semibold">{selectedItem.name}</h3>
                    {selectedItem.description && (
                      <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
                    )}
                    <p className="text-xl font-bold text-primary">
                      {selectedItem.pointsCost.toLocaleString("vi-VN")} điểm
                    </p>
                  </div>
                </div>

                <div className="rounded-md bg-muted/40 p-4 text-sm">
                  <div className="flex justify-between">
                    <span>Điểm hiện tại</span>
                    <span className="font-medium">{userPoints.toLocaleString("vi-VN")} điểm</span>
                  </div>
                  <div className="flex justify-between text-destructive">
                    <span>Chi phí</span>
                    <span className="font-medium">-{selectedItem.pointsCost.toLocaleString("vi-VN")} điểm</span>
                  </div>
                  <div className="mt-2 h-px bg-border" />
                  <div className="mt-2 flex justify-between font-semibold">
                    <span>Số điểm sau khi đổi</span>
                    <span>{Math.max(0, userPoints - selectedItem.pointsCost).toLocaleString("vi-VN")} điểm</span>
                  </div>
                </div>

                {selectedItem.validityDays && (
                  <div className="flex items-start gap-2 rounded-md bg-blue-50 p-3 text-xs text-blue-900">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <p>Quà tặng có hạn sử dụng {selectedItem.validityDays} ngày kể từ khi đổi.</p>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={redeeming}>
                Huỷ
              </Button>
              <Button onClick={handleRedeem} disabled={redeeming}>
                {redeeming ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Xác nhận đổi quà
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
