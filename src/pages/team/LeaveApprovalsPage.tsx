import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import type { ApprovalsListStatus } from '../../api/approvals'
import type { ApprovalInboxRow } from '../../api/types'
import { ClearFiltersButton } from '../../components/ui/EmptyState'
import { FilterSelect } from '../../components/ui/FilterSelect'
import { ListTabButton } from '../../components/ui/ListTabButton'
import { Pagination } from '../../components/ui/Pagination'
import { TableBodySkeleton } from '../../components/ui/Skeleton'
import { SortableHeader } from '../../components/ui/SortableHeader'
import { StatusBadge } from '../../components/ui/StatusBadge'
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
  APPROVALS_TABLE_ROW_HEIGHT,
  APPROVALS_TABLE_ROW_HEIGHT_CLASS,
  TABLE_ACTION_BUTTON_CLASS,
  TABLE_BODY_ROW_BORDER_CLASS,
  TABLE_SEARCH_INPUT_CLASS,
} from '../../components/ui/tableStyles'
import type { LeaveRequestStatus } from '../../constants/leaveStatus'
import {
  SICK_LEAVE_THEME,
  VACATION_LEAVE_THEME,
} from '../../constants/leaveTypeTheme'
import { useApprovals } from '../../hooks/api/useApprovals'
import { usePendingApprovals } from '../../hooks/api/usePendingApprovals'
import { useContentSizedTableRefs } from '../../hooks/useContentSizedTableRefs'
import { usePagination } from '../../hooks/usePagination'
import {
  formatDurationDays,
  formatLeavePeriod,
  formatShortDate,
  mapApiLeaveStatusToUi,
} from '../../utils/leaveDisplay'
import {
  LIST_TAB_QUERY_KEY,
  parseListTab,
  type ListReturnState,
  type ListTab,
} from '../../utils/listTab'
import { compareEmployeeNumber } from '../../utils/sort'

type LeaveTypeFilter = 'ALL' | 'VL' | 'SL'
type GroupFilter = 'ALL' | string
type SortKey = 'filedOn' | 'period' | 'employeeNumber'
type SortDir = 'desc' | 'asc'
type ApprovalsStatusFilter =
  | 'ALL'
  | 'APPROVED'
  | 'REJECTED'
  | 'PENDING_CONVERSION'
  | 'CONVERTED'

type ApprovalRowView = {
  id: number
  employeeNumber: string
  requesterName: string
  groupLabel: string
  leaveType: string
  leaveTypeCode: string
  period: string
  duration: string
  filedOnDate: string
  filedOnLabel: string
  status: LeaveRequestStatus
}

const LEAVE_TYPE_FILTER_OPTIONS = [
  { value: 'ALL' as const, label: 'All Leave Types' },
  { value: 'VL' as const, label: VACATION_LEAVE_THEME.label },
  { value: 'SL' as const, label: SICK_LEAVE_THEME.label },
]

const APPROVALS_STATUS_FILTER_OPTIONS: {
  value: ApprovalsStatusFilter
  label: string
}[] = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'PENDING_CONVERSION', label: 'Pending conversion' },
  { value: 'CONVERTED', label: 'Converted to SL' },
]

const PAGE_SIZE_DEBOUNCE_MS = 150

function toApprovalRowView(row: ApprovalInboxRow): ApprovalRowView {
  const employee = row.employee
  return {
    id: row.id,
    employeeNumber: employee?.employee_number ?? '—',
    requesterName: employee?.name?.trim() || '—',
    groupLabel:
      employee?.group?.abbreviation?.trim() ||
      employee?.group?.name?.trim() ||
      '—',
    leaveType: row.leave_type.name,
    leaveTypeCode: row.leave_type.code,
    period: formatLeavePeriod(row.start_date, row.end_date),
    duration: formatDurationDays(row.duration),
    filedOnDate: row.created_at ?? '',
    filedOnLabel: formatShortDate(row.created_at),
    status: mapApiLeaveStatusToUi(row.status),
  }
}

