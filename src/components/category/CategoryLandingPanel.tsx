import Link from 'next/link'
import type { SeoCategoryOverride, SeoGuideLink } from '@/lib/seo'

interface CategoryLandingPanelProps {
  categoryName: string
  content: SeoCategoryOverride
  guides?: SeoGuideLink[]
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm leading-relaxed text-secondary-700">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-primary-500" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function CategoryLandingPanel({
  categoryName,
  content,
  guides = [],
}: CategoryLandingPanelProps) {
  return (
    <section className="mb-10 rounded-2xl border border-secondary-200 bg-gradient-to-br from-white via-primary-50/50 to-white p-6 shadow-sm lg:p-8">
      <div className="max-w-4xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-700">
          Procurement Guide
        </p>
        <h2 className="mt-3 text-2xl font-bold text-secondary-900">
          How Buyers Should Source {categoryName}
        </h2>
        <p className="mt-4 text-sm leading-7 text-secondary-700">
          {content.summary}
        </p>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        <div className="rounded-xl border border-secondary-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-secondary-900">What to Compare</h3>
          <div className="mt-4">
            <BulletList items={content.buyingFactors} />
          </div>
        </div>

        <div className="rounded-xl border border-secondary-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-secondary-900">Common Applications</h3>
          <div className="mt-4">
            <BulletList items={content.applications} />
          </div>
        </div>

        <div className="rounded-xl border border-secondary-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-secondary-900">RFQ Checklist</h3>
          <div className="mt-4">
            <BulletList items={content.procurementChecklist} />
          </div>
        </div>
      </div>

      {guides.length > 0 && (
        <div className="mt-8 border-t border-secondary-200 pt-6">
          <h3 className="text-sm font-semibold text-secondary-900">Related Buying Guides</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {guides.map((guide) => (
              <Link
                key={guide.slug}
                href={`/knowledge-center/${guide.slug}`}
                className="rounded-xl border border-secondary-200 bg-white p-4 transition-colors hover:border-primary-300 hover:bg-primary-50"
              >
                <p className="text-sm font-semibold text-secondary-900">{guide.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-secondary-600">
                  {guide.excerpt}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-secondary-200 pt-6">
        <Link href="/rfq" className="btn-accent">
          Request a Quote
        </Link>
        <Link href="/contact" className="btn-secondary">
          Talk to Sourcing
        </Link>
        <p className="text-sm text-secondary-500">
          Use RFQ when you need cross-SKU comparison, bulk pricing, or application support.
        </p>
      </div>
    </section>
  )
}
