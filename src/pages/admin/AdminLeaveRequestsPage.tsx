import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Send } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { ConfirmReasonModal } from '../../components/ui/ConfirmReasonModal'
import { ClearFiltersButton } from '../../components/ui/EmptyState'
import { FilterSelect } from '../../components/ui/FilterSelect'
import { ListTabButton } from '../../components/ui/ListTabButton'
import { Pagination } from '../../components/ui/Pagination'
import { TableBodySkeleton } from '../../components/ui/Skeleton'
import { SortableHeader } from '../../components/ui/SortableHeader'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { SuccessDialog } from '../../components/ui/SuccessDialog'
import {
  TABLE_AVAILABLE_SLOT,
  TABLE_CONTENT_AREA,
  TABLE_CONTENT_SECTION,
  TABLE_PAGE_ROOT,
  TABLE_PAGINATION_PLACEHOLDER,
  TABLE_PAGINATION_WRAP,
} from '../../components/ui/tableLayout'
import { TableEmptyRow } from '../../components/ui/TableEmptyRow'
import { TABLE_ACTION_BUTTON_CLASS, TABLE_BODY_ROW_BORDER_CLASS, TABLE_SEARCH_INPUT_CLASS, APPROVALS_TABLE_ROW_HEIGHT, APPROVALS_TABLE_ROW_HEIGHT_CLASS } from '../../components/ui/tableStyles'
import {
  STATUS_FILTER_OPTIONS,
  type LeaveRequestStatus,
  type StatusFilter,
} from '../../constants/leaveStatus'
import { useContentSizedTableRefs } from '../../hooks/useContentSizedTableRefs'
import { usePagination } from '../../hooks/usePagination'
import { shouldShowDataSkeleton } from '../../mocks/config'
import {
  getAdminAllLeaveRequests,
  getAdminPendingApproverReminderStats,
  getAdminPendingValidation,
  type ApproverListItem,
} from '../../mocks/leaveRequests'
import {
  formatReminderSentLabel,
  getLastApproverReminderSentAt,
  setLastApproverReminderSentAt,
  wasApproverReminderSentToday,
} from '../../utils/adminReminder'
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

const ADMIN_STATUS_LABELS: Partial<Record<LeaveRequestStatus, string>> = {
  PENDING: 'PENDING',
  PENDING_CONVERSION: 'PENDING REVIEW',
}

