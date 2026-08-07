import { useLayoutEffect, useState, type RefObject } from 'react'
import { computePageSizeFromHeight } from './usePageSizeFromHeight'

/** Matches `TABLE_ROW_HEIGHT_CLASS` (`h-[50px]`) when no body row is measurable yet. */
const FALLBACK_ROW_HEIGHT = 50
const FALLBACK_THEAD_HEIGHT = 44
/** Matches Pagination outer padding + controls when not yet mounted / measurable. */
const FALLBACK_PAGINATION_HEIGHT = 72
const DEFAULT_PAGE_SIZE = 5
const SECTION_BORDER_Y = 2
const ATTACH_POLL_MS = 100

function measureHeight(element: Element | null | undefined): number {
  if (!element) return 0
  return element.getBoundingClientRect().height
}

function isEmptyStateRow(row: Element): boolean {
  return Boolean(row.querySelector('td[colspan]'))
}

export type ContentSizedTablePageSizeRefs = {
  /** Flex-1 viewport remainder used only to measure max capacity. */
  availableSlotRef: RefObject<HTMLElement | null>
  /** Table card header / filters bar (shrink-0). */
  sectionHeaderRef: RefObject<HTMLElement | null>
  /** Pagination footer wrapper (shrink-0); reserve height even when skeleton. */
  paginationRef: RefObject<HTMLElement | null>
  /** Wrapper around the `<table>` (content-sized, no overflow-y). */
  tableAreaRef: RefObject<HTMLElement | null>
}

export type ContentSizedTablePageSizeOptions = {
  fallbackRowHeight?: number
  fallbackTheadHeight?: number
  fallbackPaginationHeight?: number
  sectionBorderY?: number
}

/**
 * Pattern A: available viewport height caps max rows per page; the table still
 * shrinks to its rows (do not put flex-1 on the table area / card).
 */
export function useContentSizedTablePageSize(
  {
    availableSlotRef,
    sectionHeaderRef,
    paginationRef,
    tableAreaRef,
  }: ContentSizedTablePageSizeRefs,
  {
    fallbackRowHeight = FALLBACK_ROW_HEIGHT,
    fallbackTheadHeight = FALLBACK_THEAD_HEIGHT,
    fallbackPaginationHeight = FALLBACK_PAGINATION_HEIGHT,
    sectionBorderY = SECTION_BORDER_Y,
  }: ContentSizedTablePageSizeOptions = {},
) {
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  useLayoutEffect(() => {
    let measureFrameId = 0
    const observed: HTMLElement[] = []

    function updatePageSize() {
      const slot = availableSlotRef.current
      if (!slot || slot.clientHeight <= 0) return

      const sectionHeaderHeight = measureHeight(sectionHeaderRef.current)
      const paginationHeight =
        measureHeight(paginationRef.current) || fallbackPaginationHeight

      const tableBudget =
        slot.clientHeight -
        sectionHeaderHeight -
        paginationHeight -
        sectionBorderY

      const table = tableAreaRef.current?.querySelector('table') ?? null
      const thead = table?.querySelector('thead')
      const theadHeight = measureHeight(thead) || fallbackTheadHeight
      const tfootHeight = measureHeight(table?.querySelector('tfoot'))

      const sampleRow = table
        ? Array.from(table.querySelectorAll('tbody tr')).find(
            (row) => !isEmptyStateRow(row),
          )
        : undefined
      const rowHeight = measureHeight(sampleRow) || fallbackRowHeight

      const nextPageSize = computePageSizeFromHeight(
        tableBudget,
        rowHeight,
        theadHeight,
        tfootHeight,
      )

      setPageSize((prev) => (prev === nextPageSize ? prev : nextPageSize))
    }

    function scheduleUpdate() {
      cancelAnimationFrame(measureFrameId)
      measureFrameId = requestAnimationFrame(updatePageSize)
    }

    const resizeObserver = new ResizeObserver(scheduleUpdate)
    function observe(el: HTMLElement | null) {
      if (!el || observed.includes(el)) return
      observed.push(el)
      resizeObserver.observe(el)
    }

    function syncObservers() {
      observe(availableSlotRef.current)
      observe(sectionHeaderRef.current)
      observe(paginationRef.current)
      observe(tableAreaRef.current)
      scheduleUpdate()
    }

    syncObservers()
    const pollId = window.setInterval(syncObservers, ATTACH_POLL_MS)

    return () => {
      window.clearInterval(pollId)
      cancelAnimationFrame(measureFrameId)
      resizeObserver.disconnect()
    }
  }, [
    availableSlotRef,
    sectionHeaderRef,
    paginationRef,
    tableAreaRef,
    fallbackRowHeight,
    fallbackTheadHeight,
    fallbackPaginationHeight,
    sectionBorderY,
  ])

  return pageSize
}
