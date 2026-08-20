import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Search } from 'lucide-react'
import type { TeamCalendarEntry } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
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
  TABLE_SEARCH_INPUT_CLASS,
  TABLE_ROW_HEIGHT,
  TABLE_ROW_HEIGHT_CLASS,
} from '../../components/ui/tableStyles'
import {
  SICK_LEAVE_THEME,
  VACATION_LEAVE_THEME,
} from '../../constants/leaveTypeTheme'
import { useTeamCalendar } from '../../hooks/api/useTeamCalendar'
import { useContentSizedTableRefs } from '../../hooks/useContentSizedTableRefs'
import { usePagination } from '../../hooks/usePagination'
import {
  formatDurationDays,
  formatLeavePeriod,
} from '../../utils/leaveDisplay'
import { todayISO } from '../../utils/leaveDates'
import { addDaysIso } from '../../utils/teamCalendarGrid'

type LeaveTypeFilter = 'ALL' | 'VL' | 'SL'
type GroupFilter = 'ALL' | string

const LEAVE_TYPE_FILTER_OPTIONS = [
  { value: 'ALL' as const, label: 'All Leave Types' },
  { value: 'VL' as const, label: VACATION_LEAVE_THEME.label },
  { value: 'SL' as const, label: SICK_LEAVE_THEME.label },
]

function groupOptionLabel(group: {
  abbreviation: string | null
  name: string | null
  id: number
}): string {
  return group.abbreviation?.trim() || group.name?.trim() || String(group.id)
}

function employeeName(entry: TeamCalendarEntry): string {
  return entry.employee?.name?.trim() || '—'
}

function employeeNumber(entry: TeamCalendarEntry): string {
  return entry.employee?.employee_number ?? '—'
}

function leaveTypeLabel(entry: TeamCalendarEntry): string {
  return entry.leave_type.name
}

function groupLabel(entry: TeamCalendarEntry): string {
  const group = entry.employee?.group
  if (!group) return '—'
  return group.abbreviation?.trim() || group.name?.trim() || '—'
}

function calendarEntryDuration(entry: TeamCalendarEntry): string {
  return formatDurationDays(entry.duration)
}

export function UpcomingApprovedLeavesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const {
    availableSlotRef,
    sectionHeaderRef,
    paginationRef,
    tableAreaRef,
    pageSize,
  } = useContentSizedTableRefs()
  const today = todayISO()

  const [search, setSearch] = useState('')
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<LeaveTypeFilter>('ALL')
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('ALL')

  const calendarParams = useMemo(
    () => ({
      from: addDaysIso(today, 1),
      to: addDaysIso(today, 61),
      code: leaveTypeFilter === 'ALL' ? undefined : leaveTypeFilter,
      group_id: groupFilter === 'ALL' ? undefined : Number(groupFilter),
    }),
    [today, leaveTypeFilter, groupFilter],
  )

  const { data, error, isLoading } = useTeamCalendar(calendarParams)

  const groupOptions = useMemo(
    () => [
      { value: 'ALL' as const, label: 'All Groups' },
      ...user.picGroups.map((group) => ({
        value: String(group.id),
        label: groupOptionLabel(group),
      })),
    ],
    [user.picGroups],
  )

  const allItems = useMemo(() => {
    if (!data) return []
    return [...data]
      .filter((entry) => entry.start_date > today)
      .sort((a, b) => a.start_date.localeCompare(b.start_date))
  }, [data, today])

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (query.length === 0) return allItems

    return allItems.filter((entry) => {
      const name = employeeName(entry).toLowerCase()
      const number = employeeNumber(entry).toLowerCase()
      return name.includes(query) || number.includes(query)
    })
  }, [allItems, search])

  const { currentPage, setCurrentPage, totalPages, paginatedItems } =
    usePagination(
      filteredItems,
      pageSize,
      `upcoming-${user.id}-${search}-${leaveTypeFilter}-${groupFilter}`,
    )

  const showSkeleton = isLoading && !data

  const hasActiveFilters =
    search.trim().length > 0 ||
    leaveTypeFilter !== 'ALL' ||
    groupFilter !== 'ALL'

  function clearFilters() {
    setSearch('')
    setLeaveTypeFilter('ALL')
    setGroupFilter('ALL')
  }

  return (
    <div className={`${TABLE_PAGE_ROOT} gap-4`}>
      <Link
        to="/team/leave-calendar"
        className="text-body inline-flex w-fit shrink-0 items-center gap-1.5 text-text-gray transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to Team Leave Calendar
      </Link>

      <h1 className="shrink-0 text-h1 text-text-black">
        Upcoming Approved Leaves
      </h1>

      <div ref={availableSlotRef} className={TABLE_AVAILABLE_SLOT}>
        <section
          className={`${TABLE_CONTENT_SECTION} rounded-lg border border-border bg-surface`}
        >
          <div
            ref={sectionHeaderRef}
            className="flex shrink-0 flex-col gap-3 border-b border-border px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center lg:justify-end">
              <label className="relative block min-w-0 flex-1">
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

              <FilterSelect
                label="Filter by leave type"
                value={leaveTypeFilter}
                onChange={setLeaveTypeFilter}
                options={LEAVE_TYPE_FILTER_OPTIONS}
                selectHeight="h-[2.125rem]"
              />
              <FilterSelect
                label="Filter by group"
                value={groupFilter}
                onChange={setGroupFilter}
                options={groupOptions}
                selectHeight="h-[2.125rem]"
              />
            </div>
          </div>

          <div ref={tableAreaRef} className={TABLE_CONTENT_AREA}>
            <table className="w-full min-w-[40rem] table-fixed text-left">
              <thead>
                <tr className="h-11 border-b border-border bg-surface-muted text-small text-text-gray">
                  <th className="px-5 py-3 font-bold uppercase tracking-wide">
                    Leave Period
                  </th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wide">
                    Employee No.
                  </th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wide">
                    Employee Name
                  </th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wide">
                    Leave Type
                  </th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wide">
                    Duration
                  </th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wide">
                    Group
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
                      Unable to load upcoming leaves. Please try again.
                    </td>
                  </tr>
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
                  paginatedItems.map((entry) => (
                    <tr
                      key={entry.id}
                      role="link"
                      tabIndex={0}
                      onClick={() =>
                        navigate(`/team/leave-requests/${entry.id}`)
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          navigate(`/team/leave-requests/${entry.id}`)
                        }
                      }}
                      className={`cursor-pointer ${TABLE_BODY_ROW_BORDER_CLASS} transition-colors hover:bg-surface-muted ${TABLE_ROW_HEIGHT_CLASS}`}
                    >
                      <td className="px-5 text-body text-text-black">
                        {formatLeavePeriod(entry.start_date, entry.end_date)}
                      </td>
                      <td className="px-5 text-body text-text-black">
                        {employeeNumber(entry)}
                      </td>
                      <td className="px-5 text-body text-text-black">
                        {employeeName(entry)}
                      </td>
                      <td className="px-5 text-body text-text-black">
                        {leaveTypeLabel(entry)}
                      </td>
                      <td className="px-5 text-body text-text-black">
                        {calendarEntryDuration(entry)}
                      </td>
                      <td className="px-5 text-body text-text-black">
                        {groupLabel(entry)}
                      </td>
                    </tr>
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
