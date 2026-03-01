'use client'

import { useCompare, type CompareProduct } from '@/contexts/CompareContext'
import Link from 'next/link'

export function CompareFloatingBar() {
  const { compareItems, clearCompare, setCompareOpen, isCompareOpen } = useCompare()

  if (compareItems.length === 0) return null

  return (
    <>
      {/* Floating bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-secondary-200 bg-white shadow-lg">
        <div className="container-main flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-secondary-800">
              {compareItems.length} product{compareItems.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              {compareItems.map((item) => (
                <div key={item.id} className="flex items-center gap-1.5 rounded-full bg-secondary-100 px-2.5 py-1 text-xs text-secondary-700">
                  <span className="max-w-[120px] truncate">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearCompare}
              className="btn-secondary px-4 py-1.5 text-xs"
            >
              Clear
            </button>
            <button
              onClick={() => setCompareOpen(true)}
              disabled={compareItems.length < 2}
              className="btn-primary px-4 py-1.5 text-xs disabled:opacity-50"
            >
              Compare ({compareItems.length})
            </button>
          </div>
        </div>
      </div>

      {/* Comparison modal */}
      {isCompareOpen && (
        <CompareModal />
      )}
    </>
  )
}

function CompareModal() {
  const { compareItems, removeFromCompare, setCompareOpen } = useCompare()

  // Collect all unique spec labels
  const allSpecLabels = new Set<string>()
  for (const item of compareItems) {
    if (item.specs) {
      for (const spec of item.specs) {
        allSpecLabels.add(spec.label)
      }
    }
  }
  const specLabels = Array.from(allSpecLabels)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-secondary-200 bg-white px-6 py-4">
          <h2 className="text-lg font-bold text-secondary-900">Compare Products</h2>
          <button
            onClick={() => setCompareOpen(false)}
            className="rounded-lg p-2 text-secondary-400 hover:bg-secondary-50 hover:text-secondary-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Comparison table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr>
                <th className="w-[140px] border-b border-secondary-200 bg-secondary-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500">
                  &nbsp;
                </th>
                {compareItems.map((item) => (
                  <th key={item.id} className="border-b border-secondary-200 bg-secondary-50 px-4 py-3 text-center">
                    <button
                      onClick={() => removeFromCompare(item.id)}
                      className="mb-2 text-xs text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Image */}
              <tr>
                <td className="border-b border-secondary-100 px-4 py-3 text-xs font-medium text-secondary-500">Image</td>
                {compareItems.map((item) => (
                  <td key={item.id} className="border-b border-secondary-100 px-4 py-3 text-center">
                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded bg-secondary-50">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-full w-full object-contain" />
                      ) : (
                        <svg className="h-10 w-10 text-secondary-200" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
              {/* Name */}
              <tr>
                <td className="border-b border-secondary-100 px-4 py-3 text-xs font-medium text-secondary-500">Name</td>
                {compareItems.map((item) => (
                  <td key={item.id} className="border-b border-secondary-100 px-4 py-3 text-center">
                    <Link
                      href={`/product/${item.categorySlug}/${item.slug}`}
                      className="text-sm font-medium text-primary-700 hover:underline"
                    >
                      {item.name}
                    </Link>
                  </td>
                ))}
              </tr>
              {/* SKU */}
              <tr>
                <td className="border-b border-secondary-100 px-4 py-3 text-xs font-medium text-secondary-500">SKU</td>
                {compareItems.map((item) => (
                  <td key={item.id} className="border-b border-secondary-100 px-4 py-3 text-center text-sm text-secondary-700">
                    {item.sku}
                  </td>
                ))}
              </tr>
              {/* Brand */}
              <tr>
                <td className="border-b border-secondary-100 px-4 py-3 text-xs font-medium text-secondary-500">Brand</td>
                {compareItems.map((item) => (
                  <td key={item.id} className="border-b border-secondary-100 px-4 py-3 text-center text-sm text-secondary-700">
                    {item.brand}
                  </td>
                ))}
              </tr>
              {/* Price */}
              <tr>
                <td className="border-b border-secondary-100 px-4 py-3 text-xs font-medium text-secondary-500">Price</td>
                {compareItems.map((item) => (
                  <td key={item.id} className="border-b border-secondary-100 px-4 py-3 text-center">
                    {item.price ? (
                      <span className="text-sm font-semibold text-secondary-900">
                        ${item.price.toFixed(2)}
                        {item.priceUnit && <span className="text-xs font-normal text-secondary-500"> /{item.priceUnit}</span>}
                      </span>
                    ) : (
                      <span className="text-sm text-amber-600">Contact for Price</span>
                    )}
                  </td>
                ))}
              </tr>
              {/* Availability */}
              <tr>
                <td className="border-b border-secondary-100 px-4 py-3 text-xs font-medium text-secondary-500">Availability</td>
                {compareItems.map((item) => (
                  <td key={item.id} className="border-b border-secondary-100 px-4 py-3 text-center text-sm text-secondary-700">
                    {item.availability === 'in-stock' ? (
                      <span className="badge-success">In Stock</span>
                    ) : item.availability === 'made-to-order' ? (
                      <span className="badge-warning">Made to Order</span>
                    ) : (
                      <span className="badge-info">Contact</span>
                    )}
                  </td>
                ))}
              </tr>
              {/* Specifications */}
              {specLabels.map((label) => (
                <tr key={label}>
                  <td className="border-b border-secondary-100 px-4 py-3 text-xs font-medium text-secondary-500">{label}</td>
                  {compareItems.map((item) => {
                    const spec = item.specs?.find(s => s.label === label)
                    return (
                      <td key={item.id} className="border-b border-secondary-100 px-4 py-3 text-center text-sm text-secondary-700">
                        {spec?.value || '-'}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// Checkbox for product cards
export function CompareCheckbox({ product }: { product: CompareProduct }) {
  const { addToCompare, removeFromCompare, isInCompare, compareItems } = useCompare()
  const checked = isInCompare(product.id)
  const disabled = !checked && compareItems.length >= 4

  return (
    <label
      className={`flex items-center gap-1.5 text-xs ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      title={disabled ? 'Maximum 4 products for comparison' : checked ? 'Remove from comparison' : 'Add to comparison'}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={() => {
          if (checked) removeFromCompare(product.id)
          else addToCompare(product)
        }}
        className="h-3.5 w-3.5 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
      />
      <span className="text-secondary-500">Compare</span>
    </label>
  )
}
