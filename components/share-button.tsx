'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Share2, Facebook, Twitter, Link2, MessageCircle, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

interface ShareButtonProps {
  listingId: string
  title: string
  url?: string
}

export function ShareButton({ listingId, title, url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)
  const shareUrl = url || (typeof window !== 'undefined' ? `${window.location.origin}/listing/${listingId}` : '')

  const trackShare = async (platform: string) => {
    try {
      // Track quest progress for sharing
      import('@/lib/quests').then(({ trackListingShareQuest }) => {
        trackListingShareQuest(listingId, platform).catch(err => {
          console.error('Failed to track share quest:', err)
        })
      })

      // Note: Award points for sharing can be added later via reward actions
      toast.success('🎉 Cảm ơn bạn đã chia sẻ!')
    } catch (error) {
      console.error('Error tracking share:', error)
    }
  }

  const handleShare = async (platform: string) => {
    const encodedUrl = encodeURIComponent(shareUrl)
    const encodedTitle = encodeURIComponent(title)

    let shareLink = ''

    switch (platform) {
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
        break
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`
        break
      case 'whatsapp':
        shareLink = `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`
        break
      case 'telegram':
        shareLink = `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`
        break
      case 'copy':
        try {
          await navigator.clipboard.writeText(shareUrl)
          setCopied(true)
          toast.success('Đã copy link vào clipboard!')
          setTimeout(() => setCopied(false), 2000)
          trackShare('clipboard')
          return
        } catch (err) {
          toast.error('Không thể copy link')
          return
        }
    }

    if (shareLink) {
      window.open(shareLink, '_blank', 'width=600,height=400')
      trackShare(platform)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Chia sẻ
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => handleShare('facebook')}>
          <Facebook className="h-4 w-4 mr-2" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('twitter')}>
          <Twitter className="h-4 w-4 mr-2" />
          Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('whatsapp')}>
          <MessageCircle className="h-4 w-4 mr-2" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('telegram')}>
          <MessageCircle className="h-4 w-4 mr-2" />
          Telegram
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('copy')}>
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2 text-green-500" />
              Đã copy!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Copy link
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
