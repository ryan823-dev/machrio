interface FAQItem {
  question: string
  answer: string
}

interface FAQSchemaProps {
  faqs: FAQItem[]
}

/**
 * FAQPage Schema for AI engines and Google rich results
 * Outputs structured data that AI assistants can extract as answers
 */
export function FAQSchema({ faqs }: FAQSchemaProps) {
  if (faqs.length === 0) return null

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  )
}

/**
 * Visual FAQ Section component for displaying FAQs on page
 * Uses Schema.org microdata attributes for AI engine and search crawler recognition
 */
export function FAQSection({ faqs, title = 'Frequently Asked Questions' }: FAQSchemaProps & { title?: string }) {
  if (faqs.length === 0) return null

  return (
    <section className="mt-10" itemScope itemType="https://schema.org/FAQPage">
      <h2 className="text-lg font-bold text-secondary-900">{title}</h2>
      <div className="mt-4 space-y-4">
        {faqs.map((faq, index) => (
          <details
            key={index}
            className="group rounded-lg border border-secondary-200 bg-white"
            open={index === 0}
            itemScope
            itemProp="mainEntity"
            itemType="https://schema.org/Question"
          >
            <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium text-secondary-800 hover:bg-secondary-50">
              <span itemProp="name">{faq.question}</span>
              <svg
                className="h-4 w-4 flex-shrink-0 text-secondary-400 transition-transform group-open:rotate-180"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div
              className="border-t border-secondary-100 px-4 py-3 text-sm text-secondary-600"
              itemScope
              itemProp="acceptedAnswer"
              itemType="https://schema.org/Answer"
            >
              <span itemProp="text">{faq.answer}</span>
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}