function toApiStatus(
  filter: ApprovalsStatusFilter,
): ApprovalsListStatus | undefined {
  switch (filter) {
    case 'APPROVED':
      return 'confirmed'
    case 'REJECTED':
      return 'rejected'
    case 'PENDING_CONVERSION':
      return 'pending_conversion'
    case 'CONVERTED':
      return 'converted_to_sl'
    default:
      return undefined
  }
}

function matchesRowFilters(
  item: ApprovalRowView,
  query: string,
  groupFilter: GroupFilter,
  leaveTypeFilter: LeaveTypeFilter,
): boolean {
  const matchesSearch =
    query.length === 0 ||
    item.requesterName.toLowerCase().includes(query) ||
    item.employeeNumber.toLowerCase().includes(query)

  const matchesGroup =
    groupFilter === 'ALL' || item.groupLabel === groupFilter

  const matchesLeaveType =
    leaveTypeFilter === 'ALL' || item.leaveTypeCode === leaveTypeFilter

  return matchesSearch && matchesGroup && matchesLeaveType
}

function sortRows(
  items: ApprovalRowView[],
  sortKey: SortKey,
  sortDir: SortDir,
): ApprovalRowView[] {
  return [...items].sort((a, b) => {
    const cmp =
      sortKey === 'filedOn'
        ? a.filedOnDate.localeCompare(b.filedOnDate)
        : sortKey === 'period'
          ? a.period.localeCompare(b.period)
          : compareEmployeeNumber(a.employeeNumber, b.employeeNumber)
    return sortDir === 'asc' ? cmp : -cmp
  })
}

/** Debounce layout-derived page size so resize storms don't spam the API. */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(id)
  }, [value, delayMs])

  return debounced
}

