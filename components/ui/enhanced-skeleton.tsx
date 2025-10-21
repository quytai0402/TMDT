"use client"

import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "circular" | "text" | "card" | "avatar"
}

export function EnhancedSkeleton({ className, variant = "default", ...props }: SkeletonProps) {
  const baseClass = "animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]"
  
  const variants = {
    default: "rounded-md",
    circular: "rounded-full",
    text: "h-4 rounded",
    card: "rounded-xl",
    avatar: "rounded-full aspect-square",
  }

  return (
    <div
      className={cn(baseClass, variants[variant], className)}
      style={{
        animation: "shimmer 2s ease-in-out infinite",
      }}
      {...props}
    />
  )
}

// Skeleton card cho listing
export function ListingCardSkeleton() {
  return (
    <div className="space-y-3 animate-in fade-in-50 duration-500">
      <EnhancedSkeleton variant="card" className="h-64 w-full" />
      <div className="space-y-2">
        <EnhancedSkeleton variant="text" className="h-4 w-3/4" />
        <EnhancedSkeleton variant="text" className="h-4 w-1/2" />
        <div className="flex items-center gap-2 pt-2">
          <EnhancedSkeleton variant="circular" className="h-6 w-6" />
          <EnhancedSkeleton variant="text" className="h-3 w-24" />
        </div>
      </div>
    </div>
  )
}

// Skeleton cho profile card
export function ProfileCardSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 animate-in fade-in-50 duration-500">
      <EnhancedSkeleton variant="avatar" className="h-16 w-16" />
      <div className="flex-1 space-y-2">
        <EnhancedSkeleton variant="text" className="h-5 w-32" />
        <EnhancedSkeleton variant="text" className="h-4 w-48" />
      </div>
    </div>
  )
}

// Skeleton cho booking card
export function BookingCardSkeleton() {
  return (
    <div className="border rounded-xl p-6 space-y-4 animate-in fade-in-50 duration-500">
      <div className="flex gap-4">
        <EnhancedSkeleton variant="card" className="h-24 w-32 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <EnhancedSkeleton variant="text" className="h-5 w-3/4" />
          <EnhancedSkeleton variant="text" className="h-4 w-1/2" />
          <EnhancedSkeleton variant="text" className="h-4 w-2/3" />
        </div>
      </div>
      <div className="flex gap-2">
        <EnhancedSkeleton className="h-9 w-24 rounded-lg" />
        <EnhancedSkeleton className="h-9 w-24 rounded-lg" />
      </div>
    </div>
  )
}

// Grid skeleton
export function GridSkeleton({ count = 6, variant = "listing" }: { count?: number; variant?: "listing" | "profile" | "booking" }) {
  const SkeletonComponent = {
    listing: ListingCardSkeleton,
    profile: ProfileCardSkeleton,
    booking: BookingCardSkeleton,
  }[variant]

  return (
    <div className={cn(
      "grid gap-6",
      variant === "listing" && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
      variant === "profile" && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      variant === "booking" && "grid-cols-1 lg:grid-cols-2"
    )}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </div>
  )
}

// Table skeleton
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3 animate-in fade-in-50 duration-500">
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <EnhancedSkeleton key={i} variant="text" className="h-5" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, colIndex) => (
            <EnhancedSkeleton key={colIndex} variant="text" className="h-4" />
          ))}
        </div>
      ))}
    </div>
  )
}

// Form skeleton
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <EnhancedSkeleton variant="text" className="h-4 w-24" />
          <EnhancedSkeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
      <EnhancedSkeleton className="h-10 w-32 rounded-lg" />
    </div>
  )
}
