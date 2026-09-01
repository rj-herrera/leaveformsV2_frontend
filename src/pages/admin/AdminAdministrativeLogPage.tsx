import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Search } from 'lucide-react'
import { ClearFiltersButton } from '../../components/ui/EmptyState'
import { FilterSelect } from '../../components/ui/FilterSelect'
import { MonthYearPickerField } from '../../components/ui/form/MonthYearPickerField'
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
  TABLE_SEARCH_INPUT_BASE_CLASS,
  APPROVALS_TABLE_ROW_HEIGHT,
  APPROVALS_TABLE_ROW_HEIGHT_CLASS,
} from '../../components/ui/tableStyles'
import { useAdminActivities } from '../../hooks/api/useAdminActivities'
import { useAdminGroups } from '../../hooks/api/useAdminGroups'
import { useContentSizedTableRefs } from '../../hooks/useContentSizedTableRefs'
import { formatDateTime } from '../../utils/leaveDisplay'
import {
  LEAVE_TYPE_FILTER_OPTIONS,
  type LeaveTypeFilter,
} from '../../utils/leaveFiling'

type GroupFilter = 'ALL' | string
type DateSort = 'desc' | 'asc'

/** Shared height for all filter bar controls so they align visually. */
const FILTER_H = 'h-[2.125rem]'
const PAGE_SIZE_DEBOUNCE_MS = 150
const SEARCH_DEBOUNCE_MS = 300

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(id)
  }, [value, delayMs])

  return debounced
}

