import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
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
import { TABLE_ACTION_BUTTON_CLASS, TABLE_BODY_ROW_BORDER_CLASS, TABLE_SEARCH_INPUT_CLASS, APPROVALS_TABLE_ROW_HEIGHT, APPROVALS_TABLE_ROW_HEIGHT_CLASS } from '../../components/ui/tableStyles'
import {
  STATUS_FILTER_OPTIONS,
  type StatusFilter,
} from '../../constants/leaveStatus'
import { useContentSizedTableRefs } from '../../hooks/useContentSizedTableRefs'
import { usePagination } from '../../hooks/usePagination'
import { shouldShowDataSkeleton } from '../../mocks/config'
import {
  getApproverQueue,
  getApproverVisibleRequests,
  type ApproverListItem,
} from '../../mocks/leaveRequests'
import {
  LIST_TAB_QUERY_KEY,
  parseListTab,
  type ListReturnState,
  type ListTab,
} from '../../utils/listTab'
import { compareEmployeeNumber } from '../../utils/sort'

type LeaveTypeFilter = 'ALL' | string
type GroupFilter = 'ALL' | string
type SortKey = 'filedOn' | 'period' | 'employeeNumber'
type SortDir = 'desc' | 'asc'

export function LeaveApprovalsPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const {
    availableSlotRef,
    sectionHeaderRef,
    paginationRef,
    tableAreaRef,
    pageSize,
  } = useContentSizedTableRefs({ fallbackRowHeight: APPROVALS_TABLE_ROW_HEIGHT })
  const showSkeleton = shouldShowDataSkeleton()

  const tab = parseListTab(searchParams.get(LIST_TAB_QUERY_KEY))
  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('ALL')
  const [leaveTypeFilter, setLeaveTypeFilter] =
    useState<LeaveTypeFilter>('ALL')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [sortKey, setSortKey] = useState<SortKey>('filedOn')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const pendingItems = useMemo(() => getApproverQueue(user.id), [user.id])
  const allItems = useMemo(
    () => getApproverVisibleRequests(user.id),
    [user.id],
  )

  const sourceItems = tab === 'pending' ? pendingItems : allItems

  const groupOptions = useMemo(() => {
    const groups = Array.from(
      new Set(allItems.map((item) => item.groupLabel)),
    ).sort((a, b) => a.localeCompare(b))
    return [
      { value: 'ALL' as const, label: 'All Groups' },
      ...groups.map((group) => ({ value: group, label: group })),
    ]
  }, [allItems])

  const leaveTypeOptions = useMemo(() => {
    const types = Array.from(
      new Set(allItems.map((item) => item.leaveType)),
    ).sort((a, b) => a.localeCompare(b))
    return [
      { value: 'ALL' as const, label: 'All Leave Types' },
      ...types.map((type) => ({ value: type, label: type })),
    ]
  }, [allItems])

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase()

    const filtered = sourceItems.filter((item) => {
      const matchesSearch =
        query.length === 0 ||
        item.requesterName.toLowerCase().includes(query) ||
        item.employeeNumber.toLowerCase().includes(query)

      const matchesGroup =
        groupFilter === 'ALL' || item.groupLabel === groupFilter

      const matchesLeaveType =
        leaveTypeFilter === 'ALL' || item.leaveType === leaveTypeFilter

      const matchesStatus =
        tab === 'pending' ||
        statusFilter === 'ALL' ||
        item.status === statusFilter

      return (
        matchesSearch && matchesGroup && matchesLeaveType && matchesStatus
      )
    })

    return [...filtered].sort((a, b) => {
      const cmp =
        sortKey === 'filedOn'
          ? a.filedOnDate.localeCompare(b.filedOnDate)
          : sortKey === 'period'
            ? a.period.localeCompare(b.period)
            : compareEmployeeNumber(a.employeeNumber, b.employeeNumber)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [
    sourceItems,
    search,
    groupFilter,
    leaveTypeFilter,
    statusFilter,
    tab,
    sortKey,
    sortDir,
  ])

  const filterResetKey = [
    tab,
    search,
    groupFilter,
    leaveTypeFilter,
    statusFilter,
    sortKey,
    sortDir,
  ].join('|')

  const { currentPage, setCurrentPage, totalPages, paginatedItems } =
    usePagination(filteredItems, pageSize, filterResetKey)

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

  return (
    <div className={`${TABLE_PAGE_ROOT} gap-4`}>
      <h1 className="shrink-0 text-h1 text-text-black">Leave Approvals</h1>

      <div className="flex shrink-0 gap-6 border-b border-border">
        <ListTabButton
          active={tab === 'pending'}
          onClick={() => setTab('pending')}
          label="Pending Approvals"
          badge={pendingItems.length}
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
                  onChange={setLeaveTypeFilter}
                  options={leaveTypeOptions}
                  selectHeight="h-[2.125rem]"
                />

                {tab === 'all' ? (
                  <FilterSelect
                    label="Filter by status"
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={STATUS_FILTER_OPTIONS}
                    selectHeight="h-[2.125rem]"
                  />
                ) : null}
              </div>
            </div>
          </div>

          <div ref={tableAreaRef} className={TABLE_CONTENT_AREA}>
            <table className="w-full min-w-[960px] table-fixed text-left">
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
                ) : paginatedItems.length === 0 ? (
                  <tr className={APPROVALS_TABLE_ROW_HEIGHT_CLASS}>
                    <td
                      colSpan={tab === 'pending' ? 8 : 9}
                      className="px-5 text-center text-body text-text-gray"
                    >
                      No leave requests match the selected filters.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item) => (
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
                totalItems={filteredItems.length}
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
  item: ApproverListItem
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
