import { useEffect, useState, type RefObject } from 'react'

const TABLE_HEADER_HEIGHT = 44
const TABLE_ROW_HEIGHT = 46
const MIN_PAGE_SIZE = 3
const DEFAULT_PAGE_SIZE = 5

export function usePageSizeFromHeight(
  containerRef: RefObject<HTMLElement | null>,
  rowHeight: number = TABLE_ROW_HEIGHT,
) {
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    function updatePageSize() {
      const el = containerRef.current
      if (!el) return

      const availableHeight = el.clientHeight - TABLE_HEADER_HEIGHT
      const nextPageSize = Math.max(
        MIN_PAGE_SIZE,
        Math.floor(availableHeight / rowHeight),
      )
      setPageSize(nextPageSize)
    }

    updatePageSize()

    const observer = new ResizeObserver(updatePageSize)
    observer.observe(container)

    return () => observer.disconnect()
  }, [containerRef, rowHeight])

  return pageSize
}

export const TABLE_ROW_HEIGHT_CLASS = 'h-[46px]'

/** Taller rows for Leave Approvals (progress + stacked employee meta). */
export const APPROVALS_TABLE_ROW_HEIGHT = 56
export const APPROVALS_TABLE_ROW_HEIGHT_CLASS = 'h-[56px]'
