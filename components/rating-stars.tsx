import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RatingStarsProps {
  rating: number
  maxRating?: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showNumber?: boolean
  interactive?: boolean
  onChange?: (rating: number) => void
  className?: string
}

export default function RatingStars({
  rating,
  maxRating = 5,
  size = 'md',
  showNumber = false,
  interactive = false,
  onChange,
  className,
}: RatingStarsProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  }

  const handleClick = (starRating: number) => {
    if (interactive && onChange) {
      onChange(starRating)
    }
  }

  const renderStar = (index: number) => {
    const starValue = index + 1
    const fillPercentage = Math.max(0, Math.min(1, rating - index))
    const isFilled = fillPercentage > 0
    const isPartial = fillPercentage > 0 && fillPercentage < 1

    return (
      <div
        key={index}
        className={cn(
          'relative',
          interactive && 'cursor-pointer hover:scale-110 transition-transform'
        )}
        onClick={() => handleClick(starValue)}
        onKeyDown={(e) => {
          if (interactive && (e.key === 'Enter' || e.key === ' ')) {
            handleClick(starValue)
          }
        }}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        aria-label={`${starValue} star${starValue > 1 ? 's' : ''}`}
      >
        {/* Background star (gray) */}
        <Star
          className={cn(
            sizeClasses[size],
            'text-gray-300',
            interactive && 'transition-colors hover:text-gray-400'
          )}
        />

        {/* Foreground star (yellow) */}
        {isFilled && (
          <div
            className="absolute inset-0 overflow-hidden"
            style={{
              width: `${fillPercentage * 100}%`,
            }}
          >
            <Star
              className={cn(
                sizeClasses[size],
                'fill-yellow-400 text-yellow-400'
              )}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {/* Stars */}
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxRating }, (_, i) => renderStar(i))}
      </div>

      {/* Rating Number */}
      {showNumber && (
        <span className={cn('font-medium text-gray-700 ml-1', textSizeClasses[size])}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}

// Preset rating display components
export function RatingBadge({ rating, reviewCount }: { rating: number; reviewCount?: number }) {
  return (
    <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      <span className="font-semibold text-gray-900">{rating.toFixed(1)}</span>
      {reviewCount !== undefined && (
        <span className="text-sm text-gray-500">({reviewCount})</span>
      )}
    </div>
  )
}

export function RatingBar({ 
  label, 
  rating, 
  count, 
  maxCount 
}: { 
  label: string
  rating: number
  count: number
  maxCount: number 
}) {
  const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1 min-w-[80px]">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
      </div>
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div
          className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm text-gray-600 min-w-[40px] text-right">{count}</span>
    </div>
  )
}

// Interactive rating input
export function RatingInput({
  value,
  onChange,
  label,
  error,
}: {
  value: number
  onChange: (rating: number) => void
  label?: string
  error?: string
}) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="flex items-center gap-3">
        <RatingStars
          rating={value}
          size="lg"
          interactive
          onChange={onChange}
        />
        <span className="text-lg font-semibold text-gray-900">
          {value > 0 ? value.toFixed(1) : 'Select rating'}
        </span>
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

// Rating summary component
export function RatingSummary({
  averageRating,
  totalReviews,
  breakdown,
}: {
  averageRating: number
  totalReviews: number
  breakdown: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
}) {
  const maxCount = Math.max(...Object.values(breakdown))

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Overall Rating */}
        <div className="flex flex-col items-center justify-center border-r border-gray-200">
          <div className="text-5xl font-bold text-gray-900 mb-2">
            {averageRating.toFixed(1)}
          </div>
          <RatingStars rating={averageRating} size="lg" />
          <p className="text-sm text-gray-600 mt-2">
            Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Rating Breakdown */}
        <div className="space-y-2">
          <RatingBar label="5 stars" rating={5} count={breakdown[5]} maxCount={maxCount} />
          <RatingBar label="4 stars" rating={4} count={breakdown[4]} maxCount={maxCount} />
          <RatingBar label="3 stars" rating={3} count={breakdown[3]} maxCount={maxCount} />
          <RatingBar label="2 stars" rating={2} count={breakdown[2]} maxCount={maxCount} />
          <RatingBar label="1 star" rating={1} count={breakdown[1]} maxCount={maxCount} />
        </div>
      </div>
    </div>
  )
}
