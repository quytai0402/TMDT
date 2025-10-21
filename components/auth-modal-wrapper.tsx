'use client'

import { AuthModal } from './auth-modal'
import { useAuthModal } from '@/hooks/use-auth-modal'

export default function AuthModalWrapper() {
  const { isOpen, defaultTab, close } = useAuthModal()

  return (
    <AuthModal 
      open={isOpen} 
      onOpenChange={close}
      defaultTab={defaultTab}
    />
  )
}
