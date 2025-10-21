'use client'

import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useWishlist } from '@/hooks/use-wishlist'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface WishlistButtonProps {
  listingId: string
  className?: string
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function WishlistButton({ listingId, className, size = 'icon' }: WishlistButtonProps) {
  const { data: session } = useSession()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const [inWishlist, setInWishlist] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (session?.user) {
      checkWishlistStatus()
    }
  }, [session, listingId])

  const checkWishlistStatus = async () => {
    const status = await isInWishlist(listingId)
    setInWishlist(status)
  }

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!session?.user) {
      router.push('/login')
      return
    }

    setLoading(true)
    try {
      if (inWishlist) {
        await removeFromWishlist(listingId)
        setInWishlist(false)
        toast({
          title: 'Đã xóa khỏi yêu thích',
          description: 'Căn hộ đã được xóa khỏi danh sách yêu thích của bạn',
        })
      } else {
        await addToWishlist(listingId)
        setInWishlist(true)
        toast({
          title: 'Đã thêm vào yêu thích',
          description: 'Căn hộ đã được thêm vào danh sách yêu thích của bạn',
        })
      }
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Có lỗi xảy ra',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleToggle}
      disabled={loading}
      className={cn(
        'hover:scale-110 transition-transform',
        className
      )}
    >
      <Heart
        className={cn(
          'h-5 w-5 transition-colors',
          inWishlist ? 'fill-red-500 text-red-500' : 'text-gray-600'
        )}
      />
    </Button>
  )
}