export function LeaveApprovalsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const {
    availableSlotRef,
    sectionHeaderRef,
    paginationRef,
    tableAreaRef,
    pageSize: measuredPageSize,
  } = useContentSizedTableRefs({ fallbackRowHeight: APPROVALS_TABLE_ROW_HEIGHT })
  const pageSize = useDebouncedValue(measuredPageSize, PAGE_SIZE_DEBOUNCE_MS)
  const prevPageSizeRef = useRef<number | null>(null)

  const tab = parseListTab(searchParams.get(LIST_TAB_QUERY_KEY))
  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('ALL')
  const [leaveTypeFilter, setLeaveTypeFilter] =
    useState<LeaveTypeFilter>('ALL')
  const [statusFilter, setStatusFilter] = useState<ApprovalsStatusFilter>('ALL')
  const [sortKey, setSortKey] = useState<SortKey>('filedOn')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  /** All-tab server page; pending uses client `usePagination`. */
  const [allPage, setAllPage] = useState(1)
  const [awaitingAllReset, setAwaitingAllReset] = useState(false)
  const skipAllResetSkeleton = useRef(true)

  const {
    data: pendingData,
    error: pendingError,
    isLoading: pendingLoading,
  } = usePendingApprovals()

  /** All tab: API sorts by created_at only (Date Filed). */
  const apiSort = sortDir

  const allListParams = useMemo(
    () => ({
      status: toApiStatus(statusFilter),
      code: leaveTypeFilter === 'ALL' ? undefined : leaveTypeFilter,
      sort: apiSort,
      page: allPage,
      per_page: pageSize,
    }),
    [statusFilter, leaveTypeFilter, apiSort, allPage, pageSize],
  )

  const {
    data: allData,
    error: allError,
    isLoading: allLoading,
    isValidating: allValidating,
  } = useApprovals(tab === 'all' ? allListParams : null)

  // All tab: only Date Filed is sortable — drop column-local sort keys from Pending.
  useEffect(() => {
    if (tab !== 'all') return
    if (sortKey !== 'filedOn') {
      setSortKey('filedOn')
      setSortDir('desc')
    }
  }, [tab, sortKey])

  // All tab: server filter / Date Filed sort → page 1 + skeleton until refetch settles.
  useEffect(() => {
    if (tab !== 'all') return
    setAllPage(1)
    if (skipAllResetSkeleton.current) {
      skipAllResetSkeleton.current = false
      return
    }
    setAwaitingAllReset(true)
  }, [tab, statusFilter, leaveTypeFilter, apiSort])

  // All tab: page-size change — keep approximate scroll position.
  useEffect(() => {
    if (tab !== 'all') return
    const previous = prevPageSizeRef.current
    prevPageSizeRef.current = pageSize
    if (previous == null || previous === pageSize) return

    setAllPage((page) => {
      const firstVisibleIndex = (page - 1) * previous
      return Math.max(1, Math.floor(firstVisibleIndex / pageSize) + 1)
    })
  }, [tab, pageSize])

  useEffect(() => {
    if (!awaitingAllReset) return
    if (!allValidating) {
      setAwaitingAllReset(false)
    }
  }, [awaitingAllReset, allValidating, allData, allError])

  const pendingRows = useMemo(
    () => (pendingData ?? []).map(toApprovalRowView),
    [pendingData],
  )

  const allRows = useMemo(
    () =>
      awaitingAllReset
        ? []
        : (allData?.data ?? []).map(toApprovalRowView),
    [allData, awaitingAllReset],
  )

  const groupOptions = useMemo(() => {
    const groups = Array.from(
      new Set(
        [...pendingRows, ...allRows]
          .map((item) => item.groupLabel)
          .filter((label) => label !== '—'),
      ),
    ).sort((a, b) => a.localeCompare(b))
    return [
      { value: 'ALL' as const, label: 'All Groups' },
      ...groups.map((group) => ({ value: group, label: group })),
    ]
  }, [pendingRows, allRows])

  const searchQuery = search.trim().toLowerCase()

  const filteredPending = useMemo(() => {
    const filtered = pendingRows.filter((item) =>
      matchesRowFilters(item, searchQuery, groupFilter, leaveTypeFilter),
    )
    return sortRows(filtered, sortKey, sortDir)
  }, [
    pendingRows,
    searchQuery,
    groupFilter,
    leaveTypeFilter,
    sortKey,
    sortDir,
  ])

  const pendingFilterResetKey = [
    search,
    groupFilter,
    leaveTypeFilter,
    sortKey,
    sortDir,
  ].join('|')

  const {
    currentPage: pendingPage,
    setCurrentPage: setPendingPage,
    totalPages: pendingTotalPages,
    paginatedItems: pendingPageItems,
  } = usePagination(filteredPending, pageSize, pendingFilterResetKey)

  // All tab: search/group on the current server page (order comes from API).
  const displayAllRows = useMemo(
    () =>
      allRows.filter((item) =>
        matchesRowFilters(item, searchQuery, groupFilter, 'ALL'),
      ),
    [allRows, searchQuery, groupFilter],
  )

  const allTotalItems = awaitingAllReset
    ? 0
    : (allData?.meta?.total ?? displayAllRows.length)
  const allTotalPages = awaitingAllReset
    ? 1
    : Math.max(1, allData?.meta?.last_page ?? 1)

  useEffect(() => {
    if (tab !== 'all' || awaitingAllReset) return
    if (allPage > allTotalPages) {
      setAllPage(allTotalPages)
    }
  }, [tab, awaitingAllReset, allPage, allTotalPages])

  const hasActiveFilters =
    search.trim().length > 0 ||
    groupFilter !== 'ALL' ||
    leaveTypeFilter !== 'ALL' ||
    statusFilter !== 'ALL'

  function clearFilters() {
    setSearch('')
    setGroupFilter('ALL')
    setLeaveTypeFilter('ALL')
    setStatusFilter('ALL')
  }

  function toggleSort(key: SortKey) {
    // All tab: only Date Filed (server sort). Other columns are Pending-only.
    if (tab === 'all' && key !== 'filedOn') return

    if (sortKey === key) {
      setSortDir((dir) => (dir === 'desc' ? 'asc' : 'desc'))
      return
    }
    setSortKey(key)
    setSortDir('desc')
  }

  function setTab(next: ListTab) {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        params.set(LIST_TAB_QUERY_KEY, next)
        return params
      },
      { replace: true },
    )
  }

  const showPendingSkeleton = pendingLoading && !pendingData
  const showAllSkeleton =
    (allLoading && !allData) || awaitingAllReset
  const showAllStale =
    Boolean(allValidating && allData && !awaitingAllReset) && tab === 'all'

  const showSkeleton = tab === 'pending' ? showPendingSkeleton : showAllSkeleton
  const listError =
    tab === 'pending'
      ? pendingError && !pendingData
      : allError && !allData
  const pageItems = tab === 'pending' ? pendingPageItems : displayAllRows
  const currentPage = tab === 'pending' ? pendingPage : allPage
  const totalPages = tab === 'pending' ? pendingTotalPages : allTotalPages
  const totalItems =
    tab === 'pending' ? filteredPending.length : allTotalItems
  const setCurrentPage =
    tab === 'pending' ? setPendingPage : setAllPage

  return (
    <div className={`${TABLE_PAGE_ROOT} gap-4`}>
      <h1 className="shrink-0 text-h1 text-text-black">Leave Approvals</h1>

      <div className="flex shrink-0 gap-6 border-b border-border">
        <ListTabButton
          active={tab === 'pending'}
          onClick={() => setTab('pending')}
          label="Pending Approvals"
          badge={pendingRows.length}
        />
        <ListTabButton
          active={tab === 'all'}
          onClick={() => setTab('all')}
          label="All Leave Requests"
        />
      </div>

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
                  className={TABLE_SEARCH_INPUT_CLASS}
                />
              </label>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <FilterSelect
                  label="Filter by group"
                  value={groupFilter}
                  onChange={setGroupFilter}
                  options={groupOptions}
                  selectHeight="h-[2.125rem]"
                />
                <FilterSelect
                  label="Filter by leave type"
                  value={leaveTypeFilter}
                  onChange={(value) =>
                    setLeaveTypeFilter(value as LeaveTypeFilter)
                  }
                  options={LEAVE_TYPE_FILTER_OPTIONS}
                  selectHeight="h-[2.125rem]"
                />

                {tab === 'all' ? (
                  <FilterSelect
                    label="Filter by status"
                    value={statusFilter}
                    onChange={(value) =>
                      setStatusFilter(value as ApprovalsStatusFilter)
                    }
                    options={APPROVALS_STATUS_FILTER_OPTIONS}
                    selectHeight="h-[2.125rem]"
                  />
                ) : null}
              </div>
            </div>
          </div>

          <div ref={tableAreaRef} className={TABLE_CONTENT_AREA}>
            <table
              className={[
                'w-full min-w-[960px] table-fixed text-left',
                showAllStale ? 'opacity-80' : '',
              ].join(' ')}
            >
              <colgroup>
                {tab === 'pending' ? (
                  <>
                    <col className="w-[11%]" />
                    <col className="w-[15%]" />
                    <col className="w-[9%]" />
                    <col className="w-[15%]" />
                    <col className="w-[15%]" />
                    <col className="w-[9%]" />
                    <col className="w-[13%]" />
                    <col className="w-[13%]" />
                  </>
                ) : (
                  <>
                    <col className="w-[10%]" />
                    <col className="w-[14%]" />
                    <col className="w-[8%]" />
                    <col className="w-[14%]" />
                    <col className="w-[13%]" />
                    <col className="w-[8%]" />
                    <col className="w-[11%]" />
                    <col className="w-[12%]" />
                    <col className="w-[10%]" />
                  </>
                )}
              </colgroup>
              <thead>
                <tr className="h-11 bg-surface-muted border-b border-border text-small text-text-gray">
                  <th className="px-5 py-3 font-bold uppercase tracking-wide">
                    {tab === 'pending' ? (
                      <SortableHeader
                        label="Employee No."
                        active={sortKey === 'employeeNumber'}
                        direction={sortDir}
                        onToggle={() => toggleSort('employeeNumber')}
                      />
                    ) : (
                      'Employee No.'
                    )}
                  </th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wide">
                    Employee Name
                  </th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wide">
                    Group
                  </th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wide">
                    Leave Type
                  </th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wide">
                    {tab === 'pending' ? (
                      <SortableHeader
                        label="Leave Period"
                        active={sortKey === 'period'}
                        direction={sortDir}
                        onToggle={() => toggleSort('period')}
                      />
                    ) : (
                      'Leave Period'
                    )}
                  </th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wide">
                    Duration
                  </th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wide">
                    <SortableHeader
                      label="Date Filed"
                      active={sortKey === 'filedOn'}
                      direction={sortDir}
                      onToggle={() => toggleSort('filedOn')}
                    />
                  </th>
                  {tab === 'all' ? (
                    <th className="px-5 py-3 font-bold uppercase tracking-wide">
                      Status
                    </th>
                  ) : null}
                  <th className="px-5 py-3 text-center font-bold uppercase tracking-wide">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {showSkeleton ? (
                  <TableBodySkeleton
                    rows={pageSize}
                    cols={tab === 'pending' ? 8 : 9}
                    rowClassName={APPROVALS_TABLE_ROW_HEIGHT_CLASS}
                  />
                ) : listError ? (
                  <TableEmptyRow
                    colSpan={tab === 'pending' ? 8 : 9}
                    pageSize={pageSize}
                    rowHeight={APPROVALS_TABLE_ROW_HEIGHT}
                    variant="no-data"
                    message="Unable to load leave requests. Please try again."
                  />
                ) : pageItems.length === 0 ? (
                  <TableEmptyRow
                    colSpan={tab === 'pending' ? 8 : 9}
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
                  pageItems.map((item) => (
                    <ApprovalRow
                      key={item.id}
                      item={item}
                      showStatus={tab === 'all'}
                      actionLabel={tab === 'pending' ? 'Review' : 'View'}
                      actionTo={
                        tab === 'pending'
                          ? `/team/leave-approvals/${item.id}`
                          : `/team/leave-requests/${item.id}`
                      }
                      listTab={tab}
                    />
                  ))
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

function ApprovalRow({
  item,
  showStatus,
  actionLabel,
  actionTo,
  listTab,
}: {
  item: ApprovalRowView
  showStatus: boolean
  actionLabel: string
  actionTo: string
  listTab: ListTab
}) {
  return (
    <tr
      className={`${TABLE_BODY_ROW_BORDER_CLASS} text-body text-text-black ${APPROVALS_TABLE_ROW_HEIGHT_CLASS}`}
    >
      <td className="px-5 whitespace-nowrap text-body text-text-black">
        {item.employeeNumber}
      </td>
      <td className="truncate px-5" title={item.requesterName}>
        {item.requesterName}
      </td>
      <td className="px-5">{item.groupLabel}</td>
      <td className="truncate px-5" title={item.leaveType}>
        {item.leaveType}
      </td>
      <td className="truncate px-5" title={item.period}>
        {item.period}
      </td>
      <td className="px-5 whitespace-nowrap">{item.duration}</td>
      <td className="px-5 whitespace-nowrap">{item.filedOnLabel}</td>
      {showStatus ? (
        <td className="px-5">
          <StatusBadge status={item.status} />
        </td>
      ) : null}
      <td className="px-5 text-center">
        <Link
          to={actionTo}
          state={{ listTab } satisfies ListReturnState}
          className={TABLE_ACTION_BUTTON_CLASS}
        >
          {actionLabel}
        </Link>
      </td>
    </tr>
  )
}