export function AdminLeaveRequestsPage() {
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

  const [lastReminderSent, setLastReminderSent] = useState(
    () => getLastApproverReminderSentAt(),
  )
  const [reminderConfirmOpen, setReminderConfirmOpen] = useState(false)
  const [reminderSuccessOpen, setReminderSuccessOpen] = useState(false)

  const reminderSentToday = wasApproverReminderSentToday(lastReminderSent)

  const pendingItems = useMemo(() => getAdminPendingValidation(), [])
  const allItems = useMemo(() => getAdminAllLeaveRequests(), [])
  const reminderStats = useMemo(
    () => getAdminPendingApproverReminderStats(),
    [],
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
        tab === 'all' ||
        groupFilter === 'ALL' ||
        item.groupLabel === groupFilter

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

  function handleSendReminderConfirm() {
    // TODO(REPLACE): POST bulk approver reminder email
    const nowIso = new Date().toISOString()
    setLastApproverReminderSentAt(nowIso)
    setLastReminderSent(nowIso)
    setReminderConfirmOpen(false)
    setReminderSuccessOpen(true)
  }

  const showReminderBanner =
    tab === 'all' &&
    (showSkeleton ||
      reminderStats.requestCount > 0 ||
      reminderStats.approverCount > 0 ||
      lastReminderSent !== null)

  return (
    <div className={`${TABLE_PAGE_ROOT} gap-4`}>
      <h1 className="shrink-0 text-h1 text-text-black">Leave Requests</h1>

      <div className="flex shrink-0 gap-6 border-b border-border">
        <ListTabButton
          active={tab === 'pending'}
          onClick={() => setTab('pending')}
          label="Pending Validation"
          badge={pendingItems.length}
        />
        <ListTabButton
          active={tab === 'all'}
          onClick={() => setTab('all')}
          label="All Leave Requests"
        />
      </div>

      {showReminderBanner ? (
        <div className="flex shrink-0 flex-col gap-3 rounded-lg border border-status-pending-conversion/40 bg-status-pending-conversion/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-body font-semibold text-status-pending-conversion">
              Pending Approver Reminders
            </p>
            <p className="mt-0.5 text-small text-text-black">
              {showSkeleton
                ? 'Loading reminder summary…'
                : `${reminderStats.approverCount} approver(s) have ${reminderStats.requestCount} leave request(s) awaiting their action.`}
            </p>
            <p className="mt-1 text-small text-text-gray">
              Last Reminder Sent:{' '}
              {formatReminderSentLabel(lastReminderSent)}
            </p>
          </div>
          <Button
            variant="primary"
            disabled={reminderSentToday || showSkeleton}
            onClick={() => setReminderConfirmOpen(true)}
            className="shrink-0 bg-status-pending-conversion enabled:hover:bg-status-pending-conversion/90 focus:ring-status-pending-conversion/30"
          >
            <Send className="size-4" aria-hidden="true" />
            Send Reminder to All
          </Button>
        </div>
      ) : null}

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
                {tab === 'pending' ? (
                  <FilterSelect
                    label="Filter by group"
                    value={groupFilter}
                    onChange={setGroupFilter}
                    options={groupOptions}
                    selectHeight="h-[2.125rem]"
                  />
                ) : null}
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
                    <col className="w-[10%]" />
                    <col className="w-[14%]" />
                    <col className="w-[10%]" />
                    <col className="w-[16%]" />
                    <col className="w-[14%]" />
                    <col className="w-[10%]" />
                    <col className="w-[12%]" />
                    <col className="w-[14%]" />
                  </>
                ) : (
                  <>
                    <col className="w-[9%]" />
                    <col className="w-[13%]" />
                    <col className="w-[8%]" />
                    <col className="w-[13%]" />
                    <col className="w-[13%]" />
                    <col className="w-[8%]" />
                    <col className="w-[12%]" />
                    <col className="w-[12%]" />
                    <col className="w-[12%]" />
                  </>
                )}
              </colgroup>
              <thead>
                <tr className="h-11 border-b border-border bg-surface-muted text-small text-text-gray">
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
                  {tab === 'all' ? (
                    <th className="px-5 py-3 font-bold uppercase tracking-wide">
                      Status
                    </th>
                  ) : null}
                  <th className="px-5 py-3 font-bold uppercase tracking-wide">
                    <SortableHeader
                      label="Date Filed"
                      active={sortKey === 'filedOn'}
                      direction={sortDir}
                      onToggle={() => toggleSort('filedOn')}
                    />
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
                    cols={tab === 'pending' ? 8 : 9}
                    rowClassName={APPROVALS_TABLE_ROW_HEIGHT_CLASS}
                  />
                ) : paginatedItems.length === 0 ? (
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
                  paginatedItems.map((item) => (
                    <AdminRequestRow
                      key={item.id}
                      item={item}
                      showStatus={tab === 'all'}
                      actionLabel={tab === 'pending' ? 'Review' : 'View'}
                      actionTo={
                        tab === 'pending'
                          ? `/admin/leave-requests/${item.id}/validate`
                          : `/admin/leave-requests/${item.id}`
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

      <ConfirmReasonModal
        open={reminderConfirmOpen}
        onClose={() => setReminderConfirmOpen(false)}
        onConfirm={() => handleSendReminderConfirm()}
        requireReason={false}
        title="Send Reminder to All"
        description="Send a reminder to approvers who have leave requests awaiting their action?"
        confirmLabel="Send Reminder"
        cancelLabel="Cancel"
        confirmVariant="primary"
      />

      <SuccessDialog
        open={reminderSuccessOpen}
        onClose={() => setReminderSuccessOpen(false)}
        title="Reminder sent"
        message="Email reminders have been queued for approvers with pending leave requests."
      />
    </div>
  )
}

function AdminRequestRow({
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
  const needsAdminAction = item.status === 'PENDING_CONVERSION'

  return (
    <tr
      className={`${TABLE_BODY_ROW_BORDER_CLASS} text-body text-text-black ${APPROVALS_TABLE_ROW_HEIGHT_CLASS} ${
        needsAdminAction && showStatus
          ? 'bg-status-pending-conversion/5'
          : ''
      }`}
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
      {showStatus ? (
        <td className="px-5">
          <StatusBadge
            status={item.status}
            label={ADMIN_STATUS_LABELS[item.status]}
          />
        </td>
      ) : null}
      <td className="px-5 whitespace-nowrap">{item.filedOnLabel}</td>
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
