'use client'

import { useState } from 'react'

interface ExpandableIntroProps {
  content: string
  truncateLength?: number
}

/**
 * Client component for expandable intro paragraph with Show More/Less toggle.
 * Used on category pages for SEO intro content.
 */
export function ExpandableIntro({ content, truncateLength = 280 }: ExpandableIntroProps) {
  const [expanded, setExpanded] = useState(false)

  if (!content) return null

  const needsTruncation = content.length > truncateLength
  const displayContent = expanded || !needsTruncation
    ? content
    : content.slice(0, truncateLength).replace(/\s+\S*$/, '') + '...'

  return (
    <div className="mt-3 max-w-4xl text-sm leading-relaxed text-secondary-600">
      <p>{displayContent}</p>
      {needsTruncation && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline"
        >
          {expanded ? 'Show Less' : 'Show More'}
        </button>
      )}
    </div>
  )
}
