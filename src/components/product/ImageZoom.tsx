'use client'
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from 'react'
import { normalizePublicAssetUrl } from '@/lib/public-asset-url'

interface ImageZoomProps {
  src: string
  alt: string
}

export function ImageZoom({ src, alt }: ImageZoomProps) {
  const [isZoomed, setIsZoomed] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [position, setPosition] = useState({ x: 50, y: 50 })
  const containerRef = useRef<HTMLDivElement>(null)
  const imageUrl = normalizePublicAssetUrl(src)

  useEffect(() => {
    setHasError(false)
    setIsZoomed(false)
  }, [imageUrl])

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setPosition({ x, y })
  }

  return (
    <>
      {/* Hover zoom container */}
      <div
        ref={containerRef}
        className="relative cursor-zoom-in overflow-hidden"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
        onClick={() => setIsZoomed(true)}
      >
        {imageUrl && !hasError ? (
          <img
            src={imageUrl}
            alt={alt}
            className="h-full w-full object-contain transition-transform duration-200"
            decoding="async"
            fetchPriority="high"
            onError={() => {
              setHasError(true)
              setIsZoomed(false)
            }}
            style={isZoomed ? {
              transform: 'scale(2)',
              transformOrigin: `${position.x}% ${position.y}%`,
            } : undefined}
          />
        ) : (
          <div className="flex aspect-square items-center justify-center text-secondary-300">
            <svg className="h-32 w-32" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      <p className="py-2 text-center text-xs text-secondary-400">Hover to zoom</p>
    </>
  )
}
