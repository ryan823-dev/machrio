import { SkeletonProductCard } from './SkeletonProductCard'

interface SkeletonProductGridProps {
  count?: number
  variant?: 'grid' | 'list'
}

/**
 * Skeleton loading state for product grids/lists.
 * Grid layout matches actual ProductGrid: grid-cols-2 md:grid-cols-3 lg:grid-cols-4.
 * List layout matches actual spacing: space-y-3.
 */
export function SkeletonProductGrid({ count = 8, variant = 'grid' }: SkeletonProductGridProps) {
  if (variant === 'list') {
    return (
      <div className="space-y-3" role="status" aria-label="Loading products">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonProductCard key={i} variant="list" />
        ))}
        <span className="sr-only">Loading {count} products...</span>
      </div>
    )
  }

  return (
    <div
      className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
      role="status"
      aria-label="Loading products"
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonProductCard key={i} variant="grid" />
      ))}
      <span className="sr-only">Loading {count} products...</span>
    </div>
  )
}
