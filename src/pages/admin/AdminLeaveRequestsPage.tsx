import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Send } from 'lucide-react'
import type { AdminLeavesListStatus } from '../../api/adminLeaves'
import type {
  ApprovalInboxRow,
  LeaveConversionResource,
  LeaveStatus,
} from '../../api/types'
import { Button } from '../../components/ui/Button'
import { ConfirmReasonModal } from '../../components/ui/ConfirmReasonModal'
import { ClearFiltersButton } from '../../components/ui/EmptyState'
import { FilterSelect } from '../../components/ui/FilterSelect'
import { ListTabButton } from '../../components/ui/ListTabButton'
import { Pagination } from '../../components/ui/Pagination'
import { TableBodySkeleton } from '../../components/ui/Skeleton'
import { SortableHeader } from '../../components/ui/SortableHeader'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useToast } from '../../components/ui/ToastProvider'
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
  TABLE_ACTION_BUTTON_CLASS,
  TABLE_BODY_ROW_BORDER_CLASS,
  TABLE_SEARCH_INPUT_CLASS,
  APPROVALS_TABLE_ROW_HEIGHT,
  APPROVALS_TABLE_ROW_HEIGHT_CLASS,
} from '../../components/ui/tableStyles'
import type { LeaveRequestStatus } from '../../constants/leaveStatus'
import { TOAST_REMINDER_SENT_TO_ALL } from '../../constants/toastMessages'
import { useAdminLeaves } from '../../hooks/api/useAdminLeaves'
import { useAdminGroups } from '../../hooks/api/useAdminGroups'
import { useAdminReminders } from '../../hooks/api/useAdminReminders'
import { usePendingConversions } from '../../hooks/api/usePendingConversions'
import { useContentSizedTableRefs } from '../../hooks/useContentSizedTableRefs'
import { usePagination } from '../../hooks/usePagination'
import { ApiError } from '../../api/axios-client'
import { sendAdminBulkReminder, statsAfterBulkSend, statsAfterReminder429 } from '../../api/reminders'
import { formatReminderSentLabel } from '../../utils/adminReminder'
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
import {
  LEAVE_TYPE_FILTER_OPTIONS,
  type LeaveTypeFilter,
} from '../../utils/leaveFiling'

type GroupFilter = 'ALL' | string
type SortKey = 'filedOn' | 'period' | 'employeeNumber'
type SortDir = 'desc' | 'asc'
type AdminAllStatusFilter =
  | 'ALL'
  | 'PENDING'
  | 'PENDING_CONVERSION'
  | 'APPROVED'
  | 'CONVERTED'
  | 'CONVERTED_EL'

type PendingValidationDisplay =
  | {
      kind: 'conversion'
      fromLeaveType: string
      toLeaveType: string
      fromLeaveTypeCode: string
      toLeaveTypeCode: string
    }
  | {
      kind: 'new_filing'
      leaveType: string
      leaveTypeCode: string
    }

type AdminListRow = {
  id: number
  employeeNumber: string
  requesterName: string
  groupLabel: string
  leaveType: string
  leaveTypeCode: string
  pendingValidation?: PendingValidationDisplay
  period: string
  duration: string
  filedOnDate: string
  filedOnLabel: string
  status: LeaveRequestStatus
  apiStatus?: LeaveStatus
}

const ADMIN_ALL_STATUS_FILTER_OPTIONS: {
  value: AdminAllStatusFilter
  label: string
}[] = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending Approval' },
  { value: 'PENDING_CONVERSION', label: 'Pending Conversion' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'CONVERTED', label: 'Converted to SL' },
  { value: 'CONVERTED_EL', label: 'Converted to EL' },
]

const ADMIN_STATUS_LABELS: Partial<Record<LeaveRequestStatus, string>> = {
  PENDING: 'PENDING',
  PENDING_CONVERSION: 'PENDING REVIEW',
}

const PAGE_SIZE_DEBOUNCE_MS = 150

function messageFromReminderError(error: unknown): string {
  if (error instanceof ApiError) {
    const body = error.body
    if (body && typeof body === 'object' && 'errors' in body) {
      const errors = (body as { errors: Record<string, string[]> }).errors
      const first = Object.values(errors).flat()[0]
      if (typeof first === 'string' && first.length > 0) return first
    }
    if (body && typeof body === 'object' && 'message' in body) {
      const message = (body as { message: unknown }).message
      if (typeof message === 'string' && message.trim()) return message
    }
    if (error.message) return error.message
  }
  return 'Unable to send reminder. Please try again.'
}

