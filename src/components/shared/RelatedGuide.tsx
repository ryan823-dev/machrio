import Link from 'next/link'
import { getPrimaryGuideForCategory } from '@/lib/seo'

interface RelatedGuideProps {
  categorySlug?: string
  tags?: string[]
}

export function RelatedGuide({ categorySlug, tags = [] }: RelatedGuideProps) {
  const guide = getPrimaryGuideForCategory(categorySlug, tags)

  if (!guide) return null

  return (
    <section className="mt-10">
      <div className="rounded-lg border border-primary-100 bg-primary-50/50 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-primary-800">Not sure if this is the right fit?</p>
            <Link
              href={`/knowledge-center/${guide.slug}`}
              className="group mt-1 block"
            >
              <span className="text-base font-semibold text-secondary-900 group-hover:text-primary-700">
                {guide.title}
              </span>
              <span className="ml-1 inline-block text-primary-600 transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
            <p className="mt-1 text-sm text-secondary-600">{guide.excerpt}</p>
          </div>
        </div>
      </div>
    </section>
  )
}

interface CategoryBuyingGuideProps {
  categorySlug: string
}

export function CategoryBuyingGuide({ categorySlug }: CategoryBuyingGuideProps) {
  const guide = getPrimaryGuideForCategory(categorySlug)

  if (!guide) return null

  return (
    <div className="mb-6 rounded-lg border border-primary-100 bg-gradient-to-r from-primary-50 to-primary-50/30 px-5 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-secondary-900">
              Buying Guide: {guide.title}
            </p>
            <p className="hidden text-sm text-secondary-600 sm:block">
              {guide.excerpt}
            </p>
          </div>
        </div>
        <Link
          href={`/knowledge-center/${guide.slug}`}
          className="flex-shrink-0 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
        >
          Read Guide
        </Link>
      </div>
    </div>
  )
}
