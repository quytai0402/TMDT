'use client'

import { ReactNode } from 'react'
import AuthProvider from './auth-provider'
import { WishlistProvider } from './wishlist-provider'
import { Toaster } from './ui/toaster'
import AuthModalWrapper from './auth-modal-wrapper'
import { ConciergeContextProvider } from './concierge-context-provider'
import dynamic from 'next/dynamic'

const LiveChatWidget = dynamic(
  () => import('./live-chat-widget').then((mod) => ({ default: mod.LiveChatWidget })),
  { ssr: false }
)

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <WishlistProvider>
        <ConciergeContextProvider>
          {children}
          <AuthModalWrapper />
          <Toaster />
          <LiveChatWidget />
        </ConciergeContextProvider>
      </WishlistProvider>
    </AuthProvider>
  )
}
