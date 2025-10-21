"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Check, X, Eye, AlertCircle, Home } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Listing {
  id: string
  title: string
  host: string
  location: string
  price: number
  status: "pending" | "approved" | "rejected"
  submittedDate: Date
  category: string
  images: number
  issues?: string[]
  thumbnail: string
}

const mockListings: Listing[] = [
  {
    id: "1",
    title: "Villa sang trọng view biển Nha Trang",
    host: "Nguyễn Văn A",
    location: "Nha Trang, Khánh Hòa",
    price: 3500000,
    status: "pending",
    submittedDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
    category: "Villa",
    images: 25,
    issues: [],
    thumbnail: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=400"
  },
  {
    id: "2",
    title: "Căn hộ studio trung tâm Đà Lạt",
    host: "Trần Thị B",
    location: "Đà Lạt, Lâm Đồng",
    price: 800000,
    status: "pending",
    submittedDate: new Date(Date.now() - 5 * 60 * 60 * 1000),
    category: "Apartment",
    images: 12,
    issues: ["Ảnh chất lượng thấp", "Thiếu thông tin WiFi"],
    thumbnail: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400"
  },
  {
    id: "3",
    title: "Homestay gia đình ấm cúng Hội An",
    host: "Lê Văn C",
    location: "Hội An, Quảng Nam",
    price: 1200000,
    status: "approved",
    submittedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    category: "Homestay",
    images: 18,
    thumbnail: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400"
  },
  {
    id: "4",
    title: "Biệt thự nghỉ dưỡng Ba Vì",
    host: "Phạm Thị D",
    location: "Ba Vì, Hà Nội",
    price: 5000000,
    status: "rejected",
    submittedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    category: "Villa",
    images: 8,
    issues: ["Không đủ 10 ảnh", "Địa chỉ không rõ ràng", "Thiếu giấy phép"],
    thumbnail: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400"
  }
]

export function ListingModeration() {
  const [listings, setListings] = useState<Listing[]>(mockListings)
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  const [actionDialog, setActionDialog] = useState<"approve" | "reject" | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("pending")

  const filteredListings = listings.filter(l => 
    statusFilter === "all" || l.status === statusFilter
  )

  const handleApproveListing = (listingId: string) => {
    setListings(listings.map(l => 
      l.id === listingId ? { ...l, status: "approved" as const } : l
    ))
    setActionDialog(null)
    setSelectedListing(null)
  }

  const handleRejectListing = (listingId: string) => {
    setListings(listings.map(l => 
      l.id === listingId ? { ...l, status: "rejected" as const } : l
    ))
    setActionDialog(null)
    setSelectedListing(null)
    setRejectReason("")
  }

  const getStatusColor = (status: Listing["status"]) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-700"
      case "approved": return "bg-green-100 text-green-700"
      case "rejected": return "bg-red-100 text-red-700"
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount)
  }

  const formatDate = (date: Date) => {
    const now = Date.now()
    const diff = now - new Date(date).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    
    if (hours < 1) return "Vừa xong"
    if (hours < 24) return `${hours} giờ trước`
    const days = Math.floor(hours / 24)
    return `${days} ngày trước`
  }

  const pendingCount = listings.filter(l => l.status === "pending").length

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              Đang chờ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Cần duyệt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              Đã duyệt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">Tháng này</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <X className="h-4 w-4 text-red-600" />
              Từ chối
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87</div>
            <p className="text-xs text-muted-foreground">Tháng này</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Home className="h-4 w-4 text-blue-600" />
              Tổng active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12,847</div>
            <p className="text-xs text-muted-foreground">Listings</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="pending">Đang chờ</SelectItem>
            <SelectItem value="approved">Đã duyệt</SelectItem>
            <SelectItem value="rejected">Từ chối</SelectItem>
          </SelectContent>
        </Select>

        {pendingCount > 0 && (
          <Badge className="bg-yellow-600">
            {pendingCount} listing cần xử lý
          </Badge>
        )}
      </div>

      {/* Listings Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredListings.map((listing) => (
          <Card key={listing.id} className="hover:shadow-lg transition-shadow">
            <div className="aspect-video relative overflow-hidden rounded-t-lg">
              <img
                src={listing.thumbnail}
                alt={listing.title}
                className="object-cover w-full h-full"
              />
              <Badge className={`absolute top-2 left-2 ${getStatusColor(listing.status)}`}>
                {listing.status === "pending" && "Đang chờ"}
                {listing.status === "approved" && "Đã duyệt"}
                {listing.status === "rejected" && "Từ chối"}
              </Badge>
              <Badge className="absolute top-2 right-2 bg-black/50 text-white">
                {listing.images} ảnh
              </Badge>
            </div>

            <CardHeader>
              <CardTitle className="text-base line-clamp-2">{listing.title}</CardTitle>
              <CardDescription>
                <div className="space-y-1">
                  <p className="text-xs">Host: {listing.host}</p>
                  <p className="text-xs">{listing.location}</p>
                  <p className="font-semibold text-foreground">{formatCurrency(listing.price)}/đêm</p>
                </div>
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                {listing.issues && listing.issues.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-orange-600">
                      <AlertCircle className="h-3 w-3" />
                      Vấn đề cần xử lý:
                    </div>
                    <ul className="space-y-1">
                      {listing.issues.map((issue, idx) => (
                        <li key={idx} className="text-xs text-red-600 flex items-start gap-1">
                          <span>•</span>
                          <span>{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 inline mr-1" />
                  Gửi {formatDate(listing.submittedDate)}
                </div>

                {listing.status === "pending" && (
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedListing(listing)
                        setActionDialog("reject")
                      }}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Từ chối
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => {
                        setSelectedListing(listing)
                        setActionDialog("approve")
                      }}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Duyệt
                    </Button>
                  </div>
                )}

                {listing.status !== "pending" && (
                  <Button size="sm" variant="outline" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    Xem chi tiết
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredListings.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Home className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Không có listing</h3>
            <p className="text-muted-foreground">
              Không có listing nào với bộ lọc hiện tại
            </p>
          </CardContent>
        </Card>
      )}

      {/* Approve Dialog */}
      {actionDialog === "approve" && selectedListing && (
        <Dialog open={true} onOpenChange={() => setActionDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Duyệt listing</DialogTitle>
              <DialogDescription>
                Bạn có chắc muốn duyệt listing <strong>{selectedListing.title}</strong>?
                Listing sẽ xuất hiện công khai trên nền tảng.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActionDialog(null)}>
                Hủy
              </Button>
              <Button onClick={() => handleApproveListing(selectedListing.id)}>
                <Check className="h-4 w-4 mr-2" />
                Duyệt listing
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Reject Dialog */}
      {actionDialog === "reject" && selectedListing && (
        <Dialog open={true} onOpenChange={() => setActionDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Từ chối listing</DialogTitle>
              <DialogDescription>
                Vui lòng cho biết lý do từ chối để host có thể chỉnh sửa.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="Lý do từ chối..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActionDialog(null)}>
                Hủy
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => handleRejectListing(selectedListing.id)}
                disabled={!rejectReason.trim()}
              >
                <X className="h-4 w-4 mr-2" />
                Từ chối listing
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