function toPendingValidationRow(
  conversion: LeaveConversionResource,
): AdminListRow | null {
  const leave = conversion.leave
  if (!leave) return null

  const employee = leave.employee
  const fromType = conversion.from_leave_type
  const toType = conversion.to_leave_type
  const hasConversionTypes = fromType != null && toType != null

  const pendingValidation: PendingValidationDisplay = hasConversionTypes
    ? {
        kind: 'conversion',
        fromLeaveType: fromType.name,
        toLeaveType: toType.name,
        fromLeaveTypeCode: fromType.code,
        toLeaveTypeCode: toType.code,
      }
    : {
        kind: 'new_filing',
        leaveType: leave.leave_type?.name ?? '—',
        leaveTypeCode: leave.leave_type?.code ?? '',
      }

  return {
    id: leave.id,
    employeeNumber: employee?.employee_number ?? '—',
    requesterName: employee?.name?.trim() || '—',
    groupLabel:
      employee?.group?.abbreviation?.trim() ||
      employee?.group?.name?.trim() ||
      '—',
    leaveType: hasConversionTypes
      ? `${fromType.name} → ${toType.name}`
      : (leave.leave_type?.name ?? '—'),
    leaveTypeCode: hasConversionTypes
      ? fromType.code
      : (leave.leave_type?.code ?? ''),
    pendingValidation,
    period: formatLeavePeriod(leave.start_date, leave.end_date),
    duration: formatDurationDays(leave.duration),
    filedOnDate: conversion.created_at ?? '',
    filedOnLabel: formatShortDate(conversion.created_at),
    status: mapApiLeaveStatusToUi(leave.status),
    apiStatus: leave.status,
  }
}

function toPendingDirectFilingRow(row: ApprovalInboxRow): AdminListRow {
  const mapped = toAdminAllRow(row)
  return {
    ...mapped,
    pendingValidation: {
      kind: 'new_filing',
      leaveType: row.leave_type.name,
      leaveTypeCode: row.leave_type.code,
    },
  }
}

function toAdminAllRow(row: ApprovalInboxRow): AdminListRow {
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
    apiStatus: row.status,
  }
}

function groupOptionLabel(group: {
  abbreviation: string | null
  name: string | null
  id: number
}): string {
  return group.abbreviation?.trim() || group.name?.trim() || String(group.id)
}

function toApiAdminStatus(
  filter: AdminAllStatusFilter,
): AdminLeavesListStatus | undefined {
  switch (filter) {
    case 'PENDING':
      return 'pending_approval'
    case 'PENDING_CONVERSION':
      return 'pending_conversion'
    case 'APPROVED':
      return 'confirmed'
    case 'CONVERTED':
      return 'converted_to_sl'
    case 'CONVERTED_EL':
      return 'converted_to_el'
    default:
      return undefined
  }
}

function pendingRowMatchesLeaveTypeFilter(
  item: AdminListRow,
  leaveTypeFilter: LeaveTypeFilter,
): boolean {
  if (leaveTypeFilter === 'ALL') return true

  const display = item.pendingValidation
  if (display?.kind === 'conversion') {
    return (
      display.fromLeaveTypeCode === leaveTypeFilter ||
      display.toLeaveTypeCode === leaveTypeFilter
    )
  }
  if (display?.kind === 'new_filing') {
    return display.leaveTypeCode === leaveTypeFilter
  }

  return item.leaveTypeCode === leaveTypeFilter
}

function statusBadgeLabel(item: AdminListRow): string | undefined {
  return ADMIN_STATUS_LABELS[item.status]
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(id)
  }, [value, delayMs])

  return debounced
}

