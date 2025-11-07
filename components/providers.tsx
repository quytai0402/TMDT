'use client'

import { ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { SessionProvider } from 'next-auth/react'

import { ConciergeContextProvider } from './concierge-context-provider'
import AuthModalWrapper from './auth-modal-wrapper'
import { SessionRefreshListener } from './session-refresh-listener'
import { Toaster } from './ui/toaster'
import { WishlistProvider } from './wishlist-provider'

const LiveChatWidget = dynamic(
  () => import('./live-chat-widget').then((mod) => ({ default: mod.LiveChatWidget })),
  { ssr: false }
)

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <WishlistProvider>
        <ConciergeContextProvider>
          {children}
          <AuthModalWrapper />
          <Toaster />
          <SessionRefreshListener />
          <LiveChatWidget />
        </ConciergeContextProvider>
      </WishlistProvider>
    </SessionProvider>
  )
}
