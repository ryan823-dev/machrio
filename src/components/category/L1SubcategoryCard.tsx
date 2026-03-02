import Link from 'next/link'

interface L3Tag {
  name: string
  slug: string
}

interface L1SubcategoryCardProps {
  name: string
  slug: string
  productCount: number
  l3Tags: L3Tag[]
}

export function L1SubcategoryCard({ name, slug, productCount, l3Tags }: L1SubcategoryCardProps) {
  return (
    <div className="group rounded-lg border border-secondary-200 bg-white p-4 transition-all hover:border-primary-200 hover:shadow-md">
      <Link href={`/category/${slug}`} className="block">
        <h3 className="font-semibold text-secondary-900 group-hover:text-primary-700">
          {name}
        </h3>
        <p className="mt-1 text-xs text-secondary-500">
          {productCount > 0
            ? `${productCount} ${productCount === 1 ? 'product' : 'products'}`
            : 'Browse →'}
        </p>
      </Link>
      
      {l3Tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {l3Tags.slice(0, 8).map((tag) => (
            <Link
              key={tag.slug}
              href={`/category/${tag.slug}`}
              className="rounded-full bg-secondary-100 px-2.5 py-1 text-xs text-secondary-600 transition-colors hover:bg-primary-100 hover:text-primary-700"
            >
              {tag.name}
            </Link>
          ))}
          {l3Tags.length > 8 && (
            <Link
              href={`/category/${slug}`}
              className="rounded-full bg-secondary-100 px-2.5 py-1 text-xs font-medium text-primary-600 hover:bg-primary-100"
            >
              +{l3Tags.length - 8} more
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
