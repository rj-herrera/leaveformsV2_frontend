import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './Button'

type PaginationProps = {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: PaginationProps) {
  const rangeStart =
    totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const rangeEnd = Math.min(currentPage * pageSize, totalItems)

  return (
    <div className="flex shrink-0 flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-small text-text-gray">
        {totalItems === 0
          ? 'Showing 0 results'
          : `Showing ${rangeStart}–${rangeEnd} of ${totalItems}`}
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="size-9.5 p-0"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Button>

        <span className="text-small text-text-gray px-1">
          Page {currentPage} of {totalPages}
        </span>

        <Button
          variant="ghost"
          size="sm"
          className="size-9.5 p-0"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
