'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

/**
 * Dashboard router - redirects user to appropriate dashboard based on role
 */
export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    // Redirect based on role
    switch (session.user.role) {
      case 'ADMIN':
        router.push('/admin')
        break
      case 'HOST':
        router.push('/host/dashboard')
        break
      case 'GUEST':
      default:
        router.push('/trips')
        break
    }
  }, [session, status, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Đang chuyển hướng...</p>
      </div>
    </div>
  )
}
