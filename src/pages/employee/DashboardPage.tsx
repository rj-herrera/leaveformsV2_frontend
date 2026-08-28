import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ClearFiltersButton } from '../../components/ui/EmptyState'
import { FilterSelect } from '../../components/ui/FilterSelect'
import { LeaveTypeIconBadge } from '../../components/ui/LeaveTypeIconBadge'
import { Pagination } from '../../components/ui/Pagination'
import {
  BalanceCardSkeleton,
  TableBodySkeleton,
} from '../../components/ui/Skeleton'
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
  TABLE_ACTION_BUTTON_CLASS,
  TABLE_BODY_ROW_BORDER_CLASS,
  TABLE_ROW_HEIGHT,
  TABLE_ROW_HEIGHT_CLASS,
} from '../../components/ui/tableStyles'
import {
  STATUS_FILTER_OPTIONS,
  type StatusFilter,
} from '../../constants/leaveStatus'
import {
  SELECTABLE_LEAVE_DEFAULT,
  SELECTABLE_LEAVE_THEMES,
  SICK_LEAVE_THEME,
  VACATION_LEAVE_THEME,
  type SelectableLeaveType,
} from '../../constants/leaveTypeTheme'
import { useMyBalances } from '../../hooks/api/useMyBalances'
import { useMyLeaves } from '../../hooks/api/useMyLeaves'
import { useContentSizedTableRefs } from '../../hooks/useContentSizedTableRefs'
import { usePagination } from '../../hooks/usePagination'
import {
  formatDurationDays,
  formatLeavePeriod,
  formatLeaveTypeName,
  formatShortDate,
  mapApiLeaveStatusToUi,
} from '../../utils/leaveDisplay'

type LeaveTypeFilter = 'ALL' | string
type FiledOnSort = 'desc' | 'asc'

const SELECTABLE_LEAVE_OPTIONS = (
  ['emergency', 'ptb'] as const
).map((id) => ({
  id,
  ...SELECTABLE_LEAVE_THEMES[id],
}))

/** Format API decimal strings (e.g. `"12.00"`) for balance cards. */
function formatBalanceDays(value: string | undefined): string {
  if (value == null) return '—'
  const n = Number(value)
  if (Number.isNaN(n)) return '—'
  return String(Number.parseFloat(n.toFixed(2)))
}

