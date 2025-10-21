'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Search, MoreVertical, ArrowLeft, Eye, Trash2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface Listing {
  id: string
  title: string
  description: string
  address: string
  basePrice: number
  images: string[]
  status: string
  propertyType: string
  host: {
    id: string
    name: string
    email: string
  }
  bookingsCount: number
  reviewsCount: number
  createdAt: string
}

export default function AdminListingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'ADMIN') {
        router.push('/')
      } else {
        loadListings()
      }
    }
  }, [status, session, statusFilter])

  const loadListings = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') params.append('status', statusFilter)

      const res = await fetch(`/api/admin/listings?${params}`)
      if (res.ok) {
        const data = await res.json()
        setListings(data.listings || [])
      }
    } catch (error) {
      console.error('Error loading listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateListingStatus = async (listingId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/listings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, status: newStatus }),
      })

      if (res.ok) {
        loadListings()
      }
    } catch (error) {
      console.error('Error updating listing:', error)
    }
  }

  const deleteListing = async (listingId: string) => {
    if (!confirm('Bạn có chắc muốn xóa listing này?')) return

    try {
      const res = await fetch(`/api/admin/listings?listingId=${listingId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        loadListings()
      }
    } catch (error) {
      console.error('Error deleting listing:', error)
    }
  }

  const filteredListings = listings.filter(listing =>
    listing.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.host.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-muted/30">
          <div className="container mx-auto px-4 lg:px-8 py-8">
            <Skeleton className="h-12 w-64 mb-6" />
            <Skeleton className="h-96 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => router.push('/admin')} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại Dashboard
            </Button>
            <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
              Quản lý Listings
            </h1>
            <p className="text-muted-foreground">
              Tổng cộng {listings.length} listings
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Tìm theo tiêu đề, địa chỉ, chủ nhà..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <Card key={listing.id} className="overflow-hidden">
                <div className="relative h-48">
                  <img
                    src={listing.images[0] || '/placeholder.svg'}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                  <Badge
                    className="absolute top-2 right-2"
                    variant={listing.status === 'ACTIVE' ? 'default' : 'secondary'}
                  >
                    {listing.status}
                  </Badge>
                </div>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold line-clamp-1">{listing.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        {listing.address}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Chủ nhà:</span>
                      <span className="font-medium">{listing.host.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Giá:</span>
                      <span className="font-medium">{formatCurrency(listing.basePrice)}/đêm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bookings:</span>
                      <span className="font-medium">{listing.bookingsCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reviews:</span>
                      <span className="font-medium">{listing.reviewsCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ngày tạo:</span>
                      <span className="font-medium">{formatDate(listing.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => router.push(`/listing/${listing.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Xem
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => updateListingStatus(listing.id, 'ACTIVE')}>
                          ✅ Duyệt (Active)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateListingStatus(listing.id, 'INACTIVE')}>
                          ⏸️ Tạm ngưng (Inactive)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateListingStatus(listing.id, 'DRAFT')}>
                          📝 Nháp (Draft)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteListing(listing.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Xóa listing
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredListings.length === 0 && (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">
                Không tìm thấy listing nào
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
