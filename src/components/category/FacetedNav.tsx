'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'

interface FacetOption {
  value: string
  label: string
  count: number
}

interface FacetGroup {
  name: string
  label: string
  expanded: boolean
  options: FacetOption[]
}

interface FacetedNavProps {
  facets: FacetGroup[]
  totalResults: number
}

export function FacetedNav({ facets, totalResults }: FacetedNavProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const getActiveValues = useCallback(
    (facetName: string): string[] => {
      const val = searchParams.get(facetName)
      return val ? val.split(',') : []
    },
    [searchParams],
  )

  const toggleFilter = useCallback(
    (facetName: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      const current = getActiveValues(facetName)
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]

      if (updated.length > 0) {
        params.set(facetName, updated.join(','))
      } else {
        params.delete(facetName)
      }
      // Reset to page 1 when changing filters
      params.delete('page')

      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams, getActiveValues],
  )

  const clearAll = useCallback(() => {
    router.push(pathname, { scroll: false })
  }, [router, pathname])

  const activeFilterCount = facets.reduce(
    (acc, f) => acc + getActiveValues(f.name).length,
    0,
  )

  return (
    <aside className="w-full flex-shrink-0 md:w-64">
      {/* Results count & clear */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-secondary-800">
          {totalResults.toLocaleString()} Results
        </span>
        {activeFilterCount > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-primary-600 hover:text-primary-800 hover:underline"
          >
            Clear all ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {facets.map((facet) =>
            getActiveValues(facet.name).map((val) => (
              <button
                key={`${facet.name}-${val}`}
                onClick={() => toggleFilter(facet.name, val)}
                className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs text-primary-700"
              >
                {val}
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )),
          )}
        </div>
      )}

      {/* Filter groups */}
      {facets.map((facet) => (
        <FilterGroup
          key={facet.name}
          facet={facet}
          activeValues={getActiveValues(facet.name)}
          onToggle={(val) => toggleFilter(facet.name, val)}
        />
      ))}
    </aside>
  )
}

function FilterGroup({
  facet,
  activeValues,
  onToggle,
}: {
  facet: FacetGroup
  activeValues: string[]
  onToggle: (value: string) => void
}) {
  return (
    <details open={facet.expanded} className="mb-3 border-b border-secondary-100 pb-3">
      <summary className="flex cursor-pointer items-center justify-between py-2 text-sm font-semibold text-secondary-800 hover:text-primary-700">
        {facet.label}
        {activeValues.length > 0 && (
          <span className="ml-2 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary-100 px-1.5 text-[10px] font-bold text-primary-700">
            {activeValues.length}
          </span>
        )}
      </summary>
      <div className="mt-1 space-y-1">
        {facet.options.map((option) => {
          const isActive = activeValues.includes(option.value)
          return (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-secondary-50"
            >
              <input
                type="checkbox"
                checked={isActive}
                onChange={() => onToggle(option.value)}
                className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
              />
              <span className={isActive ? 'font-medium text-primary-700' : 'text-secondary-700'}>
                {option.label}
              </span>
              <span className="ml-auto text-xs text-secondary-400">({option.count})</span>
            </label>
          )
        })}
      </div>
    </details>
  )
}
