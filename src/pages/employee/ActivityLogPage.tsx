import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { ClearFiltersButton } from '../../components/ui/EmptyState'
import { FilterSelect } from '../../components/ui/FilterSelect'
import { Pagination } from '../../components/ui/Pagination'
import { TableBodySkeleton } from '../../components/ui/Skeleton'
import {
  TABLE_AVAILABLE_SLOT,
  TABLE_CONTENT_AREA,
  TABLE_CONTENT_SECTION,
  TABLE_PAGE_ROOT,
  TABLE_PAGINATION_PLACEHOLDER,
  TABLE_PAGINATION_WRAP,
} from '../../components/ui/tableLayout'
import { TableEmptyRow } from '../../components/ui/TableEmptyRow'
import {
  TABLE_BODY_ROW_BORDER_CLASS,
  TABLE_ROW_HEIGHT,
  TABLE_ROW_HEIGHT_CLASS,
} from '../../components/ui/tableStyles'
import { useActivities } from '../../hooks/api/useActivities'
import { useContentSizedTableRefs } from '../../hooks/useContentSizedTableRefs'
import { formatDateTime } from '../../utils/leaveDisplay'
import {
  LEAVE_TYPE_FILTER_OPTIONS,
  type LeaveTypeFilter,
} from '../../utils/leaveFiling'

type TimestampSort = 'desc' | 'asc'

const PAGE_SIZE_DEBOUNCE_MS = 150

/** Debounce layout-derived page size so resize/mutation storms don't spam the API. */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(id)
  }, [value, delayMs])

  return debounced
}

