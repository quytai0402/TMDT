"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import {
  AlertTriangle,
  Check,
  Clock,
  Eye,
  Home,
  Loader2,
  MapPin,
  TrendingUp,
  X,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type AdminListing = {
  id: string
  title: string
  address?: string | null
  basePrice?: number | null
  status?: string | null
  propertyType?: string | null
  images?: string[] | null
  host?: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
  } | null
  bookingsCount?: number
  reviewsCount?: number
  createdAt?: string | null
  updatedAt?: string | null
}

type StatusKey = "all" | "PENDING" | "ACTIVE" | "REJECTED" | "INACTIVE"

const STATUS_OPTIONS: Array<{ label: string; value: StatusKey }> = [
  { label: "Tất cả", value: "all" },
  { label: "Chờ duyệt", value: "PENDING" },
  { label: "Đang hoạt động", value: "ACTIVE" },
  { label: "Bị từ chối", value: "REJECTED" },
  { label: "Tạm dừng", value: "INACTIVE" },
]

const SUMMARY_TARGETS: Array<{ label: string; value: StatusKey; icon: React.ComponentType<{ className?: string }> }> = [
  { label: "Chờ duyệt", value: "PENDING", icon: Clock },
  { label: "Đang hoạt động", value: "ACTIVE", icon: Check },
  { label: "Bị từ chối", value: "REJECTED", icon: X },
  { label: "Tổng hoạt động", value: "ACTIVE", icon: Home },
]

const statusBadge = (status?: string | null) => {
  switch (status) {
    case "PENDING_REVIEW":
    case "PENDING":
      return { className: "bg-yellow-100 text-yellow-700", label: "Chờ duyệt" }
    case "ACTIVE":
      return { className: "bg-green-100 text-green-700", label: "Đang hoạt động" }
    case "INACTIVE":
      return { className: "bg-red-100 text-red-700", label: "Bị từ chối" }
    case "REJECTED":
      return { className: "bg-red-100 text-red-700", label: "Bị từ chối" }
    case "BLOCKED":
      return { className: "bg-orange-100 text-orange-700", label: "Đang bị khóa" }
    default:
      return { className: "bg-blue-100 text-blue-700", label: status ?? "Không xác định" }
  }
}

const formatCurrency = (value?: number | null) => {
  if (!value) return "0₫"
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value)
}

const formatRelativeTime = (value?: string | null) => {
  if (!value) return "—"
  const created = new Date(value)
  if (Number.isNaN(created.getTime())) return "—"

  const now = Date.now()
  const diff = now - created.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return "Vừa xong"
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.floor(hours / 24)
  return `${days} ngày trước`
}

