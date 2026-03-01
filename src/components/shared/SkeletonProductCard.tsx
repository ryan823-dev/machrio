/**
 * Skeleton loading state for product cards.
 * Dimensions match actual ProductGrid card layout to prevent CLS.
 */
export function SkeletonProductCard({ variant = 'grid' }: { variant?: 'grid' | 'list' }) {
  if (variant === 'list') {
    return (
      <div
        className="flex gap-4 rounded-lg border border-secondary-200 bg-white p-4 animate-pulse"
        role="status"
        aria-label="Loading product"
      >
        {/* Image placeholder - matches h-28 w-28 */}
        <div className="h-28 w-28 flex-shrink-0 rounded bg-secondary-100" />

        {/* Content */}
        <div className="flex flex-1 flex-col">
          {/* Brand + SKU line */}
          <div className="h-3 w-2/3 rounded bg-secondary-100" />
          {/* Product name */}
          <div className="mt-2 h-4 w-full rounded bg-secondary-100" />
          {/* Description */}
          <div className="mt-2 h-3 w-full rounded bg-secondary-100" />
          {/* Price + availability */}
          <div className="mt-auto flex items-center gap-3 pt-3">
            <div className="h-4 w-20 rounded bg-secondary-100" />
            <div className="h-3 w-16 rounded bg-secondary-100" />
          </div>
        </div>

        {/* Action buttons placeholder */}
        <div className="flex flex-shrink-0 flex-col gap-2">
          <div className="h-8 w-20 rounded bg-secondary-100" />
          <div className="h-8 w-20 rounded bg-secondary-100" />
        </div>
        <span className="sr-only">Loading product...</span>
      </div>
    )
  }

  // Grid variant - matches card flex flex-col p-4 layout
  return (
    <div
      className="flex flex-col rounded-lg border border-secondary-200 bg-white p-4 animate-pulse"
      role="status"
      aria-label="Loading product"
    >
      {/* Image placeholder - matches h-48 */}
      <div className="h-48 w-full rounded bg-secondary-100" />

      {/* Brand */}
      <div className="mt-3 h-3 w-1/3 rounded bg-secondary-100" />

      {/* Product name - 2 lines */}
      <div className="mt-2 h-4 w-full rounded bg-secondary-100" />
      <div className="mt-1 h-4 w-3/4 rounded bg-secondary-100" />

      {/* Package qty */}
      <div className="mt-2 h-3 w-1/2 rounded bg-secondary-100" />

      {/* Price */}
      <div className="mt-auto pt-3">
        <div className="h-4 w-2/5 rounded bg-secondary-100" />
      </div>
      <span className="sr-only">Loading product...</span>
    </div>
  )
}
