import Link from 'next/link'

interface SubcategoryItem {
  name: string
  slug: string
  productCount: number
}

interface SubcategoryGridProps {
  items: SubcategoryItem[]
  parentSlug: string
}

export function SubcategoryGrid({ items, parentSlug }: SubcategoryGridProps) {
  if (items.length === 0) return null

  return (
    <div className="mb-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {items.map((item) => (
          <Link
            key={item.slug}
            href={`/category/${item.slug}`}
            className="rounded-lg border border-secondary-200 bg-white px-3 py-4 text-center transition-all hover:border-primary-200 hover:shadow-sm"
          >
            <span className="block text-sm font-medium text-secondary-800">{item.name}</span>
            <span className="mt-1 block text-xs text-secondary-500">
              {item.productCount > 0 ? `${item.productCount} products` : 'Browse →'}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
