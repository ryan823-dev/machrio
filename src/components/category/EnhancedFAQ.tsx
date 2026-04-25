'use client'

import { useState, useMemo } from 'react'

interface FAQItem {
  question: string
  answer: string
}

interface EnhancedFAQProps {
  faqs: FAQItem[]
  categoryName: string
  showSchema?: boolean
}

export function EnhancedFAQ({ 
  faqs, 
  categoryName,
  showSchema = true 
}: EnhancedFAQProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandAll, setExpandAll] = useState(false)
  
  // Filter FAQs based on search query
  const filteredFAQs = useMemo(() => {
    if (!searchQuery.trim()) return faqs
    
    const query = searchQuery.toLowerCase()
    return faqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query)
    )
  }, [faqs, searchQuery])
  
  // Toggle expand/collapse all
  const handleExpandAll = () => {
    if (expandAll) {
      setExpandedIndex(null)
      setExpandAll(false)
    } else {
      setExpandAll(true)
    }
  }
  
  if (!faqs || faqs.length === 0) {
    return null
  }
  
  return (
    <section className="mb-10 rounded-xl border border-secondary-200 bg-white p-6 shadow-sm lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-secondary-100 text-secondary-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-secondary-900">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-secondary-500">
              Common questions about {categoryName}
            </p>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-2">
          {faqs.length > 3 && (
            <button
              onClick={handleExpandAll}
              className="rounded-lg border border-secondary-200 bg-white px-3 py-1.5 text-xs font-medium text-secondary-600 transition-colors hover:bg-secondary-50"
            >
              {expandAll ? 'Collapse All' : 'Expand All'}
            </button>
          )}
        </div>
      </div>
      
      {/* Search */}
      {faqs.length > 5 && (
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions..."
              className="w-full rounded-lg border border-secondary-300 bg-white px-4 py-2.5 pl-10 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <svg 
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
              />
            </svg>
          </div>
        </div>
      )}
      
      {/* FAQ List */}
      <div className="space-y-3">
        {filteredFAQs.length === 0 ? (
          <div className="py-8 text-center text-sm text-secondary-500">
            No questions found matching "{searchQuery}"
          </div>
        ) : (
          filteredFAQs.map((faq, index) => {
            const actualIndex = faqs.indexOf(faq)
            const isExpanded = expandAll || expandedIndex === actualIndex
            
            return (
              <div
                key={actualIndex}
                className="rounded-lg border border-secondary-200 bg-secondary-50/50 transition-all hover:border-primary-200 hover:bg-primary-50/30"
              >
                <button
                  onClick={() => setExpandedIndex(isExpanded ? null : actualIndex)}
                  className="flex w-full items-center justify-between gap-4 p-4 text-left"
                  aria-expanded={isExpanded}
                >
                  <span className="font-medium text-secondary-900">
                    {faq.question}
                  </span>
                  <svg
                    className={`h-5 w-5 flex-shrink-0 text-secondary-500 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                
                {isExpanded && (
                  <div className="border-t border-secondary-200 px-4 pb-4 pt-2">
                    <p className="text-sm leading-relaxed text-secondary-700">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
      
      {/* CTA */}
      {filteredFAQs.length > 0 && (
        <div className="mt-6 rounded-lg border border-accent-200 bg-accent-50 p-4 text-center">
          <p className="text-sm text-accent-800">
            Still have questions?
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <a
              href={`mailto:support@machrio.com?subject=Question about ${encodeURIComponent(categoryName)}`}
              className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
            >
              Email our team
            </a>
            <span className="text-accent-400">|</span>
            <a
              href="/rfq"
              className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
            >
              Request a Quote
            </a>
          </div>
        </div>
      )}
      
      {/* FAQ Schema */}
      {showSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
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
            }),
          }}
        />
      )}
    </section>
  )
}
