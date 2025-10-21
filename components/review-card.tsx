import Image from 'next/image'
import { Star, ThumbsUp, Flag } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ReviewCardProps {
  review: {
    id: string
    rating: number
    comment: string
    createdAt: Date | string
    user: {
      id: string
      name: string | null
      image: string | null
    }
    listing?: {
      id: string
      title: string
    }
    helpfulCount?: number
  }
  showListing?: boolean
  onHelpful?: (reviewId: string) => void
  onReport?: (reviewId: string) => void
}

export default function ReviewCard({
  review,
  showListing = false,
  onHelpful,
  onReport,
}: ReviewCardProps) {
  const createdDate = typeof review.createdAt === 'string' 
    ? new Date(review.createdAt) 
    : review.createdAt

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        {/* User Avatar */}
        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
          {review.user.image ? (
            <Image
              src={review.user.image}
              alt={review.user.name || 'User'}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-lg">
              {review.user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
        </div>

        {/* User Info & Rating */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {review.user.name || 'Anonymous User'}
              </h3>
              <p className="text-sm text-gray-500">
                {formatDistanceToNow(createdDate, { addSuffix: true })}
              </p>
            </div>
            
            {/* Rating Stars */}
            <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-semibold text-gray-900">
                {review.rating.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Listing Link (if shown) */}
          {showListing && review.listing && (
            <div className="mt-2">
              <a
                href={`/listing/${review.listing.id}`}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                {review.listing.title}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Review Comment */}
      <div className="mb-4">
        <p className="text-gray-700 leading-relaxed">
          {review.comment}
        </p>
      </div>

      {/* Actions Footer */}
      <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
        {/* Helpful Button */}
        {onHelpful && (
          <button
            onClick={() => onHelpful(review.id)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ThumbsUp className="w-4 h-4" />
            <span>Helpful</span>
            {review.helpfulCount !== undefined && review.helpfulCount > 0 && (
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                {review.helpfulCount}
              </span>
            )}
          </button>
        )}

        {/* Report Button */}
        {onReport && (
          <button
            onClick={() => onReport(review.id)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors ml-auto"
          >
            <Flag className="w-4 h-4" />
            <span>Report</span>
          </button>
        )}
      </div>
    </div>
  )
}

// Skeleton loader for ReviewCard
export function ReviewCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-gray-200" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-24" />
        </div>
        <div className="h-6 bg-gray-200 rounded w-12" />
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-5/6" />
        <div className="h-3 bg-gray-200 rounded w-4/6" />
      </div>
      <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
        <div className="h-3 bg-gray-200 rounded w-20" />
        <div className="h-3 bg-gray-200 rounded w-16 ml-auto" />
      </div>
    </div>
  )
}