export function ListingModeration() {
  const [statusFilter, setStatusFilter] = useState<StatusKey>("PENDING")
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [listings, setListings] = useState<AdminListing[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<Record<StatusKey, number>>({
    all: 0,
    PENDING: 0,
    ACTIVE: 0,
    REJECTED: 0,
    INACTIVE: 0,
  })

  const [selectedListing, setSelectedListing] = useState<AdminListing | null>(null)
  const [action, setAction] = useState<"approve" | "reject" | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 400)
    return () => clearTimeout(handler)
  }, [searchQuery])

  const fetchListings = useCallback(
    async (status: StatusKey, keyword: string) => {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams({
          limit: "20",
          page: "1",
        })

        if (status !== "all") {
          params.set("status", status)
        }

        if (keyword) {
          params.set("search", keyword)
        }

        const response = await fetch(`/api/admin/listings?${params.toString()}`, {
          cache: "no-store",
        })

        if (!response.ok) {
          throw new Error("Không thể tải danh sách listing")
        }

        const data = await response.json()
        setListings(Array.isArray(data?.listings) ? data.listings : [])

        if (status === "all" && typeof data?.pagination?.totalCount === "number") {
          setSummary((prev) => ({ ...prev, all: data.pagination.totalCount }))
        }
      } catch (err) {
        console.error("Failed to fetch listings:", err)
        setError("Không thể tải danh sách listing. Vui lòng thử lại.")
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const fetchSummary = useCallback(async () => {
    try {
      const requests = SUMMARY_TARGETS.map(async (item) => {
        const params = new URLSearchParams({
          limit: "1",
          page: "1",
        })
        if (item.value !== "all") {
          params.set("status", item.value)
        }

        const response = await fetch(`/api/admin/listings?${params.toString()}`, {
          cache: "no-store",
        })

        if (!response.ok) {
          throw new Error("failed")
        }

        const data = await response.json()
        return {
          status: item.value,
          total: Number(data?.pagination?.totalCount) || 0,
        }
      })

      const results = await Promise.allSettled(requests)

      setSummary((prev) => {
        const next = { ...prev }
        results.forEach((result) => {
          if (result.status === "fulfilled") {
            next[result.value.status] = result.value.total
          }
        })
        return next
      })
    } catch (err) {
      console.error("Failed to fetch listing summary:", err)
    }
  }, [])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  useEffect(() => {
    fetchListings(statusFilter, debouncedSearch)
  }, [statusFilter, debouncedSearch, fetchListings])

  const refreshData = useCallback(async () => {
    await Promise.all([fetchListings(statusFilter, debouncedSearch), fetchSummary()])
  }, [fetchListings, fetchSummary, statusFilter, debouncedSearch])

  const handleUpdateStatus = async (listingId: string, nextStatus: "ACTIVE" | "REJECTED") => {
    try {
      const response = await fetch("/api/admin/listings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, status: nextStatus }),
      })

      if (!response.ok) {
        throw new Error("Không thể cập nhật trạng thái listing")
      }

      const payload = await response.json()
      const updatedStatus =
        payload?.listing?.status ?? (nextStatus === "REJECTED" ? "INACTIVE" : nextStatus)

      setListings((prev) =>
        prev.map((listing) =>
          listing.id === listingId ? { ...listing, status: updatedStatus } : listing,
        ),
      )

      await fetchSummary()
    } catch (err) {
      console.error("Failed to update listing status:", err)
      setError("Không thể cập nhật trạng thái listing. Vui lòng thử lại.")
    } finally {
      setAction(null)
      setSelectedListing(null)
      setRejectReason("")
    }
  }

  const filteredSummary = useMemo(() => {
    return SUMMARY_TARGETS.map((item) => ({
      ...item,
      total: summary[item.value] ?? 0,
    }))
  }, [summary])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Duyệt listing</CardTitle>
        <CardDescription>Kiểm duyệt listing mới và quản lý trạng thái hoạt động</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {filteredSummary.map(({ label, value, icon: Icon, total }) => (
            <Card key={`${value}-${label}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{total.toLocaleString("vi-VN")}</div>
                <p className="text-xs text-muted-foreground">Tổng số listing</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Select value={statusFilter} onValueChange={(value: StatusKey) => setStatusFilter(value)}>
            <SelectTrigger className="w-full md:w-60">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Tìm theo tên listing, host, địa chỉ..."
            className="md:max-w-md"
          />
        </div>

        {error ? (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-6 text-sm text-destructive">
            {error}
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12 text-center text-muted-foreground">
            <AlertTriangle className="h-8 w-8" />
            <p>Không có listing nào phù hợp với bộ lọc hiện tại.</p>
            <Button variant="outline" size="sm" onClick={refreshData}>
              Tải lại dữ liệu
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map((listing) => {
              const badge = statusBadge(listing.status)

              return (
                <div
                  key={listing.id}
                  className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-center md:gap-6"
                >
                  <div className="relative h-32 w-full md:h-32 md:w-48 overflow-hidden rounded-lg bg-muted">
                    <Image
                      src={listing.images?.[0] || "/placeholder.svg"}
                      alt={listing.title}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">{listing.title}</h3>
                      <Badge className={badge.className}>{badge.label}</Badge>
                      {listing.propertyType && (
                        <Badge variant="outline">{listing.propertyType}</Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {listing.address || "Địa chỉ đang cập nhật"}
                      </span>
                      {listing.host?.name && (
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          Host: {listing.host.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        {listing.bookingsCount ?? 0} lượt đặt · {listing.reviewsCount ?? 0} đánh giá
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span>Giá cơ bản: {formatCurrency(listing.basePrice)}</span>
                      <span>Gửi lên: {formatRelativeTime(listing.createdAt)}</span>
                      {listing.updatedAt && <span>Cập nhật: {formatRelativeTime(listing.updatedAt)}</span>}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(`/listing/${listing.id}`, "_blank", "noopener,noreferrer")
                      }
                    >
                      Xem chi tiết
                    </Button>
                    {listing.status === "PENDING" ? (
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedListing(listing)
                            setAction("reject")
                          }}
                        >
                          Từ chối
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedListing(listing)
                            setAction("approve")
                          }}
                        >
                          Phê duyệt
                        </Button>
                      </div>
                    ) : listing.status === "ACTIVE" ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedListing(listing)
                          setAction("reject")
                        }}
                      >
                        Chuyển sang tạm dừng
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedListing(listing)
                          setAction("approve")
                        }}
                      >
                        Mở lại
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <Button variant="outline" size="sm" onClick={refreshData}>
          Tải lại
        </Button>
      </CardContent>

      {action && selectedListing && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) {
              setAction(null)
              setSelectedListing(null)
              setRejectReason("")
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {action === "approve" ? "Phê duyệt listing" : "Từ chối listing"}
              </DialogTitle>
              <DialogDescription>
                {action === "approve"
                  ? "Listing sẽ được chuyển sang trạng thái hoạt động và hiển thị cho khách hàng."
                  : "Vui lòng nhập lý do để thông báo cho host."}
              </DialogDescription>
            </DialogHeader>

            {action === "reject" && (
              <div className="space-y-3 py-2">
                <Input
                  placeholder="Lý do từ chối (sẽ gửi cho host)..."
                  value={rejectReason}
                  onChange={(event) => setRejectReason(event.target.value)}
                />
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setAction(null)
                  setSelectedListing(null)
                  setRejectReason("")
                }}
              >
                Hủy
              </Button>
              <Button
                variant={action === "reject" ? "destructive" : "default"}
                onClick={() =>
                  handleUpdateStatus(
                    selectedListing.id,
                    action === "approve" ? "ACTIVE" : "REJECTED",
                  )
                }
              >
                {action === "approve" ? "Phê duyệt" : "Xác nhận từ chối"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  )
}
