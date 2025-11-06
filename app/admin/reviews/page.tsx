'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '@/components/admin-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Star, Flag, Eye, Trash2, Loader2, CheckCircle2, Filter } from 'lucide-react'

interface Review {
  id: string
  reviewer: { id: string; name: string | null; email: string; image: string | null }
  listing: { id: string; title: string; hostId: string }
  host?: { id: string; name: string | null; email: string }
  overallRating: number
  comment: string | null
  createdAt: string
  flagged?: boolean
  hostResponse?: string | null
}

interface ReviewStats {
  total: number
  pending: number
  flagged: number
  averageRating: number
}

interface FilterOptions {
  hosts: Array<{ id: string; name: string | null; email: string }>
  listings: Array<{ id: string; title: string; hostId: string }>
}

const DEFAULT_STATS: ReviewStats = {
  total: 0,
  pending: 0,
  flagged: 0,
  averageRating: 0,
}

export default function AdminReviewsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [hostFilter, setHostFilter] = useState('all')
  const [listingFilter, setListingFilter] = useState('all')
  const [ratingFilter, setRatingFilter] = useState('all')
  const [stats, setStats] = useState<ReviewStats>(DEFAULT_STATS)
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ hosts: [], listings: [] })
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter !== 'all') params.append('filter', filter)
      if (hostFilter !== 'all') params.append('hostId', hostFilter)
      if (listingFilter !== 'all') params.append('listingId', listingFilter)
      if (ratingFilter !== 'all') params.append('rating', ratingFilter)
      if (searchQuery) params.append('search', searchQuery)
      
      const res = await fetch(`/api/admin/reviews?${params}`)
      const data = await res.json()
      setReviews(data.reviews || [])
      setStats(data.stats || DEFAULT_STATS)
      setFilterOptions(data.filterOptions || { hosts: [], listings: [] })
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
    } finally {
      setLoading(false)
    }
  }, [filter, hostFilter, listingFilter, ratingFilter, searchQuery])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const handleStatusChange = useCallback(
    async (reviewId: string, status: 'APPROVED' | 'PENDING' | 'FLAGGED') => {
      try {
        setProcessingId(reviewId)
        const res = await fetch('/api/admin/reviews', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reviewId, status }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Không thể cập nhật đánh giá')
        }

        await fetchReviews()
      } catch (error) {
        console.error('Failed to update review status:', error)
      } finally {
        setProcessingId(null)
      }
    },
    [fetchReviews],
  )

  const handleDelete = useCallback(
    async (reviewId: string) => {
      try {
        setDeletingId(reviewId)
        const res = await fetch('/api/admin/reviews', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reviewId }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Không thể xóa đánh giá')
        }

        setReviews((prev) => prev.filter((review) => review.id !== reviewId))
        await fetchReviews()
      } catch (error) {
        console.error('Failed to delete review:', error)
      } finally {
        setDeletingId(null)
      }
    },
    [fetchReviews],
  )

  const filteredReviews = useMemo(() => reviews, [reviews])

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Quản lý đánh giá</h1>
          <p className="text-muted-foreground mt-2">
            Kiểm duyệt và quản lý đánh giá từ khách hàng
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Tổng đánh giá</div>
              <div className="text-2xl font-bold mt-2">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">Tất cả đánh giá</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Đang chờ duyệt</div>
              <div className="text-2xl font-bold mt-2 text-orange-600">{stats.pending}</div>
              <p className="text-xs text-muted-foreground mt-1">Cần xem xét</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Bị báo cáo</div>
              <div className="text-2xl font-bold mt-2 text-red-600">{stats.flagged}</div>
              <p className="text-xs text-muted-foreground mt-1">Cần xử lý</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Đánh giá TB</div>
              <div className="text-2xl font-bold mt-2 flex items-center gap-1">
                {stats.averageRating.toFixed(1)} <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              </div>
              <p className="text-xs text-green-600 mt-1">Điểm trung bình</p>
            </CardContent>
          </Card>
        </div>

        {/* Reviews Table */}
        <Card>
          <CardContent className="pt-6">
            <div className="mb-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm đánh giá..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={hostFilter} onValueChange={setHostFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Lọc theo host" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả hosts</SelectItem>
                    {filterOptions.hosts.map((host) => (
                      <SelectItem key={host.id} value={host.id}>
                        {host.name || host.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={listingFilter} onValueChange={setListingFilter}>
                  <SelectTrigger className="w-full sm:w-[250px]">
                    <SelectValue placeholder="Lọc theo listing" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả listings</SelectItem>
                    {filterOptions.listings.map((listing) => (
                      <SelectItem key={listing.id} value={listing.id}>
                        {listing.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={ratingFilter} onValueChange={setRatingFilter}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Lọc đánh giá" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả đánh giá</SelectItem>
                    <SelectItem value="5">5 sao</SelectItem>
                    <SelectItem value="4">4 sao</SelectItem>
                    <SelectItem value="3">3 sao</SelectItem>
                    <SelectItem value="2">2 sao</SelectItem>
                    <SelectItem value="1">1 sao</SelectItem>
                  </SelectContent>
                </Select>

                {(hostFilter !== 'all' || listingFilter !== 'all' || ratingFilter !== 'all') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setHostFilter('all')
                      setListingFilter('all')
                      setRatingFilter('all')
                    }}
                  >
                    Xóa bộ lọc
                  </Button>
                )}
              </div>
            </div>

            <Tabs defaultValue="all" onValueChange={setFilter}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">Tất cả</TabsTrigger>
                <TabsTrigger value="pending">
                  Chờ duyệt ({stats.pending})
                </TabsTrigger>
                <TabsTrigger value="approved">Đã duyệt</TabsTrigger>
                <TabsTrigger value="flagged">
                  <Flag className="h-4 w-4 mr-1" />
                  Bị báo cáo ({stats.flagged})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={filter} className="space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredReviews.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Không có đánh giá nào
                  </div>
                ) : (
                  filteredReviews.map((review) => (
                    <div key={review.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-gradient-to-br from-primary to-pink-500 text-white">
                              {review.reviewer.name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{review.reviewer.name || 'Anonymous'}</p>
                            <p className="text-sm text-muted-foreground">{review.listing.title}</p>
                            {review.host && (
                              <p className="text-xs text-muted-foreground">
                                Host: {review.host.name || review.host.email}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.overallRating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          {review.flagged && (
                            <Badge variant="destructive">
                              <Flag className="h-3 w-3 mr-1" />
                              Báo cáo
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm mb-2">{review.comment || 'Không có nhận xét'}</p>
                      {review.hostResponse && (
                        <div className="pl-3 border-l-2 border-primary/30 mb-2">
                          <p className="text-xs font-medium text-primary">Phản hồi của host:</p>
                          <p className="text-sm text-muted-foreground">{review.hostResponse}</p>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => router.push(`/listing/${review.listing.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Xem chi tiết
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={processingId === review.id}
                            onClick={() =>
                              handleStatusChange(
                                review.id,
                                review.flagged ? 'APPROVED' : 'FLAGGED',
                              )
                            }
                          >
                            <Flag className="h-4 w-4 mr-1" />
                            {review.flagged ? 'Bỏ báo cáo' : 'Báo cáo'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={processingId === review.id}
                            onClick={() => handleStatusChange(review.id, 'APPROVED')}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Duyệt
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600"
                            disabled={deletingId === review.id}
                            onClick={() => handleDelete(review.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Xóa
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
