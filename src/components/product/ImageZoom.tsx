'use client'

import { useState, useRef } from 'react'

interface ImageZoomProps {
  src: string
  alt: string
}

export function ImageZoom({ src, alt }: ImageZoomProps) {
  const [isZoomed, setIsZoomed] = useState(false)
  const [position, setPosition] = useState({ x: 50, y: 50 })
  const containerRef = useRef<HTMLDivElement>(null)

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
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-contain transition-transform duration-200" decoding="async" fetchPriority="high"
          style={isZoomed ? {
            transform: 'scale(2)',
            transformOrigin: `${position.x}% ${position.y}%`,
          } : undefined}
        />
      </div>
      <p className="py-2 text-center text-xs text-secondary-400">Hover to zoom</p>
    </>
  )
}
