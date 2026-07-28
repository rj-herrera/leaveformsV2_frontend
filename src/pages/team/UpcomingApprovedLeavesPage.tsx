import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Search } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { FilterSelect } from '../../components/ui/FilterSelect'
import { Pagination } from '../../components/ui/Pagination'
import { TableBodySkeleton } from '../../components/ui/Skeleton'
import {
  TABLE_ROW_HEIGHT_CLASS,
  usePageSizeFromHeight,
} from '../../hooks/usePageSizeFromHeight'
import { usePagination } from '../../hooks/usePagination'
import { shouldShowDataSkeleton } from '../../mocks/config'
import {
  filterCalendarEntries,
  getTeamCalendarEntries,
  getUpcomingApprovedLeaves,
} from '../../mocks/teamLeaveCalendar'
import { todayISO } from '../../utils/leaveDates'

type LeaveTypeFilter = 'ALL' | string
type GroupFilter = 'ALL' | string

export function UpcomingApprovedLeavesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const tableAreaRef = useRef<HTMLDivElement>(null)
  const pageSize = usePageSizeFromHeight(tableAreaRef)
  const today = todayISO()
  const showSkeleton = shouldShowDataSkeleton()

  const [search, setSearch] = useState('')
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<LeaveTypeFilter>('ALL')
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('ALL')

  const allItems = useMemo(() => {
    const entries = getTeamCalendarEntries(user.id)
    return getUpcomingApprovedLeaves(entries, today)
  }, [user.id, today])

  const leaveTypeOptions = useMemo(() => {
    const types = Array.from(
      new Set(allItems.map((item) => item.leaveType)),
    ).sort((a, b) => a.localeCompare(b))
    return [
      { value: 'ALL' as const, label: 'All Leave Types' },
      ...types.map((type) => ({ value: type, label: type })),
    ]
  }, [allItems])

  const groupOptions = useMemo(() => {
    const groups = Array.from(
      new Set(allItems.map((item) => item.groupLabel)),
    ).sort((a, b) => a.localeCompare(b))
    return [
      { value: 'ALL' as const, label: 'All Groups' },
      ...groups.map((group) => ({ value: group, label: group })),
    ]
  }, [allItems])

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase()
    return filterCalendarEntries(allItems, {
      leaveType: leaveTypeFilter,
      group: groupFilter,
    }).filter((item) => {
      if (query.length === 0) return true
      return (
        item.employeeName.toLowerCase().includes(query) ||
        item.employeeNumber.toLowerCase().includes(query)
      )
    })
  }, [allItems, leaveTypeFilter, groupFilter, search])

  const { currentPage, setCurrentPage, totalPages, paginatedItems } =
    usePagination(
      filteredItems,
      pageSize,
      `upcoming-${user.id}-${search}-${leaveTypeFilter}-${groupFilter}`,
    )

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
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

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-surface">
        <div className="flex shrink-0 flex-col gap-3 border-b border-border px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
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
                className="w-full rounded-md border border-border bg-surface py-1.5 pr-3 pl-9 text-small text-text-black outline-none placeholder:text-text-gray focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>

            <FilterSelect
              label="Filter by leave type"
              value={leaveTypeFilter}
              onChange={setLeaveTypeFilter}
              options={leaveTypeOptions}
            />
            <FilterSelect
              label="Filter by group"
              value={groupFilter}
              onChange={setGroupFilter}
              options={groupOptions}
            />
          </div>
        </div>

        <div
          ref={tableAreaRef}
          className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden"
        >
          <table className="w-full min-w-[40rem] table-fixed text-left">
            <thead className="sticky top-0 z-10 bg-surface-muted">
              <tr className="h-11 border-b border-border text-small text-text-gray">
                <th className="px-5 py-3 font-bold uppercase tracking-wide">Leave Period</th>
                <th className="px-5 py-3 font-bold uppercase tracking-wide">Employee</th>
                <th className="px-5 py-3 font-bold uppercase tracking-wide">Leave Type</th>
                <th className="px-5 py-3 font-bold uppercase tracking-wide">Duration</th>
                <th className="px-5 py-3 font-bold uppercase tracking-wide">Group</th>
              </tr>
            </thead>
            <tbody>
              {showSkeleton ? (
                <TableBodySkeleton rows={pageSize} cols={5} />
              ) : paginatedItems.length === 0 ? (
                <tr className={TABLE_ROW_HEIGHT_CLASS}>
                  <td
                    colSpan={5}
                    className="px-5 text-center text-body text-text-gray"
                  >
                    No upcoming approved leaves match the selected filters.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => (
                  <tr
                    key={item.id}
                    role="link"
                    tabIndex={0}
                    onClick={() => navigate(`/team/leave-requests/${item.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        navigate(`/team/leave-requests/${item.id}`)
                      }
                    }}
                    className={`cursor-pointer border-b border-border/60 transition-colors last:border-b-0 hover:bg-surface-muted ${TABLE_ROW_HEIGHT_CLASS}`}
                  >
                    <td className="px-5 text-body text-text-black">
                      {item.periodLabel}
                    </td>
                    <td className="px-5 text-body text-text-black">
                      {item.employeeName}
                    </td>
                    <td className="px-5 text-body text-text-black">
                      {item.leaveType}
                    </td>
                    <td className="px-5 text-body text-text-black">
                      {item.duration}
                    </td>
                    <td className="px-5 text-body text-text-black">
                      {item.groupLabel}
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
          totalItems={filteredItems.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </section>
    </div>
  )
}
