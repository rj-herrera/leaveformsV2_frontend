import { useLayoutEffect, useState, type RefObject } from 'react'

const FALLBACK_HEADER_HEIGHT = 44
const TABLE_ROW_HEIGHT = 46
/** Subpixel / border rounding slack so the last row is never clipped. */
const TABLE_FIT_SLACK = 1
const MIN_PAGE_SIZE = 3
const DEFAULT_PAGE_SIZE = 5
/** How often to detect a late-mounted / replaced scroll container. */
const ATTACH_POLL_MS = 100

function measureElementHeight(element: Element | null | undefined): number {
  if (!element) return 0
  return element.getBoundingClientRect().height
}

function isEmptyStateRow(row: Element): boolean {
  return Boolean(row.querySelector('td[colspan]'))
}

/**
 * How many full body rows fit in the scroll container without clipping,
 * accounting for sticky thead/tfoot when present.
 */
export function computePageSizeFromHeight(
  containerHeight: number,
  rowHeight: number,
  headerHeight: number,
  footerHeight: number = 0,
): number {
  if (containerHeight <= 0 || rowHeight <= 0) return MIN_PAGE_SIZE

  const budget = containerHeight - TABLE_FIT_SLACK
  let pageSize = MIN_PAGE_SIZE

  while (
    headerHeight + footerHeight + (pageSize + 1) * rowHeight <= budget
  ) {
    pageSize += 1
  }

  return pageSize
}

function resolveRowHeight(
  table: HTMLTableElement | null,
  fallbackRowHeight: number,
): number {
  const sampleRow = table
    ? Array.from(table.querySelectorAll('tbody tr')).find(
        (row) => !isEmptyStateRow(row),
      )
    : undefined

  const measured = measureElementHeight(sampleRow)
  return measured > 0 ? measured : fallbackRowHeight
}

/**
 * Fits as many full table rows as the scroll container can show.
 *
 * Handles containers that mount later (e.g. after "Generate Report") by
 * polling for ref attachment — a one-shot effect would miss them and leave
 * page size stuck at the default.
 */
export function usePageSizeFromHeight(
  containerRef: RefObject<HTMLElement | null>,
  rowHeight: number = TABLE_ROW_HEIGHT,
) {
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  useLayoutEffect(() => {
    let observed: HTMLElement | null = null
    let resizeObserver: ResizeObserver | null = null
    let mutationObserver: MutationObserver | null = null
    let measureFrameId = 0

    function teardownObservers() {
      resizeObserver?.disconnect()
      mutationObserver?.disconnect()
      resizeObserver = null
      mutationObserver = null
      observed = null
    }

    function updatePageSize() {
      const el = observed ?? containerRef.current
      if (!el || el.clientHeight <= 0) return

      const table = el.querySelector('table')
      const thead = table?.querySelector('thead')
      const tfoot = table?.querySelector('tfoot')

      const headerHeight = thead
        ? measureElementHeight(thead)
        : FALLBACK_HEADER_HEIGHT
      const footerHeight = measureElementHeight(tfoot)
      const effectiveRowHeight = resolveRowHeight(table, rowHeight)

      const nextPageSize = computePageSizeFromHeight(
        el.clientHeight,
        effectiveRowHeight,
        headerHeight,
        footerHeight,
      )

      setPageSize((prev) => (prev === nextPageSize ? prev : nextPageSize))
    }

    function scheduleUpdate() {
      cancelAnimationFrame(measureFrameId)
      measureFrameId = requestAnimationFrame(updatePageSize)
    }

    function attach(el: HTMLElement) {
      if (observed === el) {
        scheduleUpdate()
        return
      }

      teardownObservers()
      observed = el

      resizeObserver = new ResizeObserver(scheduleUpdate)
      resizeObserver.observe(el)

      mutationObserver = new MutationObserver(scheduleUpdate)
      mutationObserver.observe(el, { childList: true, subtree: true })

      scheduleUpdate()
    }

    function syncAttachment() {
      const el = containerRef.current
      if (el) {
        attach(el)
        return
      }
      if (observed) {
        teardownObservers()
      }
    }

    syncAttachment()
    const pollId = window.setInterval(syncAttachment, ATTACH_POLL_MS)

    return () => {
      window.clearInterval(pollId)
      cancelAnimationFrame(measureFrameId)
      teardownObservers()
    }
  }, [containerRef, rowHeight])

  return pageSize
}

export const TABLE_ROW_HEIGHT_CLASS = 'h-[46px]'

/** Taller rows for Leave Approvals (progress + stacked employee meta). */
export const APPROVALS_TABLE_ROW_HEIGHT = 56
export const APPROVALS_TABLE_ROW_HEIGHT_CLASS = 'h-[56px]'
