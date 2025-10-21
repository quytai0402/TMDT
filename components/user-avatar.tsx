import Image from 'next/image'
import { cn } from '@/lib/utils'
import { User } from 'lucide-react'

interface UserAvatarProps {
  user?: {
    name?: string | null
    image?: string | null
  } | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
  showOnlineStatus?: boolean
  isOnline?: boolean
}

export default function UserAvatar({
  user,
  size = 'md',
  className,
  showOnlineStatus = false,
  isOnline = false,
}: UserAvatarProps) {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-24 h-24 text-3xl',
  }

  const onlineIndicatorSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
    '2xl': 'w-5 h-5',
  }

  const getInitials = (name?: string | null) => {
    if (!name) return 'U'
    
    const parts = name.trim().split(' ')
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase()
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }

  const getGradientColors = (name?: string | null) => {
    if (!name) return 'from-gray-400 to-gray-600'
    
    // Generate consistent color based on name
    const colors = [
      'from-blue-400 to-blue-600',
      'from-purple-400 to-purple-600',
      'from-pink-400 to-pink-600',
      'from-red-400 to-red-600',
      'from-orange-400 to-orange-600',
      'from-yellow-400 to-yellow-600',
      'from-green-400 to-green-600',
      'from-teal-400 to-teal-600',
      'from-cyan-400 to-cyan-600',
      'from-indigo-400 to-indigo-600',
    ]
    
    const charCode = name.charCodeAt(0) + name.charCodeAt(name.length - 1)
    return colors[charCode % colors.length]
  }

  return (
    <div className={cn('relative inline-block', className)}>
      <div
        className={cn(
          'relative rounded-full overflow-hidden flex items-center justify-center flex-shrink-0',
          sizeClasses[size]
        )}
      >
        {user?.image ? (
          <Image
            src={user.image}
            alt={user.name || 'User'}
            fill
            className="object-cover"
            sizes={`(max-width: 768px) ${sizeClasses[size]}, ${sizeClasses[size]}`}
          />
        ) : (
          <div
            className={cn(
              'w-full h-full flex items-center justify-center bg-gradient-to-br text-white font-semibold',
              getGradientColors(user?.name)
            )}
          >
            {user?.name ? getInitials(user.name) : <User className="w-1/2 h-1/2" />}
          </div>
        )}
      </div>

      {/* Online Status Indicator */}
      {showOnlineStatus && (
        <div
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-white',
            onlineIndicatorSizes[size],
            isOnline ? 'bg-green-500' : 'bg-gray-400'
          )}
          aria-label={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </div>
  )
}

// Avatar with name component
export function AvatarWithName({
  user,
  size = 'md',
  showEmail = false,
  className,
}: {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  } | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  showEmail?: boolean
  className?: string
}) {
  const textSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <UserAvatar user={user} size={size} />
      <div className="flex flex-col min-w-0">
        <span className={cn('font-medium text-gray-900 truncate', textSizes[size])}>
          {user?.name || 'Anonymous User'}
        </span>
        {showEmail && user?.email && (
          <span className="text-sm text-gray-500 truncate">{user.email}</span>
        )}
      </div>
    </div>
  )
}

// Avatar group component for multiple users
export function AvatarGroup({
  users,
  max = 3,
  size = 'md',
  className,
}: {
  users: Array<{
    name?: string | null
    image?: string | null
  }>
  max?: number
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
}) {
  const displayUsers = users.slice(0, max)
  const remainingCount = users.length - max

  const overlapClasses = {
    xs: '-ml-2',
    sm: '-ml-3',
    md: '-ml-4',
    lg: '-ml-5',
    xl: '-ml-6',
    '2xl': '-ml-8',
  }

  return (
    <div className={cn('flex items-center', className)}>
      {displayUsers.map((user, index) => (
        <div
          key={index}
          className={cn(
            'ring-2 ring-white',
            index > 0 && overlapClasses[size]
          )}
        >
          <UserAvatar user={user} size={size} />
        </div>
      ))}
      
      {remainingCount > 0 && (
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-gray-200 text-gray-700 font-medium ring-2 ring-white',
            overlapClasses[size]
          )}
          style={{
            width: {
              xs: '1.5rem',
              sm: '2rem',
              md: '2.5rem',
              lg: '3rem',
              xl: '4rem',
              '2xl': '6rem',
            }[size],
            height: {
              xs: '1.5rem',
              sm: '2rem',
              md: '2.5rem',
              lg: '3rem',
              xl: '4rem',
              '2xl': '6rem',
            }[size],
          }}
        >
          <span className="text-xs font-semibold">+{remainingCount}</span>
        </div>
      )}
    </div>
  )
}

// Skeleton loader for avatar
export function UserAvatarSkeleton({
  size = 'md',
  className,
}: {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
}) {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    '2xl': 'w-24 h-24',
  }

  return (
    <div
      className={cn(
        'rounded-full bg-gray-200 animate-pulse',
        sizeClasses[size],
        className
      )}
    />
  )
}
