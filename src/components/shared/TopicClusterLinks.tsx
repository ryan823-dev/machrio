import Link from 'next/link'
import type { SeoCategoryLink } from '@/lib/seo'

interface TopicClusterLinksProps {
  title: string
  description: string
  categories: SeoCategoryLink[]
}

export function TopicClusterLinks({
  title,
  description,
  categories,
}: TopicClusterLinksProps) {
  if (categories.length === 0) return null

  return (
    <section className="mt-10 rounded-2xl border border-primary-200 bg-primary-50/60 p-6">
      <h2 className="text-lg font-semibold text-primary-900">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-primary-800">
        {description}
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/category/${category.slug}`}
            className="rounded-xl border border-primary-200 bg-white p-4 transition-colors hover:border-primary-400 hover:bg-primary-50"
          >
            <p className="text-sm font-semibold text-secondary-900">{category.name}</p>
            <p className="mt-2 text-sm leading-relaxed text-secondary-600">
              {category.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
