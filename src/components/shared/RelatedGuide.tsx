import Link from 'next/link'

// ---------------------------------------------------------------------------
// Article-Category Mapping
// Maps product categories/tags to relevant buying guide articles
// ---------------------------------------------------------------------------

interface GuideMapping {
  articleSlug: string
  articleTitle: string
  articleExcerpt: string
}

// Primary mapping: category slug -> guide
const categoryToGuide: Record<string, GuideMapping> = {
  safety: {
    articleSlug: 'how-to-choose-cut-resistant-gloves',
    articleTitle: 'How to Choose Cut-Resistant Gloves',
    articleExcerpt: 'Understand ANSI/ISEA 105 cut levels A1-A9 and match protection to your application.',
  },
}

// Secondary mapping: product tags -> guide (more specific)
const tagToGuide: Record<string, GuideMapping> = {
  'cut-resistant': {
    articleSlug: 'how-to-choose-cut-resistant-gloves',
    articleTitle: 'How to Choose Cut-Resistant Gloves',
    articleExcerpt: 'Understand ANSI/ISEA 105 cut levels A1-A9 and match protection to your application.',
  },
  gloves: {
    articleSlug: 'how-to-choose-cut-resistant-gloves',
    articleTitle: 'How to Choose Cut-Resistant Gloves',
    articleExcerpt: 'Understand ANSI/ISEA 105 cut levels A1-A9 and match protection to your application.',
  },
  eyewear: {
    articleSlug: 'safety-glasses-buying-guide-ansi-z87',
    articleTitle: 'Safety Glasses Buying Guide',
    articleExcerpt: 'Learn ANSI Z87.1 requirements, impact ratings, and lens options for your workplace.',
  },
  glasses: {
    articleSlug: 'safety-glasses-buying-guide-ansi-z87',
    articleTitle: 'Safety Glasses Buying Guide',
    articleExcerpt: 'Learn ANSI Z87.1 requirements, impact ratings, and lens options for your workplace.',
  },
  'fall-protection': {
    articleSlug: 'fall-protection-basics-osha-requirements',
    articleTitle: 'Fall Protection Basics',
    articleExcerpt: 'OSHA requirements, harness selection, and equipment guidelines for working at height.',
  },
  harness: {
    articleSlug: 'fall-protection-basics-osha-requirements',
    articleTitle: 'Fall Protection Basics',
    articleExcerpt: 'OSHA requirements, harness selection, and equipment guidelines for working at height.',
  },
}

// ---------------------------------------------------------------------------
// RelatedGuide Component
// Displays a contextual link to a relevant buying guide on product pages
// ---------------------------------------------------------------------------

interface RelatedGuideProps {
  categorySlug?: string
  tags?: string[]
}

export function RelatedGuide({ categorySlug, tags = [] }: RelatedGuideProps) {
  // Try to find a matching guide: tags first (more specific), then category
  let guide: GuideMapping | null = null

  // Check tags first
  for (const tag of tags) {
    const normalizedTag = tag.toLowerCase().replace(/\s+/g, '-')
    if (tagToGuide[normalizedTag]) {
      guide = tagToGuide[normalizedTag]
      break
    }
  }

  // Fall back to category
  if (!guide && categorySlug && categoryToGuide[categorySlug]) {
    guide = categoryToGuide[categorySlug]
  }

  // Don't render if no matching guide
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
            <p className="text-sm font-medium text-primary-800">Not sure if this is right for you?</p>
            <Link
              href={`/knowledge-center/${guide.articleSlug}`}
              className="group mt-1 block"
            >
              <span className="text-base font-semibold text-secondary-900 group-hover:text-primary-700">
                {guide.articleTitle}
              </span>
              <span className="ml-1 text-primary-600 transition-transform group-hover:translate-x-0.5 inline-block">→</span>
            </Link>
            <p className="mt-1 text-sm text-secondary-600">{guide.articleExcerpt}</p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// CategoryBuyingGuide Component
// Displays a buying guide banner at the top of category pages
// ---------------------------------------------------------------------------

interface CategoryBuyingGuideProps {
  categorySlug: string
}

export function CategoryBuyingGuide({ categorySlug }: CategoryBuyingGuideProps) {
  const guide = categoryToGuide[categorySlug]

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
              Buying Guide: {guide.articleTitle}
            </p>
            <p className="text-sm text-secondary-600 hidden sm:block">
              {guide.articleExcerpt}
            </p>
          </div>
        </div>
        <Link
          href={`/knowledge-center/${guide.articleSlug}`}
          className="flex-shrink-0 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
        >
          Read Guide
        </Link>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Exports for easy extension
// ---------------------------------------------------------------------------

export { categoryToGuide, tagToGuide }
export type { GuideMapping }
