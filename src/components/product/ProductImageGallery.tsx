'use client'

import { useEffect, useState } from 'react'
import { ImageZoom } from './ImageZoom'

interface ProductImageGalleryProps {
  images: string[]
  alt: string
}

export function ProductImageGallery({ images, alt }: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeImage = images[activeIndex] || images[0]

  useEffect(() => {
    setActiveIndex(0)
  }, [images])

  if (!activeImage) return null

  return (
    <div>
      <ImageZoom src={activeImage} alt={alt} />
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2 border-t border-secondary-200 bg-white p-2">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`aspect-square overflow-hidden rounded border bg-secondary-50 transition ${
                index === activeIndex
                  ? 'border-primary-500 ring-2 ring-primary-100'
                  : 'border-secondary-200 hover:border-secondary-400'
              }`}
              aria-label={`View product image ${index + 1}`}
            >
              <img
                src={image}
                alt={`${alt} view ${index + 1}`}
                className="h-full w-full object-contain"
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
