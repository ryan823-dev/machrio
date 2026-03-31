import Link from 'next/link'

interface PaginationProps {
  currentPage: number
  totalPages: number
  basePath: string
}

export function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  // 生成页码数组
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    const showEllipsisStart = currentPage > 3
    const showEllipsisEnd = currentPage < totalPages - 2

    if (totalPages <= 7) {
      // 如果总页数小于等于7，显示所有页码
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // 总是显示第一页
      pages.push(1)

      if (showEllipsisStart) {
        pages.push('ellipsis')
      }

      // 显示当前页附近的页码
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i)
        }
      }

      if (showEllipsisEnd) {
        pages.push('ellipsis')
      }

      // 总是显示最后一页
      if (!pages.includes(totalPages)) {
        pages.push(totalPages)
      }
    }

    return pages
  }

  const buildPageUrl = (page: number) => {
    return `${basePath}?page=${page}`
  }

  if (totalPages <= 1) return null

  const pages = getPageNumbers()

  return (
    <nav className="mt-8 flex items-center justify-center gap-1" aria-label="Pagination">
      {/* 上一页按钮 */}
      {currentPage > 1 ? (
        <Link
          href={buildPageUrl(currentPage - 1)}
          className="flex h-10 items-center justify-center rounded-lg border border-secondary-200 bg-white px-3 text-sm font-medium text-secondary-700 hover:bg-secondary-50"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="ml-1 hidden sm:inline">Previous</span>
        </Link>
      ) : (
        <span className="flex h-10 items-center justify-center rounded-lg border border-secondary-100 bg-secondary-50 px-3 text-sm font-medium text-secondary-400">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="ml-1 hidden sm:inline">Previous</span>
        </span>
      )}

      {/* 页码 */}
      <div className="hidden sm:flex items-center gap-1">
        {pages.map((page, idx) => {
          if (page === 'ellipsis') {
            return (
              <span key={`ellipsis-${idx}`} className="px-2 text-secondary-400">
                ...
              </span>
            )
          }

          const isActive = page === currentPage

          return isActive ? (
            <span
              key={page}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-sm font-semibold text-white"
              aria-current="page"
            >
              {page}
            </span>
          ) : (
            <Link
              key={page}
              href={buildPageUrl(page)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-secondary-200 bg-white text-sm font-medium text-secondary-700 hover:bg-secondary-50"
            >
              {page}
            </Link>
          )
        })}
      </div>

      {/* 移动端页码显示 */}
      <span className="sm:hidden px-3 text-sm text-secondary-600">
        Page {currentPage} of {totalPages}
      </span>

      {/* 下一页按钮 */}
      {currentPage < totalPages ? (
        <Link
          href={buildPageUrl(currentPage + 1)}
          className="flex h-10 items-center justify-center rounded-lg border border-secondary-200 bg-white px-3 text-sm font-medium text-secondary-700 hover:bg-secondary-50"
        >
          <span className="mr-1 hidden sm:inline">Next</span>
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      ) : (
        <span className="flex h-10 items-center justify-center rounded-lg border border-secondary-100 bg-secondary-50 px-3 text-sm font-medium text-secondary-400">
          <span className="mr-1 hidden sm:inline">Next</span>
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      )}
    </nav>
  )
}