export function ActivityLogPage() {
  const {
    availableSlotRef,
    sectionHeaderRef,
    paginationRef,
    tableAreaRef,
    pageSize: measuredPageSize,
  } = useContentSizedTableRefs()
  const pageSize = useDebouncedValue(measuredPageSize, PAGE_SIZE_DEBOUNCE_MS)
  const prevPageSizeRef = useRef<number | null>(null)

  const [leaveTypeFilter, setLeaveTypeFilter] =
    useState<LeaveTypeFilter>('ALL')
  const [timestampSort, setTimestampSort] = useState<TimestampSort>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  /**
   * Hide stale keepPreviousData while filter/sort refetch runs.
   * Page flips still keep the previous page visible.
   */
  const [awaitingListReset, setAwaitingListReset] = useState(false)
  const skipListResetSkeleton = useRef(true)

  // Filter or sort: reset to page 1; skeleton until the new list arrives.
  useEffect(() => {
    setCurrentPage(1)
    if (skipListResetSkeleton.current) {
      skipListResetSkeleton.current = false
      return
    }
    setAwaitingListReset(true)
  }, [leaveTypeFilter, timestampSort])

  // Page-size change: keep approximate scroll position (first visible index).
  useEffect(() => {
    const previous = prevPageSizeRef.current
    prevPageSizeRef.current = pageSize

    if (previous == null || previous === pageSize) return

    setCurrentPage((page) => {
      const firstVisibleIndex = (page - 1) * previous
      return Math.max(1, Math.floor(firstVisibleIndex / pageSize) + 1)
    })
  }, [pageSize])

  const listParams = useMemo(
    () => ({
      code: leaveTypeFilter === 'ALL' ? undefined : leaveTypeFilter,
      sort: timestampSort,
      page: currentPage,
      per_page: pageSize,
    }),
    [leaveTypeFilter, timestampSort, currentPage, pageSize],
  )

  const { data, error, isLoading, isValidating } = useActivities(listParams)

  useEffect(() => {
    if (!awaitingListReset) return
    if (!isValidating) {
      setAwaitingListReset(false)
    }
  }, [awaitingListReset, isValidating, data, error])

  const rows = awaitingListReset ? [] : (data?.data ?? [])
  const totalItems = awaitingListReset ? 0 : (data?.meta?.total ?? 0)
  const totalPages = awaitingListReset
    ? 1
    : Math.max(1, data?.meta?.last_page ?? 1)

  // Clamp if the API reports fewer pages than our current page (e.g. after filter).
  useEffect(() => {
    if (awaitingListReset) return
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [awaitingListReset, currentPage, totalPages])

  // Skeleton on first load and when filter/sort changes; keep prior rows on page flips.
  const showSkeleton = (isLoading && !data) || awaitingListReset
  const showStaleWhilePaging = Boolean(
    isValidating && data && !awaitingListReset,
  )

  const hasActiveFilters = leaveTypeFilter !== 'ALL'

  function clearFilters() {
    setLeaveTypeFilter('ALL')
  }

  return (
    <div className={`${TABLE_PAGE_ROOT} gap-4`}>
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-h1 text-text-black">Activity Log</h1>
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            label="Filter by leave type"
            value={leaveTypeFilter}
            onChange={(value) => setLeaveTypeFilter(value as LeaveTypeFilter)}
            options={LEAVE_TYPE_FILTER_OPTIONS}
          />
        </div>
      </div>

      <div ref={availableSlotRef} className={TABLE_AVAILABLE_SLOT}>
        <section
          className={`${TABLE_CONTENT_SECTION} rounded-lg border border-border bg-surface`}
        >
          {/* No in-card header; ref unused so measured chrome height is 0. */}
          <div ref={sectionHeaderRef} className="hidden" aria-hidden="true" />

          <div ref={tableAreaRef} className={TABLE_CONTENT_AREA}>
            <table
              className={[
                'w-full min-w-[880px] table-fixed text-left',
                showStaleWhilePaging ? 'opacity-80' : '',
              ].join(' ')}
            >
              <colgroup>
                <col className="w-[16%]" />
                <col className="w-[20%]" />
                <col className="w-[16%]" />
                <col className="w-[18%]" />
                <col className="w-[14%]" />
                <col className="w-[16%]" />
              </colgroup>
              <thead>
                <tr className="h-11 bg-surface-muted border-b border-border text-small text-text-gray">
                  <th className="px-5 py-3 font-bold uppercase tracking-wide">
                    <div className="flex items-center gap-1.5">
                      <span>Timestamp</span>
                      <button
                        type="button"
                        onClick={() =>
                          setTimestampSort((sort) =>
                            sort === 'desc' ? 'asc' : 'desc',
                          )
                        }
                        className="inline-flex rounded p-0.5 text-text-gray transition-colors hover:bg-background hover:text-text-black"
                        aria-label={`Sort timestamp ${timestampSort === 'desc' ? 'ascending' : 'descending'}`}
                      >
                        {timestampSort === 'desc' ? (
                          <ArrowDown className="size-3.5" aria-hidden="true" />
                        ) : (
                          <ArrowUp className="size-3.5" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wide">
                    Activity
                  </th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wide">
                    Leave Type
                  </th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wide">
                    Balance Impact
                  </th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wide">
                    Performed By
                  </th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wide">
                    Remarks
                  </th>
                </tr>
              </thead>
              <tbody>
                {showSkeleton ? (
                  <TableBodySkeleton rows={pageSize} cols={6} />
                ) : error && !data ? (
                  <tr className={TABLE_ROW_HEIGHT_CLASS}>
                    <td
                      colSpan={6}
                      className="px-5 text-center text-body text-status-rejected"
                    >
                      Unable to load activity. Please try again.
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <TableEmptyRow
                    colSpan={6}
                    pageSize={pageSize}
                    rowHeight={TABLE_ROW_HEIGHT}
                    variant={hasActiveFilters ? 'no-results' : 'no-data'}
                    action={
                      hasActiveFilters ? (
                        <ClearFiltersButton onClick={clearFilters} />
                      ) : undefined
                    }
                  />
                ) : (
                  rows.map((entry) => {
                    const leaveTypeName = entry.leave_type?.name ?? '—'
                    const performedBy = entry.performed_by.name?.trim() || '—'
                    return (
                      <tr
                        key={entry.id}
                        className={`${TABLE_BODY_ROW_BORDER_CLASS} text-body text-text-black ${TABLE_ROW_HEIGHT_CLASS}`}
                      >
                        <td className="px-5 whitespace-nowrap">
                          {formatDateTime(entry.timestamp)}
                        </td>
                        <td className="truncate px-5" title={entry.activity}>
                          {entry.activity}
                        </td>
                        <td className="truncate px-5" title={leaveTypeName}>
                          {leaveTypeName}
                        </td>
                        <td
                          className="truncate px-5"
                          title={entry.balance_impact}
                        >
                          {entry.balance_impact}
                        </td>
                        <td className="truncate px-5" title={performedBy}>
                          {performedBy}
                        </td>
                        <td
                          className="truncate px-5 text-text-gray"
                          title={entry.remarks ?? undefined}
                        >
                          {entry.remarks?.trim() || '—'}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div ref={paginationRef} className={TABLE_PAGINATION_WRAP}>
            {!showSkeleton ? (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
              />
            ) : (
              <div className={TABLE_PAGINATION_PLACEHOLDER} aria-hidden="true">
                <p className="text-small text-transparent">Showing 0 results</p>
                <div className="h-9.5" />
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