export function AdminLeaveRequestsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const toast = useToast()
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
  const [statusFilter, setStatusFilter] =
    useState<AdminAllStatusFilter>('ALL')
  const [sortKey, setSortKey] = useState<SortKey>('filedOn')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const [allPage, setAllPage] = useState(1)
  const [awaitingAllReset, setAwaitingAllReset] = useState(false)
  const skipAllResetSkeleton = useRef(true)

  const [reminderConfirmOpen, setReminderConfirmOpen] = useState(false)
  const [reminderSending, setReminderSending] = useState(false)
  const [reminderError, setReminderError] = useState<string | null>(null)

  const {
    data: pendingData,
    error: pendingError,
    isLoading: pendingLoading,
  } = usePendingConversions()

  const pendingAdminApprovedParams = useMemo(
    () => ({
      status: 'pending_approval' as const,
      per_page: 50,
      page: 1,
    }),
    [],
  )

  const {
    data: pendingSlData,
    error: pendingSlError,
    isLoading: pendingSlLoading,
  } = useAdminLeaves({ ...pendingAdminApprovedParams, code: 'SL' })

  const {
    data: pendingPtbData,
    error: pendingPtbError,
    isLoading: pendingPtbLoading,
  } = useAdminLeaves({ ...pendingAdminApprovedParams, code: 'PTB' })

  const {
    data: pendingElData,
    error: pendingElError,
    isLoading: pendingElLoading,
  } = useAdminLeaves({ ...pendingAdminApprovedParams, code: 'EL' })

  const {
    data: pendingLlData,
    error: pendingLlError,
    isLoading: pendingLlLoading,
  } = useAdminLeaves({ ...pendingAdminApprovedParams, code: 'LL' })

  const {
    data: pendingMlData,
    error: pendingMlError,
    isLoading: pendingMlLoading,
  } = useAdminLeaves({ ...pendingAdminApprovedParams, code: 'ML' })

  const {
    data: pendingPlData,
    error: pendingPlError,
    isLoading: pendingPlLoading,
  } = useAdminLeaves({ ...pendingAdminApprovedParams, code: 'PL' })

  const {
    data: reminderStats,
    error: reminderErrorFromApi,
    isLoading: reminderLoading,
    mutate: mutateReminders,
  } = useAdminReminders(tab === 'all')

  const apiSort = sortDir

  const allGroupId =
    tab === 'all' && groupFilter !== 'ALL' ? Number(groupFilter) : undefined

  const allListParams = useMemo(
    () => ({
      status: toApiAdminStatus(statusFilter),
      code: leaveTypeFilter === 'ALL' ? undefined : leaveTypeFilter,
      group_id:
        allGroupId != null && Number.isInteger(allGroupId) && allGroupId > 0
          ? allGroupId
          : undefined,
      sort: apiSort,
      page: allPage,
      per_page: pageSize,
    }),
    [
      statusFilter,
      leaveTypeFilter,
      allGroupId,
      apiSort,
      allPage,
      pageSize,
    ],
  )

  const {
    data: allData,
    error: allError,
    isLoading: allLoading,
    isValidating: allValidating,
  } = useAdminLeaves(tab === 'all' ? allListParams : null)

  const { data: adminGroups } = useAdminGroups(tab === 'all')

  useEffect(() => {
    if (tab !== 'all') return
    if (sortKey !== 'filedOn') {
      setSortKey('filedOn')
      setSortDir('desc')
    }
  }, [tab, sortKey])

  useEffect(() => {
    if (tab !== 'all') return
    setAllPage(1)
    if (skipAllResetSkeleton.current) {
      skipAllResetSkeleton.current = false
      return
    }
    setAwaitingAllReset(true)
  }, [tab, statusFilter, leaveTypeFilter, groupFilter, apiSort])

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

  const pendingItems = useMemo(() => {
    const conversions = pendingData
      ? pendingData
          .map(toPendingValidationRow)
          .filter((row): row is AdminListRow => row !== null)
      : []
    const sickLeaves = (pendingSlData?.data ?? []).map(toPendingDirectFilingRow)
    const ptbLeaves = (pendingPtbData?.data ?? []).map(toPendingDirectFilingRow)
    const elLeaves = (pendingElData?.data ?? []).map(toPendingDirectFilingRow)
    const llLeaves = (pendingLlData?.data ?? []).map(toPendingDirectFilingRow)
    const mlLeaves = (pendingMlData?.data ?? []).map(toPendingDirectFilingRow)
    const plLeaves = (pendingPlData?.data ?? []).map(toPendingDirectFilingRow)
    return [
      ...conversions,
      ...sickLeaves,
      ...ptbLeaves,
      ...elLeaves,
      ...llLeaves,
      ...mlLeaves,
      ...plLeaves,
    ]
  }, [
    pendingData,
    pendingSlData,
    pendingPtbData,
    pendingElData,
    pendingLlData,
    pendingMlData,
    pendingPlData,
  ])

  const allRows = useMemo(
    () =>
      awaitingAllReset ? [] : (allData?.data ?? []).map(toAdminAllRow),
    [allData, awaitingAllReset],
  )

  const pendingGroupOptions = useMemo(() => {
    const groups = Array.from(
      new Set(
        pendingItems
          .map((item) => item.groupLabel)
          .filter((label) => label !== '—'),
      ),
    ).sort((a, b) => a.localeCompare(b))
    return [
      { value: 'ALL' as const, label: 'All Groups' },
      ...groups.map((group) => ({ value: group, label: group })),
    ]
  }, [pendingItems])

  const allGroupOptions = useMemo(
    () => [
      { value: 'ALL' as const, label: 'All Groups' },
      ...(adminGroups ?? []).map((group) => ({
        value: String(group.id),
        label: groupOptionLabel(group),
      })),
    ],
    [adminGroups],
  )

  const searchQuery = search.trim().toLowerCase()

  const filteredPending = useMemo(() => {
    const filtered = pendingItems.filter((item) => {
      const matchesSearch =
        searchQuery.length === 0 ||
        item.requesterName.toLowerCase().includes(searchQuery) ||
        item.employeeNumber.toLowerCase().includes(searchQuery)

      const matchesGroup =
        groupFilter === 'ALL' || item.groupLabel === groupFilter

      return (
        matchesSearch &&
        matchesGroup &&
        pendingRowMatchesLeaveTypeFilter(item, leaveTypeFilter)
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
    pendingItems,
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

  const displayAllRows = useMemo(
    () =>
      allRows.filter((item) => {
        if (searchQuery.length === 0) return true
        return (
          item.requesterName.toLowerCase().includes(searchQuery) ||
          item.employeeNumber.toLowerCase().includes(searchQuery)
        )
      }),
    [allRows, searchQuery],
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

  const showPendingSkeleton =
    (pendingLoading && !pendingData) ||
    (pendingSlLoading && !pendingSlData) ||
    (pendingPtbLoading && !pendingPtbData) ||
    (pendingElLoading && !pendingElData) ||
    (pendingLlLoading && !pendingLlData) ||
    (pendingMlLoading && !pendingMlData) ||
    (pendingPlLoading && !pendingPlData)
  const showAllSkeleton = (allLoading && !allData) || awaitingAllReset
  const showSkeleton = tab === 'pending' ? showPendingSkeleton : showAllSkeleton
  const listError =
    tab === 'pending'
      ? (pendingError && !pendingData) ||
        (pendingSlError && !pendingSlData) ||
        (pendingPtbError && !pendingPtbData) ||
        (pendingElError && !pendingElData) ||
        (pendingLlError && !pendingLlData) ||
        (pendingMlError && !pendingMlData) ||
        (pendingPlError && !pendingPlData)
      : allError && !allData

  const pageItems = tab === 'pending' ? pendingPageItems : displayAllRows
  const currentPage = tab === 'pending' ? pendingPage : allPage
  const totalPages = tab === 'pending' ? pendingTotalPages : allTotalPages
  const totalItems =
    tab === 'pending' ? filteredPending.length : allTotalItems
  const setCurrentPage =
    tab === 'pending' ? setPendingPage : setAllPage

  const hasActiveFilters =
    search.trim().length > 0 ||
    groupFilter !== 'ALL' ||
    leaveTypeFilter !== 'ALL' ||
    (tab === 'all' && statusFilter !== 'ALL')

  function clearFilters() {
    setSearch('')
    setGroupFilter('ALL')
    setLeaveTypeFilter('ALL')
    setStatusFilter('ALL')
  }

  function toggleSort(key: SortKey) {
    if (tab === 'all' && key !== 'filedOn') return

    if (sortKey === key) {
      setSortDir((dir) => (dir === 'desc' ? 'asc' : 'desc'))
      return
    }
    setSortKey(key)
    setSortDir('desc')
  }

  function setTab(next: ListTab) {
    setLeaveTypeFilter('ALL')
    setGroupFilter('ALL')
    setStatusFilter('ALL')
    setSearch('')
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        params.set(LIST_TAB_QUERY_KEY, next)
        return params
      },
      { replace: true },
    )
  }

  async function handleSendReminderConfirm() {
    setReminderConfirmOpen(false)
    setReminderSending(true)
    setReminderError(null)

    try {
      const result = await sendAdminBulkReminder()
      await mutateReminders(statsAfterBulkSend(reminderStats, result), {
        revalidate: true,
      })
      toast.success(TOAST_REMINDER_SENT_TO_ALL)
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        await mutateReminders(
          (current) => statsAfterReminder429(current, err.body, {}),
          { revalidate: true },
        )
      }
      setReminderError(messageFromReminderError(err))
    } finally {
      setReminderSending(false)
    }
  }

  const approverCount = reminderStats?.approver_count ?? 0
  const requestCount = reminderStats?.request_count ?? 0
  const lastReminderSent = reminderStats?.last_sent_at ?? null
  const canSendReminder =
    Boolean(reminderStats?.can_send) && requestCount > 0 && !reminderSending

  const showReminderBanner =
    tab === 'all' &&
    (reminderLoading ||
      reminderErrorFromApi != null ||
      reminderError != null ||
      requestCount > 0 ||
      approverCount > 0 ||
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
              {reminderLoading && !reminderStats
                ? 'Loading reminder summary…'
                : reminderErrorFromApi
                  ? 'Unable to load reminder summary.'
                  : `${approverCount} approver(s) have ${requestCount} leave request(s) awaiting their action.`}
            </p>
            <p className="mt-1 text-small text-text-gray">
              Last Reminder Sent:{' '}
              {formatReminderSentLabel(lastReminderSent)}
            </p>
            {reminderError ? (
              <p className="mt-1 text-small font-semibold text-status-rejected">
                {reminderError}
              </p>
            ) : null}
          </div>
          <Button
            variant="primary"
            disabled={!canSendReminder || reminderLoading}
            onClick={() => {
              setReminderError(null)
              setReminderConfirmOpen(true)
            }}
            className="shrink-0 bg-status-pending-conversion enabled:hover:bg-status-pending-conversion/90 focus:ring-status-pending-conversion/30"
          >
            <Send className="size-4" aria-hidden="true" />
            {reminderSending ? 'Sending…' : 'Send Reminder to All'}
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
                <FilterSelect
                  label="Filter by group"
                  value={groupFilter}
                  onChange={setGroupFilter}
                  options={tab === 'pending' ? pendingGroupOptions : allGroupOptions}
                  selectHeight="h-[2.125rem]"
                />
                <FilterSelect
                  label="Filter by leave type"
                  value={leaveTypeFilter}
                  onChange={setLeaveTypeFilter}
                  options={LEAVE_TYPE_FILTER_OPTIONS}
                  selectHeight="h-[2.125rem]"
                />
                {tab === 'all' ? (
                  <FilterSelect
                    label="Filter by status"
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={ADMIN_ALL_STATUS_FILTER_OPTIONS}
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
                ) : listError ? (
                  <tr className={APPROVALS_TABLE_ROW_HEIGHT_CLASS}>
                    <td
                      colSpan={tab === 'pending' ? 8 : 9}
                      className="px-5 text-center text-body text-status-rejected"
                    >
                      {tab === 'pending'
                        ? 'Unable to load pending leave requests. Please try again.'
                        : 'Unable to load leave requests. Please try again.'}
                    </td>
                  </tr>
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

      <ConfirmReasonModal
        open={reminderConfirmOpen}
        onClose={() => setReminderConfirmOpen(false)}
        onConfirm={() => {
          void handleSendReminderConfirm()
        }}
        requireReason={false}
        title="Send Reminder to All"
        description="Send a reminder to approvers who have leave requests awaiting their action?"
        confirmLabel="Send Reminder"
        cancelLabel="Cancel"
        confirmVariant="reminder"
        iconVariant="reminder"
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
  item: AdminListRow
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
      <td className="truncate px-5">
        {listTab === 'pending' ? (
          <PendingValidationLeaveTypeCell
            display={item.pendingValidation}
            fallbackLabel={item.leaveType}
          />
        ) : (
          <span title={item.leaveType}>{item.leaveType}</span>
        )}
      </td>
      <td className="truncate px-5" title={item.period}>
        {item.period}
      </td>
      <td className="px-5 whitespace-nowrap">{item.duration}</td>
      {showStatus ? (
        <td className="px-5">
          <StatusBadge
            status={item.status}
            label={statusBadgeLabel(item)}
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

function PendingValidationLeaveTypeCell({
  display,
  fallbackLabel,
}: {
  display?: PendingValidationDisplay
  fallbackLabel: string
}) {
  if (display?.kind === 'conversion') {
    const label = `${display.fromLeaveType} → ${display.toLeaveType}`
    return (
      <span className="block truncate" title={label}>
        {label}
      </span>
    )
  }

  return (
    <span className="block truncate" title={fallbackLabel}>
      {fallbackLabel}
    </span>
  )
}