export function AdminAdministrativeLogPage() {
  const {
    availableSlotRef,
    sectionHeaderRef,
    paginationRef,
    tableAreaRef,
    pageSize: measuredPageSize,
  } = useContentSizedTableRefs({ fallbackRowHeight: APPROVALS_TABLE_ROW_HEIGHT })
  const pageSize = useDebouncedValue(measuredPageSize, PAGE_SIZE_DEBOUNCE_MS)
  const prevPageSizeRef = useRef<number | null>(null)

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS)
  const [leaveTypeFilter, setLeaveTypeFilter] =
    useState<LeaveTypeFilter>('ALL')
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('ALL')
  const [monthYear, setMonthYear] = useState('')
  const [dateSort, setDateSort] = useState<DateSort>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [awaitingListReset, setAwaitingListReset] = useState(false)
  const skipListResetSkeleton = useRef(true)

  const { data: adminGroups } = useAdminGroups()

  const groupId = groupFilter !== 'ALL' ? Number(groupFilter) : undefined

  const listParams = useMemo(
    () => ({
      q: debouncedSearch.length > 0 ? debouncedSearch : undefined,
      group_id:
        groupId != null && Number.isInteger(groupId) && groupId > 0
          ? groupId
          : undefined,
      code: leaveTypeFilter === 'ALL' ? undefined : leaveTypeFilter,
      month: monthYear.length > 0 ? monthYear : undefined,
      sort: dateSort,
      page: currentPage,
      per_page: pageSize,
    }),
    [
      debouncedSearch,
      groupId,
      leaveTypeFilter,
      monthYear,
      dateSort,
      currentPage,
      pageSize,
    ],
  )

  const { data, error, isLoading, isValidating } = useAdminActivities(listParams)

  const groupOptions = useMemo(
    () => [
      { value: 'ALL' as const, label: 'All Groups' },
      ...(adminGroups ?? []).map((group) => ({
        value: String(group.id),
        label: group.abbreviation ?? group.name ?? String(group.id),
      })),
    ],
    [adminGroups],
  )

  useEffect(() => {
    setCurrentPage(1)
    if (skipListResetSkeleton.current) {
      skipListResetSkeleton.current = false
      return
    }
    setAwaitingListReset(true)
  }, [debouncedSearch, leaveTypeFilter, groupFilter, monthYear, dateSort])

  useEffect(() => {
    const previous = prevPageSizeRef.current
    prevPageSizeRef.current = pageSize

    if (previous == null || previous === pageSize) return

    setCurrentPage((page) => {
      const firstVisibleIndex = (page - 1) * previous
      return Math.max(1, Math.floor(firstVisibleIndex / pageSize) + 1)
    })
  }, [pageSize])

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

  useEffect(() => {
    if (awaitingListReset) return
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [awaitingListReset, currentPage, totalPages])

  const showSkeleton = (isLoading && !data) || awaitingListReset
  const showStaleWhilePaging = Boolean(
    isValidating && data && !awaitingListReset,
  )

  const hasActiveFilters =
    search.trim().length > 0 ||
    leaveTypeFilter !== 'ALL' ||
    groupFilter !== 'ALL' ||
    monthYear.length > 0

  function clearFilters() {
    setSearch('')
    setLeaveTypeFilter('ALL')
    setGroupFilter('ALL')
    setMonthYear('')
  }

  return (
    <div className={`${TABLE_PAGE_ROOT} gap-4`}>
      <h1 className="shrink-0 text-h1 text-text-black">Administrative Log</h1>

      <div ref={availableSlotRef} className={TABLE_AVAILABLE_SLOT}>
        <section
          className={`${TABLE_CONTENT_SECTION} rounded-lg border border-border bg-surface`}
        >
          <div
            ref={sectionHeaderRef}
            className="flex shrink-0 flex-col gap-3 border-b border-border px-5 py-4"
          >
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
              <label className="relative block min-w-0 w-full flex-1">
                <span className="sr-only">Search employee name or number</span>
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-gray"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search employee name or number"
                  className={`${TABLE_SEARCH_INPUT_BASE_CLASS} ${FILTER_H}`}
                />
              </label>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <FilterSelect
                  label="Filter by group"
                  value={groupFilter}
                  onChange={setGroupFilter}
                  options={groupOptions}
                  fitContent
                  selectHeight={FILTER_H}
                />
                <FilterSelect
                  label="Filter by leave type"
                  value={leaveTypeFilter}
                  onChange={(value) =>
                    setLeaveTypeFilter(value as LeaveTypeFilter)
                  }
                  options={LEAVE_TYPE_FILTER_OPTIONS}
                  fitContent
                  selectHeight={FILTER_H}
                />
                <MonthYearPickerField
                  label="Filter by month and year"
                  value={monthYear}
                  onChange={setMonthYear}
                  emptyLabel="All Months"
                  allowClear
                  showLabel={false}
                  controlHeight={FILTER_H}
                />
              </div>
            </div>
          </div>

          <div ref={tableAreaRef} className={TABLE_CONTENT_AREA}>
            <table
              className={[
                'w-full min-w-[900px] table-fixed text-left',
                showStaleWhilePaging ? 'opacity-80' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <colgroup>
                <col className="w-[16%]" />
                <col className="w-[22%]" />
                <col className="w-[18%]" />
                <col className="w-[16%]" />
                <col className="w-[12%]" />
                <col className="w-[16%]" />
              </colgroup>
              <thead>
                <tr className="h-11 border-b border-border bg-surface-muted text-small text-text-gray">
                  <th className="px-5 py-3 font-bold uppercase tracking-wide">
                    <div className="flex items-center gap-1.5">
                      <span>Date</span>
                      <button
                        type="button"
                        onClick={() =>
                          setDateSort((sort) =>
                            sort === 'desc' ? 'asc' : 'desc',
                          )
                        }
                        className="inline-flex rounded p-0.5 text-text-gray transition-colors hover:bg-background hover:text-text-black"
                        aria-label={`Sort date ${dateSort === 'desc' ? 'ascending' : 'descending'}`}
                      >
                        {dateSort === 'desc' ? (
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
                    Performed By
                  </th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wide">
                    Employee No.
                  </th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wide">
                    Employee Name
                  </th>
                </tr>
              </thead>
              <tbody>
                {showSkeleton ? (
                  <TableBodySkeleton
                    rows={pageSize}
                    cols={6}
                    rowClassName={APPROVALS_TABLE_ROW_HEIGHT_CLASS}
                  />
                ) : error && !data ? (
                  <TableEmptyRow
                    colSpan={6}
                    pageSize={pageSize}
                    rowHeight={APPROVALS_TABLE_ROW_HEIGHT}
                    variant="no-data"
                    message="Could not load administrative log. Try again."
                  />
                ) : rows.length === 0 ? (
                  <TableEmptyRow
                    colSpan={6}
                    pageSize={pageSize}
                    rowHeight={APPROVALS_TABLE_ROW_HEIGHT}
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
                    const performedBy = entry.performed_by.name ?? '—'
                    const employeeNumber =
                      entry.employee?.employee_number ?? '—'
                    const employeeName = entry.employee?.name ?? '—'
                    return (
                      <tr
                        key={entry.id}
                        className={`${APPROVALS_TABLE_ROW_HEIGHT_CLASS} ${TABLE_BODY_ROW_BORDER_CLASS}`}
                      >
                        <td className="whitespace-nowrap px-5 text-body text-text-black">
                          {formatDateTime(entry.timestamp)}
                        </td>
                        <td
                          className="truncate px-5 text-body text-text-black"
                          title={entry.activity}
                        >
                          {entry.activity}
                        </td>
                        <td
                          className="truncate px-5 text-body text-text-black"
                          title={leaveTypeName !== '—' ? leaveTypeName : undefined}
                        >
                          {leaveTypeName}
                        </td>
                        <td
                          className="truncate px-5 text-body text-text-black"
                          title={performedBy !== '—' ? performedBy : undefined}
                        >
                          {performedBy}
                        </td>
                        <td className="px-5 text-body text-text-black">
                          {employeeNumber}
                        </td>
                        <td
                          className="truncate px-5 text-body text-text-black"
                          title={employeeName !== '—' ? employeeName : undefined}
                        >
                          {employeeName}
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
