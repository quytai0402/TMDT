"use client"

import { useCallback, useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Gift, Search, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useAuthModal } from "@/hooks/use-auth-modal"

interface CatalogItem {
  id: string
  name: string
  description: string
  pointsCost: number
  category: string
  imageUrl?: string
  image?: string
  stock?: number | null
  isAvailable: boolean
  canAfford: boolean
  userPoints: number
  requiredTier?: string | null
  validityDays?: number | null
}

export default function RewardsCatalogPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const authModal = useAuthModal()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<CatalogItem[]>([])
  const [filteredItems, setFilteredItems] = useState<CatalogItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sortBy, setSortBy] = useState("points-asc")
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null)
  const [redeemDialogOpen, setRedeemDialogOpen] = useState(false)
  const [redeeming, setRedeeming] = useState(false)
  const [userPoints, setUserPoints] = useState(0)

  const isAuthenticated = status === "authenticated"

  useEffect(() => {
    if (status === "loading") return
    fetchCatalogItems()
  }, [status])

  useEffect(() => {
    // Auto-open redemption dialog if item ID in URL (only once authenticated)
    const itemId = searchParams.get("item")
    if (!itemId || items.length === 0 || !isAuthenticated) return
    const item = items.find((i) => i.id === itemId)
    if (item) {
      setSelectedItem(item)
      setRedeemDialogOpen(true)
    }
  }, [searchParams, items, isAuthenticated])

  const filterAndSortItems = useCallback(() => {
    let filtered = [...items]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(item => item.category === categoryFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "points-asc":
          return a.pointsCost - b.pointsCost
        case "points-desc":
          return b.pointsCost - a.pointsCost
        case "name":
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

    setFilteredItems(filtered)
  }, [items, searchQuery, categoryFilter, sortBy])

  useEffect(() => {
    filterAndSortItems()
  }, [filterAndSortItems])

  const fetchCatalogItems = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/rewards/catalog?limit=100&available=true")
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
        setUserPoints(data.userPoints || 0)
      } else {
        setItems([])
        setUserPoints(0)
      }
    } catch (error) {
      console.error("Error fetching catalog:", error)
      toast.error("Không thể tải danh mục quà tặng")
    } finally {
      setLoading(false)
    }
  }

  const handleRedeemClick = (item: CatalogItem) => {
    if (!isAuthenticated) {
      authModal.openLogin()
      return
    }
    setSelectedItem(item)
    setRedeemDialogOpen(true)
  }

  const handleRedeem = async () => {
    if (!isAuthenticated) {
      authModal.openLogin()
      return
    }

    if (!selectedItem) return

    try {
      setRedeeming(true)
      const res = await fetch("/api/rewards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catalogItemId: selectedItem.id,
          quantity: 1
        })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success("Đổi quà thành công!", {
          description: `Mã đổi quà: ${data.redemption.code}`
        })
        setRedeemDialogOpen(false)
        fetchCatalogItems() // Refresh to update points and availability
        router.push("/rewards/history")
      } else {
        toast.error(data.error || "Không thể đổi quà", {
          description: data.shortfall 
            ? `Bạn cần thêm ${data.shortfall} điểm`
            : undefined
        })
      }
    } catch (error) {
      console.error("Error redeeming reward:", error)
      toast.error("Không thể đổi quà")
    } finally {
      setRedeeming(false)
    }
  }

  const categories = Array.from(new Set(items.map(item => item.category)))

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">Danh mục quà tặng</h1>
                <p className="text-muted-foreground">
                  Đổi điểm để nhận những ưu đãi dành riêng cho bạn
                </p>
              </div>
              <div className="text-right">
                {isAuthenticated ? (
                  <>
                    <p className="text-sm text-muted-foreground">Điểm hiện có</p>
                    <p className="text-3xl font-bold text-primary">
                      {userPoints.toLocaleString()} điểm
                    </p>
                  </>
                ) : (
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-sm text-muted-foreground">Đăng nhập để xem điểm</p>
                    <Button size="sm" onClick={() => authModal.openLogin()}>
                      Đăng nhập
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid gap-4 md:grid-cols-3">
                {/* Search */}
                <div className="space-y-2">
                  <Label htmlFor="search">Tìm kiếm</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Tìm kiếm quà tặng..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label>Hạng mục</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả hạng mục</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {cat.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort */}
                <div className="space-y-2">
                  <Label>Sắp xếp</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="points-asc">Điểm: Thấp → Cao</SelectItem>
                      <SelectItem value="points-desc">Điểm: Cao → Thấp</SelectItem>
                      <SelectItem value="name">Tên A → Z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {(() => {
                  const imageSrc = item.imageUrl ?? item.image
                  if (!imageSrc) return null
                  return (
                  <div className="aspect-video bg-muted overflow-hidden">
                    <img 
                      src={imageSrc} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  )
                })()}
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    {item.stock !== null && item.stock !== undefined && item.stock < 10 && (
                      <Badge variant="destructive" className="text-xs">
                        Còn {item.stock}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2">
                    {item.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-primary">
                        {item.pointsCost.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">điểm</span>
                    </div>

                    {item.requiredTier && (
                      <div className="text-sm text-muted-foreground">
                        Yêu cầu hạng {item.requiredTier}
                      </div>
                    )}

                    {item.validityDays && (
                      <div className="text-sm text-muted-foreground">
                        Có hạn sử dụng {item.validityDays} ngày
                      </div>
                    )}

                    <Button 
                      className="w-full"
                      disabled={isAuthenticated ? (!item.canAfford || !item.isAvailable) : false}
                      onClick={() => handleRedeemClick(item)}
                    >
                      {!item.isAvailable 
                        ? "Hết hàng"
                        : !isAuthenticated
                        ? "Đăng nhập để nhận"
                        : !item.canAfford 
                        ? `Cần thêm ${(item.pointsCost - userPoints).toLocaleString()} điểm`
                        : "Đổi ngay"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Không tìm thấy quà tặng phù hợp</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />

      {/* Redemption Dialog */}
      <Dialog open={redeemDialogOpen} onOpenChange={setRedeemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận đổi quà</DialogTitle>
            <DialogDescription>
              Bạn chắc chắn muốn đổi quà này chứ?
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4 py-4">
              <div className="flex items-start gap-4">
                {(() => {
                  const imageSrc = selectedItem.imageUrl ?? selectedItem.image
                  if (!imageSrc) return null
                  return (
                    <img 
                      src={imageSrc}
                      alt={selectedItem.name}
                      className="w-24 h-24 object-cover rounded"
                    />
                  )
                })()}
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{selectedItem.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {selectedItem.description}
                  </p>
                  <div className="text-2xl font-bold text-primary">
                    {selectedItem.pointsCost.toLocaleString()} điểm
                  </div>
                </div>
              </div>

              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Điểm hiện tại:</span>
                  <span className="font-semibold">
                    {userPoints.toLocaleString()} điểm
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Chi phí:</span>
                  <span className="font-semibold text-destructive">
                    -{selectedItem.pointsCost.toLocaleString()} điểm
                  </span>
                </div>
                <div className="h-px bg-border my-2" />
                <div className="flex justify-between text-sm font-bold">
                  <span>Số điểm sau đổi:</span>
                  <span>
                    {(userPoints - selectedItem.pointsCost).toLocaleString()} điểm
                  </span>
                </div>
              </div>

              {selectedItem.validityDays && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 text-blue-900 rounded text-sm">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p>Quà tặng có hiệu lực trong {selectedItem.validityDays} ngày kể từ khi đổi.</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setRedeemDialogOpen(false)}
              disabled={redeeming}
            >
              Huỷ
            </Button>
            <Button 
              onClick={handleRedeem}
              disabled={redeeming}
            >
              {redeeming ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang đổi...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Xác nhận đổi quà
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
