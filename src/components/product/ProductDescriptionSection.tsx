interface ProductDescriptionSectionProps {
  descriptionHtml: string
  brandName: string
  availabilityLabel: string
  leadTime?: string
  minOrderQuantity: number
  hasSpecifications: boolean
}

interface DescriptionHeading {
  id: string
  level: 2 | 3
  text: string
}

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, ' ')
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function withHeadingAnchors(descriptionHtml: string): {
  html: string
  headings: DescriptionHeading[]
} {
  const headings: DescriptionHeading[] = []
  const usedIds = new Map<string, number>()

  const html = descriptionHtml.replace(
    /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (match, rawLevel: string, rawAttrs: string, rawContent: string) => {
      const text = decodeHtmlEntities(stripTags(rawContent))
      if (!text) return match

      const level = Number(rawLevel) as 2 | 3
      const existingIdMatch = rawAttrs.match(/\sid=(['"])(.*?)\1/i)
      let id = existingIdMatch?.[2]?.trim()

      if (!id) {
        const base = slugify(text) || `section-${headings.length + 1}`
        const occurrence = usedIds.get(base) ?? 0
        usedIds.set(base, occurrence + 1)
        id = occurrence === 0 ? base : `${base}-${occurrence + 1}`
      }

      headings.push({ id, level, text })

      if (existingIdMatch) {
        return `<h${rawLevel}${rawAttrs}>${rawContent}</h${rawLevel}>`
      }

      return `<h${rawLevel}${rawAttrs} id="${id}">${rawContent}</h${rawLevel}>`
    },
  )

  return { html, headings }
}

export function ProductDescriptionSection({
  descriptionHtml,
  brandName,
  availabilityLabel,
  leadTime,
  minOrderQuantity,
  hasSpecifications,
}: ProductDescriptionSectionProps) {
  const { html, headings } = withHeadingAnchors(descriptionHtml)

  const overviewItems = [
    { label: 'Brand', value: brandName },
    { label: 'Availability', value: availabilityLabel },
    { label: 'Lead Time', value: leadTime || 'Confirm with sales' },
    {
      label: 'Minimum Order',
      value: `${minOrderQuantity} unit${minOrderQuantity > 1 ? 's' : ''}`,
    },
  ]

  const quickLinks = [
    ...(hasSpecifications
      ? [{ href: '#specifications', label: 'Technical Specs' }]
      : []),
    ...headings.slice(0, 4).map((heading) => ({
      href: `#${heading.id}`,
      label: heading.text,
    })),
  ]

  return (
    <section id="description" className="mt-12 scroll-mt-24">
      <div className="overflow-hidden rounded-2xl border border-secondary-200 bg-gradient-to-br from-white via-secondary-50/60 to-primary-50/30 shadow-sm">
        <div className="border-b border-secondary-200/80 bg-white/80 px-6 py-6 backdrop-blur md:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <span className="inline-flex items-center rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-700">
                Product Details
              </span>

              <div className="mt-4 flex items-start gap-4">
                <div className="hidden h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-primary-200 bg-primary-100 text-primary-700 sm:flex">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>

                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-secondary-900">
                    Product Description
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary-600">
                    Review application context, feature notes, and selection details in a layout
                    designed to match the rest of the product page.
                  </p>
                </div>
              </div>
            </div>

            {quickLinks.length > 0 && (
              <div className="flex flex-wrap gap-2 lg:max-w-sm lg:justify-end">
                {quickLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="inline-flex items-center rounded-full border border-secondary-200 bg-white/90 px-3 py-1.5 text-xs font-medium text-secondary-700 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-800"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="px-6 py-7 md:px-8 md:py-8">
            <div
              className="product-description-content max-w-none [&_h2]:scroll-mt-24 [&_h3]:scroll-mt-24"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>

          <aside className="border-t border-secondary-200 bg-white/70 px-6 py-6 md:px-8 lg:border-l lg:border-t-0 lg:px-6">
            <div className="space-y-6 lg:sticky lg:top-24">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary-500">
                  At a Glance
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  {overviewItems.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-secondary-200 bg-white/90 p-4 shadow-sm shadow-secondary-900/5"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary-500">
                        {item.label}
                      </p>
                      <p className="mt-2 text-sm font-semibold leading-6 text-secondary-900">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-primary-200 bg-gradient-to-br from-primary-50 to-white p-4">
                <p className="text-sm font-semibold text-secondary-900">
                  Buying Note
                </p>
                <p className="mt-2 text-sm leading-6 text-secondary-600">
                  Use this section to confirm fit and application details, then cross-check the
                  specification table before placing larger or repeat orders.
                </p>
              </div>

              {quickLinks.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary-500">
                    On This Section
                  </p>
                  <nav className="mt-3 space-y-2">
                    {quickLinks.map((link) => (
                      <a
                        key={`${link.href}-nav`}
                        href={link.href}
                        className="block rounded-lg px-3 py-2 text-sm text-secondary-600 transition-colors hover:bg-white hover:text-primary-700"
                      >
                        {link.label}
                      </a>
                    ))}
                  </nav>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
