'use client'

import { useState } from 'react'
import Link from 'next/link'
import { hasRichTextContent, lexicalToHtml } from '@/lib/lexical-utils'

interface RelatedGuide {
  slug: string
  title: string
  excerpt: string
}

interface HowToChooseProps {
  categorySlug: string
  categoryName: string
  buyingGuideContent?: unknown // Lexical richText from database
  relatedGuides?: RelatedGuide[]
}

export function HowToChoose({ 
  categorySlug, 
  categoryName, 
  buyingGuideContent,
  relatedGuides = []
}: HowToChooseProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  
  // If no buying guide content, don't render
  if (!buyingGuideContent || !hasRichTextContent(buyingGuideContent)) {
    return null
  }
  
  const htmlContent = lexicalToHtml(buyingGuideContent)
  
  return (
    <section className="mb-10 rounded-xl border border-secondary-200 bg-gradient-to-br from-primary-50/50 to-white p-6 shadow-sm lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" 
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-secondary-900">
              How to Choose the Right {categoryName}
            </h2>
            <p className="text-sm text-secondary-500">
              Expert guidance for selecting the best products for your needs
            </p>
          </div>
        </div>
        
        {/* Expand/Collapse button (mobile) */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="lg:hidden rounded-lg border border-secondary-200 bg-white p-2 text-secondary-600 hover:bg-secondary-50"
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>
      </div>
      
      {/* Content */}
      <div className={`prose prose-sm prose-secondary max-w-none text-secondary-700 ${isExpanded ? 'block' : 'hidden lg:block'}`}>
        <div 
          className="leading-relaxed"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
      
      {/* Related Guides */}
      {relatedGuides.length > 0 && (
        <div className="mt-6 border-t border-secondary-200 pt-6">
          <h3 className="mb-3 text-sm font-semibold text-secondary-800">
            Related Buying Guides
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {relatedGuides.map((guide) => (
              <Link
                key={guide.slug}
                href={`/knowledge-center/${guide.slug}`}
                className="group rounded-lg border border-secondary-200 bg-white p-4 transition-all hover:border-primary-300 hover:bg-primary-50 hover:shadow-sm"
              >
                <h4 className="font-semibold text-secondary-900 group-hover:text-primary-700">
                  {guide.title}
                </h4>
                <p className="mt-1 text-sm text-secondary-600 line-clamp-2">
                  {guide.excerpt}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
      
      {/* CTA */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={`/category/${categorySlug}`}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
        >
          Browse {categoryName}
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        <Link
          href="/rfq"
          className="inline-flex items-center gap-2 rounded-lg border border-secondary-300 bg-white px-5 py-2.5 text-sm font-medium text-secondary-700 transition-colors hover:bg-secondary-50"
        >
          Request a Quote
        </Link>
      </div>
    </section>
  )
}
