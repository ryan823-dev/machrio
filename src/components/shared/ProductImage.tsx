'use client'
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from 'react'
import { normalizePublicAssetUrl } from '@/lib/public-asset-url'

interface ProductImageProps {
  src?: string | null
  alt: string
  className: string
  fallbackClassName?: string
  loading?: 'eager' | 'lazy'
  decoding?: 'async' | 'auto' | 'sync'
  fetchPriority?: 'auto' | 'high' | 'low'
}

export function ProductImage({
  src,
  alt,
  className,
  fallbackClassName = 'h-10 w-10 text-secondary-200',
  loading = 'lazy',
  decoding = 'async',
  fetchPriority,
}: ProductImageProps) {
  const normalizedSrc = normalizePublicAssetUrl(src)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setHasError(false)
  }, [normalizedSrc])

  if (!normalizedSrc || hasError) {
    return (
      <svg className={fallbackClassName} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
      </svg>
    )
  }

  return (
    <img
      src={normalizedSrc}
      alt={alt}
      className={className}
      loading={loading}
      decoding={decoding}
      onError={() => setHasError(true)}
      {...(fetchPriority ? { fetchPriority } : {})}
    />
  )
}
