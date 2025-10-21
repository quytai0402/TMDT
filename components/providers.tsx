'use client'

import { ReactNode } from 'react'
import AuthProvider from './auth-provider'
import { WishlistProvider } from './wishlist-provider'
import { Toaster } from './ui/toaster'
import AuthModalWrapper from './auth-modal-wrapper'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <WishlistProvider>
        {children}
        <AuthModalWrapper />
        <Toaster />
      </WishlistProvider>
    </AuthProvider>
  )
}
