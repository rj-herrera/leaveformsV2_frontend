import { useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { FilterSelect } from '../../components/ui/FilterSelect'
import { LeaveTypeIconBadge } from '../../components/ui/LeaveTypeIconBadge'
import { Pagination } from '../../components/ui/Pagination'
import {
  BalanceCardSkeleton,
  TableBodySkeleton,
} from '../../components/ui/Skeleton'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { TABLE_ACTION_BUTTON_CLASS } from '../../components/ui/tableStyles'
import {
  STATUS_FILTER_OPTIONS,
  type StatusFilter,
} from '../../constants/leaveStatus'
import {
  getSelectableLeaveThemes,
  SELECTABLE_LEAVE_DEFAULT,
  SICK_LEAVE_THEME,
  VACATION_LEAVE_THEME,
  type SelectableLeaveType,
} from '../../constants/leaveTypeTheme'
import {
  TABLE_ROW_HEIGHT_CLASS,
  usePageSizeFromHeight,
} from '../../hooks/usePageSizeFromHeight'
import { usePagination } from '../../hooks/usePagination'
import { shouldShowDataSkeleton } from '../../mocks/config'
import {
  PARENTAL_CREDITS_REQUIRES_REQUEST_MESSAGE,
} from '../../mocks/leaveBalances'
import {
  canViewParentalLeaveCredits,
  getLeaveRequestsForRole,
} from '../../mocks/leaveRequests'

type LeaveTypeFilter = 'ALL' | string
type FiledOnSort = 'desc' | 'asc'

/** TODO(REPLACE): Leave balances — replace with API data when wired. */
const MOCK_OTHER_BALANCES = {
  emergency: 3,
  ptb: 7,
  maternity: 105,
  paternity: 7,
} as const

const MOCK_VL_AVAILABLE = 12
const MOCK_VL_RESERVED = 3
const MOCK_SL_AVAILABLE = 14

export function DashboardPage() {
  const { user, mockPersona } = useAuth()
  const tableAreaRef = useRef<HTMLDivElement>(null)
  const pageSize = usePageSizeFromHeight(tableAreaRef)
  const showSkeleton = shouldShowDataSkeleton()

  const [isLeaveTypeOpen, setIsLeaveTypeOpen] = useState(false)
  const [selectedLeaveType, setSelectedLeaveType] =
    useState<SelectableLeaveType | null>(null)
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<LeaveTypeFilter>('ALL')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [filedOnSort, setFiledOnSort] = useState<FiledOnSort>('desc')
  const [filterPersona, setFilterPersona] = useState(mockPersona)

  // Reset filters when the preview persona changes (avoid setState-in-effect).
  if (filterPersona !== mockPersona) {
    setFilterPersona(mockPersona)
    setLeaveTypeFilter('ALL')
    setStatusFilter('ALL')
    setSelectedLeaveType(null)
  }

  const roleLeaveRequests = useMemo(
    () => getLeaveRequestsForRole(mockPersona),
    [mockPersona],
  )
  const parentalLabel =
    user.gender === 'female' ? 'Maternity Leave' : 'Paternity Leave'

  const selectableLeaveThemes = useMemo(
    () => getSelectableLeaveThemes(parentalLabel, user.gender),
    [parentalLabel, user.gender],
  )

  const selectedLeaveTheme = selectedLeaveType
    ? selectableLeaveThemes[selectedLeaveType]
    : SELECTABLE_LEAVE_DEFAULT

  const leaveTypeOptions = useMemo(
    () =>
      (['emergency', 'ptb', 'parental'] as const).map((id) => ({
        id,
        ...selectableLeaveThemes[id],
      })),
    [selectableLeaveThemes],
  )

  const leaveTypeFilterOptions = useMemo(() => {
    const types = Array.from(
      new Set(roleLeaveRequests.map((request) => request.leaveType)),
    ).sort((a, b) => a.localeCompare(b))

    return [
      { value: 'ALL' as const, label: 'All leave types' },
      ...types.map((type) => ({ value: type, label: type })),
    ]
  }, [roleLeaveRequests])

  const selectedOption = selectedLeaveType
    ? leaveTypeOptions.find((option) => option.id === selectedLeaveType)
    : undefined

  const canViewSelectedParentalCredits =
    selectedLeaveType !== 'parental' ||
    canViewParentalLeaveCredits(user.id, parentalLabel)

  const selectedAvailableDays = (() => {
    if (!selectedLeaveType) return null
    if (selectedLeaveType === 'emergency') return MOCK_OTHER_BALANCES.emergency
    if (selectedLeaveType === 'ptb') return MOCK_OTHER_BALANCES.ptb
    if (!canViewSelectedParentalCredits) return null
    return user.gender === 'female'
      ? MOCK_OTHER_BALANCES.maternity
      : MOCK_OTHER_BALANCES.paternity
  })()

  const filteredRequests = useMemo(() => {
    return roleLeaveRequests
      .filter((request) => {
        const matchesType =
          leaveTypeFilter === 'ALL' || request.leaveType === leaveTypeFilter
        const matchesStatus =
          statusFilter === 'ALL' || request.status === statusFilter
        return matchesType && matchesStatus
      })
      .sort((a, b) => {
        const diff =
          new Date(a.filedOnDate).getTime() - new Date(b.filedOnDate).getTime()
        return filedOnSort === 'asc' ? diff : -diff
      })
  }, [roleLeaveRequests, leaveTypeFilter, statusFilter, filedOnSort])

  const { currentPage, setCurrentPage, totalPages, paginatedItems } =
    usePagination(
      filteredRequests,
      pageSize,
      `${mockPersona}-${leaveTypeFilter}-${statusFilter}-${filedOnSort}`,
    )

  function handleSelectLeaveType(type: SelectableLeaveType) {
    setSelectedLeaveType(type)
    setIsLeaveTypeOpen(false)
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      {/* Balance cards */}
      <section className="grid shrink-0 grid-cols-1 gap-4 md:grid-cols-3">
        {showSkeleton ? (
          <>
            <BalanceCardSkeleton />
            <BalanceCardSkeleton />
            <BalanceCardSkeleton />
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
              {MOCK_VL_AVAILABLE}
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
                {MOCK_VL_RESERVED} days
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
              {MOCK_SL_AVAILABLE}
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
              {leaveTypeOptions.map((option) => (
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
            {selectedLeaveType === 'parental' &&
            !canViewSelectedParentalCredits ? (
              <p className="px-2 text-small text-text-gray">
                {PARENTAL_CREDITS_REQUIRES_REQUEST_MESSAGE}
              </p>
            ) : (
              <>
                <p className="text-[2.5rem] text-4xl leading-none font-bold text-text-black">
                  {selectedAvailableDays ?? '—'}
                </p>
                <p className="text-body text-text-gray mt-1.5">days available</p>
              </>
            )}
          </div>
        </article>
          </>
        )}
      </section>

      {/* My Leave Requests */}
      <section className="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-white">
        <div className="flex shrink-0 flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
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

        <div
          ref={tableAreaRef}
          className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden"
        >
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
                <th className="px-5 py-3 font-bold uppercase tracking-wide">Leave Type</th>
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
                <th className="px-5 py-3 font-bold uppercase tracking-wide">Leave Period</th>
                <th className="px-5 py-3 font-bold uppercase tracking-wide">Duration</th>
                <th className="px-5 py-3 font-bold uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-center font-bold uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody>
              {showSkeleton ? (
                <TableBodySkeleton rows={pageSize} cols={6} />
              ) : paginatedItems.length === 0 ? (
                <tr className={TABLE_ROW_HEIGHT_CLASS}>
                  <td
                    colSpan={6}
                    className="px-5 text-center text-body text-text-gray"
                  >
                    No leave requests match the selected filters.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((request) => (
                  <tr
                    key={request.id}
                    className={`border-b border-black/5 text-body text-text-black last:border-b-0 ${TABLE_ROW_HEIGHT_CLASS}`}
                  >
                    <td className="truncate px-5">{request.leaveType}</td>
                    <td className="px-5 whitespace-nowrap">
                      {request.filedOnLabel}
                    </td>
                    <td className="truncate px-5">{request.period}</td>
                    <td className="px-5 whitespace-nowrap">
                      {request.duration}
                    </td>
                    <td className="px-5">
                      <StatusBadge status={request.status} />
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
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredRequests.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </section>
    </div>
  )
}
