import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowDown, ArrowUp, Search } from 'lucide-react'
import type { ApprovalsListStatus } from '../../api/approvals'
import type { ApprovalInboxRow } from '../../api/types'
import { FilterSelect } from '../../components/ui/FilterSelect'
import { Pagination } from '../../components/ui/Pagination'
import { TableBodySkeleton } from '../../components/ui/Skeleton'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { TABLE_ACTION_BUTTON_CLASS } from '../../components/ui/tableStyles'
import type { LeaveRequestStatus } from '../../constants/leaveStatus'
import {
  SICK_LEAVE_THEME,
  VACATION_LEAVE_THEME,
} from '../../constants/leaveTypeTheme'
import { useApprovals } from '../../hooks/api/useApprovals'
import { usePendingApprovals } from '../../hooks/api/usePendingApprovals'
import {
  APPROVALS_TABLE_ROW_HEIGHT,
  APPROVALS_TABLE_ROW_HEIGHT_CLASS,
  usePageSizeFromHeight,
} from '../../hooks/usePageSizeFromHeight'
import { usePagination } from '../../hooks/usePagination'
import {
  formatDateTime,
  formatDurationDays,
  formatLeavePeriod,
  getApprovalProgressLabel,
  getApprovalProgressPercent,
  mapApiLeaveStatusToUi,
} from '../../utils/leaveDisplay'
import {
  LIST_TAB_QUERY_KEY,
  parseListTab,
  type ListReturnState,
  type ListTab,
} from '../../utils/listTab'

type LeaveTypeFilter = 'ALL' | 'VL' | 'SL'
type GroupFilter = 'ALL' | string
type SortKey = 'filedOn' | 'period' | 'employeeNumber'
type SortDir = 'desc' | 'asc'
type ApprovalsStatusFilter = 'ALL' | 'APPROVED' | 'REJECTED' | 'CONVERTED'

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
  progressLabel: string
  progressPercent: number
}

const LEAVE_TYPE_FILTER_OPTIONS = [
  { value: 'ALL' as const, label: 'All Leave Types' },
  { value: 'VL' as const, label: VACATION_LEAVE_THEME.label },
  { value: 'SL' as const, label: SICK_LEAVE_THEME.label },
]

const APPROVALS_STATUS_FILTER_OPTIONS: {
  value: 'ALL' | 'APPROVED' | 'REJECTED' | 'CONVERTED'
  label: string
}[] = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CONVERTED', label: 'Converted to SL' },
]

const PAGE_SIZE_DEBOUNCE_MS = 150