export function DashboardPage() {
  const {
    availableSlotRef,
    sectionHeaderRef,
    paginationRef,
    tableAreaRef,
    pageSize,
  } = useContentSizedTableRefs()

  const { data: balances, isLoading: balancesLoading } = useMyBalances()
  const showBalanceSkeleton = balancesLoading

  // Max API page size; filter/sort/paginate client-side for this slice.
  const { data: leavesPage, isLoading: leavesLoading } = useMyLeaves({
    per_page: 50,
  })
  const showTableSkeleton = leavesLoading

  const vlBalance = useMemo(
    () => balances?.find((b) => b.code.toUpperCase() === 'VL'),
    [balances],
  )
  const slBalance = useMemo(
    () => balances?.find((b) => b.code.toUpperCase() === 'SL'),
    [balances],
  )
  const elBalance = useMemo(
    () => balances?.find((b) => b.code.toUpperCase() === 'EL'),
    [balances],
  )
  const ptbBalance = useMemo(
    () => balances?.find((b) => b.code.toUpperCase() === 'PTB'),
    [balances],
  )

  const [isLeaveTypeOpen, setIsLeaveTypeOpen] = useState(false)
  const [selectedLeaveType, setSelectedLeaveType] =
    useState<SelectableLeaveType | null>(null)
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<LeaveTypeFilter>('ALL')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [filedOnSort, setFiledOnSort] = useState<FiledOnSort>('desc')

  const leaveRequests = leavesPage?.data ?? []

  const selectedLeaveTheme = selectedLeaveType
    ? SELECTABLE_LEAVE_THEMES[selectedLeaveType]
    : SELECTABLE_LEAVE_DEFAULT

  const leaveTypeFilterOptions = useMemo(() => {
    const types = Array.from(
      new Set(leaveRequests.map((request) => request.leave_type.name)),
    ).sort((a, b) => a.localeCompare(b))

    return [
      { value: 'ALL' as const, label: 'All leave types' },
      ...types.map((type) => {
        const request = leaveRequests.find(
          (item) => item.leave_type.name === type,
        )
        return {
          value: type,
          label: request ? formatLeaveTypeName(request.leave_type) : type,
        }
      }),
    ]
  }, [leaveRequests])

  const selectedOption = selectedLeaveType
    ? SELECTABLE_LEAVE_OPTIONS.find((option) => option.id === selectedLeaveType)
    : undefined

  const selectedAvailableDays = selectedLeaveType
    ? formatBalanceDays(
        selectedLeaveType === 'emergency'
          ? elBalance?.available
          : ptbBalance?.available,
      )
    : null

  const filteredRequests = useMemo(() => {
    return leaveRequests
      .filter((request) => {
        const uiStatus = mapApiLeaveStatusToUi(request.status)
        const matchesType =
          leaveTypeFilter === 'ALL' ||
          request.leave_type.name === leaveTypeFilter
        const matchesStatus =
          statusFilter === 'ALL' || uiStatus === statusFilter
        return matchesType && matchesStatus
      })
      .sort((a, b) => {
        const aFiled = a.created_at ?? a.start_date
        const bFiled = b.created_at ?? b.start_date
        const diff = new Date(aFiled).getTime() - new Date(bFiled).getTime()
        return filedOnSort === 'asc' ? diff : -diff
      })
  }, [leaveRequests, leaveTypeFilter, statusFilter, filedOnSort])

  const { currentPage, setCurrentPage, totalPages, paginatedItems } =
    usePagination(
      filteredRequests,
      pageSize,
      `employee-${leaveTypeFilter}-${statusFilter}-${filedOnSort}`,
    )

  const hasActiveFilters =
    leaveTypeFilter !== 'ALL' || statusFilter !== 'ALL'

  function clearFilters() {
    setLeaveTypeFilter('ALL')
    setStatusFilter('ALL')
  }

  function handleSelectLeaveType(type: SelectableLeaveType) {
    setSelectedLeaveType(type)
    setIsLeaveTypeOpen(false)
  }

  return (
    <div className={`${TABLE_PAGE_ROOT} gap-5`}>
      {/* Balance cards — VL/SL fixed; EL/PTB via the third-card picker */}
      <section className="grid shrink-0 grid-cols-1 gap-4 md:grid-cols-3">
        {showBalanceSkeleton ? (
          <>
            <BalanceCardSkeleton
              label={VACATION_LEAVE_THEME.label}
              icon={VACATION_LEAVE_THEME.icon}
              iconBgClass={VACATION_LEAVE_THEME.iconBgClass}
              showReserved
            />
            <BalanceCardSkeleton
              label={SICK_LEAVE_THEME.label}
              icon={SICK_LEAVE_THEME.icon}
              iconBgClass={SICK_LEAVE_THEME.iconBgClass}
            />
            <BalanceCardSkeleton
              label={SELECTABLE_LEAVE_DEFAULT.label}
              icon={SELECTABLE_LEAVE_DEFAULT.icon}
              iconBgClass={SELECTABLE_LEAVE_DEFAULT.iconBgClass}
            />
          </>
        ) : (
          <>
            <article className="flex flex-col rounded-lg border border-border bg-white p-5">
              <div className="flex items-center gap-2.5">
                <LeaveTypeIconBadge
                  icon={VACATION_LEAVE_THEME.icon}
                  iconBgClass={VACATION_LEAVE_THEME.iconBgClass}
                />
                <h2 className="text-body font-semibold text-text-black">
                  {VACATION_LEAVE_THEME.label}
                </h2>
              </div>
              <div className="mt-5 text-center">
                <p className="text-[2.5rem] text-4xl leading-none font-bold text-text-black">
                  {formatBalanceDays(vlBalance?.available)}
                </p>
                <p className="text-body text-text-gray mt-1.5">days available</p>
              </div>
              <div className="mt-4 border-t border-border pt-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-small font-semibold text-text-black">
                      Reserved Credits
                    </p>
                    <p className="text-small text-text-gray mt-0.5">
                      Subject for approval
                    </p>
                  </div>
                  <p className="text-body font-semibold text-text-black">
                  {formatBalanceDays(vlBalance?.reserved)}{' '}
                  {formatBalanceDays(vlBalance?.reserved) === '1' ? 'day' : 'days'}
                  </p>
                </div>
              </div>
            </article>

            <article className="flex flex-col rounded-lg border border-border bg-white p-5">
              <div className="flex items-center gap-2.5">
                <LeaveTypeIconBadge
                  icon={SICK_LEAVE_THEME.icon}
                  iconBgClass={SICK_LEAVE_THEME.iconBgClass}
                />
                <h2 className="text-body font-semibold text-text-black">
                  {SICK_LEAVE_THEME.label}
                </h2>
              </div>
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <p className="text-[2.5rem] leading-none font-bold text-text-black">
                  {formatBalanceDays(slBalance?.available)}
                </p>
                <p className="text-body text-text-gray mt-1.5">days available</p>
              </div>
            </article>

            <article className="relative flex flex-col rounded-lg border border-border bg-white p-5">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 text-left"
                aria-label="Select leave type"
                aria-expanded={isLeaveTypeOpen}
                aria-haspopup="listbox"
                onClick={() => setIsLeaveTypeOpen((open) => !open)}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <LeaveTypeIconBadge
                    icon={selectedLeaveTheme.icon}
                    iconBgClass={selectedLeaveTheme.iconBgClass}
                  />
                  <span className="text-body truncate font-semibold text-text-black">
                    {selectedOption?.label ?? SELECTABLE_LEAVE_DEFAULT.label}
                  </span>
                </span>
                <ChevronDown
                  className={`size-4 shrink-0 text-text-gray transition-transform ${
                    isLeaveTypeOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              {isLeaveTypeOpen && (
                <ul
                  role="listbox"
                  className="absolute top-14 right-5 left-5 z-10 overflow-hidden rounded-md border border-border bg-white shadow-sm"
                >
                  {SELECTABLE_LEAVE_OPTIONS.map((option) => (
                    <li key={option.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={selectedLeaveType === option.id}
                        className={[
                          'flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-body transition-colors',
                          selectedLeaveType === option.id
                            ? 'bg-primary text-text-white'
                            : 'text-text-black hover:bg-background',
                        ].join(' ')}
                        onClick={() => handleSelectLeaveType(option.id)}
                      >
                        <LeaveTypeIconBadge
                          icon={option.icon}
                          iconBgClass={option.iconBgClass}
                        />
                        {option.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <p className="text-[2.5rem] text-4xl leading-none font-bold text-text-black">
                  {selectedAvailableDays ?? '—'}
                </p>
                <p className="text-body text-text-gray mt-1.5">
                  days available
                </p>
              </div>
            </article>
          </>
        )}
      </section>

      {/* Remaining viewport slot: measures max table capacity; does not stretch the table. */}
      <div ref={availableSlotRef} className={TABLE_AVAILABLE_SLOT}>
        <section
          className={`${TABLE_CONTENT_SECTION} rounded-lg border border-border bg-white`}
        >
          <div
            ref={sectionHeaderRef}
            className="flex shrink-0 flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <h2 className="text-h2 text-text-black">My Leave Requests</h2>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <FilterSelect
                label="Filter by leave type"
                value={leaveTypeFilter}
                onChange={setLeaveTypeFilter}
                options={leaveTypeFilterOptions}
              />
              <FilterSelect
                label="Filter by status"
                value={statusFilter}
                onChange={setStatusFilter}
                options={STATUS_FILTER_OPTIONS}
              />
            </div>
          </div>

          <div ref={tableAreaRef} className={TABLE_CONTENT_AREA}>
            <table className="w-full min-w-[640px] table-fixed text-left">
              <colgroup>
                <col className="w-[19%]" />
                <col className="w-[15%]" />
                <col className="w-[27%]" />
                <col className="w-[12%]" />
                <col className="w-[17%]" />
                <col className="w-[10%]" />
              </colgroup>
              <thead>
                <tr className="h-11 bg-surface-muted border-b border-border text-small text-text-gray">
                  <th className="px-5 py-3 font-bold uppercase tracking-wide">
                    Leave Type
                  </th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wide">
                    <div className="flex items-center gap-1.5">
                      <span>Filed On</span>
                      <button
                        type="button"
                        onClick={() =>
                          setFiledOnSort((sort) =>
                            sort === 'desc' ? 'asc' : 'desc',
                          )
                        }
                        className="inline-flex rounded p-0.5 text-text-gray transition-colors hover:bg-background hover:text-text-black"
                        aria-label={`Sort filed date ${filedOnSort === 'desc' ? 'ascending' : 'descending'}`}
                      >
                        {filedOnSort === 'desc' ? (
                          <ArrowDown className="size-3.5" aria-hidden="true" />
                        ) : (
                          <ArrowUp className="size-3.5" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wide">
                    Leave Period
                  </th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wide">
                    Duration
                  </th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-5 py-3 text-center font-bold uppercase tracking-wide">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {showTableSkeleton ? (
                  <TableBodySkeleton rows={pageSize} cols={6} />
                ) : paginatedItems.length === 0 ? (
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
                  paginatedItems.map((request) => {
                    const uiStatus = mapApiLeaveStatusToUi(request.status)
                    const filedOn = request.created_at
                      ? formatShortDate(request.created_at.slice(0, 10))
                      : '—'

                    return (
                      <tr
                        key={request.id}
                        className={`${TABLE_BODY_ROW_BORDER_CLASS} text-body text-text-black ${TABLE_ROW_HEIGHT_CLASS}`}
                      >
                        <td className="truncate px-5">
                          {formatLeaveTypeName(request.leave_type)}
                        </td>
                        <td className="px-5 whitespace-nowrap">{filedOn}</td>
                        <td className="truncate px-5">
                          {formatLeavePeriod(
                            request.start_date,
                            request.end_date,
                          )}
                        </td>
                        <td className="px-5 whitespace-nowrap">
                          {formatDurationDays(request.duration)}
                        </td>
                        <td className="px-5">
                          <StatusBadge status={uiStatus} />
                        </td>
                        <td className="px-5 text-center">
                          <Link
                            to={`/my-leave/requests/${request.id}`}
                            className={TABLE_ACTION_BUTTON_CLASS}
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div ref={paginationRef} className={TABLE_PAGINATION_WRAP}>
            {!showTableSkeleton ? (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredRequests.length}
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
