'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useListings } from '@/hooks/use-listings'
import { MoreVertical, Eye, Edit, Trash2, Star } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export function HostListingsEnhanced() {
  const { getMyListings, deleteListing, loading } = useListings()
  const [listings, setListings] = useState<any[]>([])

  useEffect(() => {
    fetchListings()
  }, [])

  const fetchListings = async () => {
    try {
      const data = await getMyListings()
      setListings(data)
    } catch (err) {
      console.error('Failed to fetch listings:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa nhà/phòng này?')) return

    try {
      await deleteListing(id)
      setListings(listings.filter(l => l.id !== id))
    } catch (err) {
      console.error('Failed to delete listing:', err)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nhà/phòng của tôi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (listings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nhà/phòng của tôi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-4">
            <p className="text-muted-foreground">
              Bạn chưa có nhà/phòng nào
            </p>
            <Button asChild>
              <Link href="/host/listings/new">
                Thêm nhà/phòng đầu tiên
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Nhà/phòng của tôi</CardTitle>
          <Button asChild size="sm">
            <Link href="/host/listings/new">
              Thêm mới
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="flex gap-4 p-4 border rounded-lg hover:border-primary transition-colors"
            >
              <div className="relative w-32 h-24 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={listing.photos?.[0] || '/placeholder.jpg'}
                  alt={listing.title}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <h3 className="font-semibold line-clamp-1">{listing.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {listing.city}, {listing.country}
                    </p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/listing/${listing.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Xem
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/host/listings/${listing.id}/edit`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Chỉnh sửa
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDelete(listing.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Xóa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">
                      {listing.rating?.toFixed(1) || 'Mới'}
                    </span>
                    {listing.reviewCount > 0 && (
                      <span className="text-muted-foreground">
                        ({listing.reviewCount})
                      </span>
                    )}
                  </div>

                  <Badge variant={listing.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {listing.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm dừng'}
                  </Badge>

                  <span className="font-semibold">
                    {listing.pricePerNight.toLocaleString('vi-VN')}₫/đêm
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button asChild variant="outline" className="w-full mt-4">
          <Link href="/host/listings">
            Xem tất cả
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