function compareEmployeeNumber(a: string, b: string): number {
  const numA = Number(a)
  const numB = Number(b)
  if (Number.isFinite(numA) && Number.isFinite(numB)) {
    return numA - numB
  }
  return a.localeCompare(b)
}

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
    filedOnLabel: formatDateTime(row.created_at),
    status: mapApiLeaveStatusToUi(row.status),
    progressLabel: getApprovalProgressLabel(
      row.approvals_completed,
      row.approvals_required,
    ),
    progressPercent: getApprovalProgressPercent(
      row.approvals_completed,
      row.approvals_required,
    ),
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
  const tableAreaRef = useRef<HTMLDivElement>(null)
  const measuredPageSize = usePageSizeFromHeight(
    tableAreaRef,
    APPROVALS_TABLE_ROW_HEIGHT,
  )
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

  /** Server only sorts by created_at; other columns are client-sorted on the page. */
  const apiSort = sortKey === 'filedOn' ? sortDir : ('desc' as const)

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

  // All tab: server filter / filedOn sort → page 1 + skeleton until refetch settles.
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

  // All tab: search/group (+ non-filedOn sort) on the current server page.
  const displayAllRows = useMemo(() => {
    const filtered = allRows.filter((item) =>
      matchesRowFilters(item, searchQuery, groupFilter, 'ALL'),
    )
    if (sortKey === 'filedOn') return filtered
    return sortRows(filtered, sortKey, sortDir)
  }, [allRows, searchQuery, groupFilter, sortKey, sortDir])

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

  function toggleSort(key: SortKey) {
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
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <h1 className="shrink-0 text-h1 text-text-black">Leave Approvals</h1>

      <div className="flex shrink-0 gap-6 border-b border-border">
        <TabButton
          active={tab === 'pending'}
          onClick={() => setTab('pending')}
          label="Pending Approvals"
          badge={pendingRows.length}
        />
        <TabButton
          active={tab === 'all'}
          onClick={() => setTab('all')}
          label="All Leave Requests"
        />
      </div>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-surface">
        <div className="flex shrink-0 flex-col gap-3 border-b border-border px-5 py-4">
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
                className="h-[2.125rem] w-full rounded-md border border-border bg-surface pr-3 pl-9 text-small text-text-black outline-none placeholder:text-text-gray focus:border-primary focus:ring-2 focus:ring-primary/20"
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

        <div
          ref={tableAreaRef}
          className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden"
        >
          <table
            className={[
              'w-full min-w-[960px] table-fixed text-left',
              showAllStale ? 'opacity-80' : '',
            ].join(' ')}
          >
            <colgroup>
              <col className="w-[10%]" />
              <col className="w-[14%]" />
              <col className="w-[8%]" />
              <col className="w-[14%]" />
              <col className="w-[13%]" />
              <col className="w-[8%]" />
              <col className="w-[11%]" />
              <col className="w-[12%]" />
              <col className="w-[10%]" />
            </colgroup>
            <thead>
              <tr className="h-11 bg-surface-muted border-b border-border text-small text-text-gray">
                <th className="px-5 py-3 font-bold uppercase tracking-wide">
                  <SortableHeader
                    label="Employee No."
                    active={sortKey === 'employeeNumber'}
                    direction={sortDir}
                    onToggle={() => toggleSort('employeeNumber')}
                  />
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
                  <SortableHeader
                    label="Leave Period"
                    active={sortKey === 'period'}
                    direction={sortDir}
                    onToggle={() => toggleSort('period')}
                  />
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
                <th className="px-5 py-3 font-bold uppercase tracking-wide">
                  {tab === 'pending' ? 'Approval Progress' : 'Status'}
                </th>
                <th className="px-5 py-3 text-center font-bold uppercase tracking-wide">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {showSkeleton ? (
                <TableBodySkeleton
                  rows={pageSize}
                  cols={9}
                  rowClassName={APPROVALS_TABLE_ROW_HEIGHT_CLASS}
                />
              ) : listError ? (
                <tr className={APPROVALS_TABLE_ROW_HEIGHT_CLASS}>
                  <td
                    colSpan={9}
                    className="px-5 text-center text-body text-status-rejected"
                  >
                    Unable to load leave requests. Please try again.
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr className={APPROVALS_TABLE_ROW_HEIGHT_CLASS}>
                  <td
                    colSpan={9}
                    className="px-5 text-center text-body text-text-gray"
                  >
                    No leave requests match the selected filters.
                  </td>
                </tr>
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

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </section>
    </div>
  )
}

function SortableHeader({
  label,
  active,
  direction,
  onToggle,
}: {
  label: string
  active: boolean
  direction: SortDir
  onToggle: () => void
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span>{label}</span>
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex rounded p-0.5 text-text-gray transition-colors hover:bg-background hover:text-text-black"
        aria-label={`Sort ${label} ${active && direction === 'desc' ? 'ascending' : 'descending'}`}
      >
        {active && direction === 'asc' ? (
          <ArrowUp className="size-3.5" aria-hidden="true" />
        ) : (
          <ArrowDown className="size-3.5" aria-hidden="true" />
        )}
      </button>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  label,
  badge,
}: {
  active: boolean
  onClick: () => void
  label: string
  badge?: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px inline-flex items-center gap-2 border-b-2 pb-2.5 text-body transition-colors ${
        active
          ? 'border-primary font-medium text-primary'
          : 'border-transparent text-text-gray hover:text-text-black'
      }`}
    >
      <span>{label}</span>
      {typeof badge === 'number' ? (
        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-small font-semibold text-white">
          {badge}
        </span>
      ) : null}
    </button>
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
  let statusOrProgress: ReactNode
  if (showStatus) {
    statusOrProgress = <StatusBadge status={item.status} />
  } else {
    statusOrProgress = (
      <div className="flex min-w-0 flex-col gap-1.5">
        <span className="truncate text-small text-text-gray">
          {item.progressLabel}
        </span>
        <div
          className="h-1.5 overflow-hidden rounded-full bg-surface-muted"
          role="progressbar"
          aria-valuenow={item.progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={item.progressLabel}
        >
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${item.progressPercent}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <tr
      className={`border-b border-border/60 text-body text-text-black last:border-b-0 ${APPROVALS_TABLE_ROW_HEIGHT_CLASS}`}
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
      <td className="px-5">{statusOrProgress}</td>
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
