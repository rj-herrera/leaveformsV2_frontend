import { useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
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
import {
  SICK_LEAVE_THEME,
  VACATION_LEAVE_THEME,
} from '../../constants/leaveTypeTheme'
import { useContentSizedTablePageSize } from '../../hooks/useContentSizedTablePageSize'
import { TABLE_ROW_HEIGHT_CLASS } from '../../hooks/usePageSizeFromHeight'
import { usePagination } from '../../hooks/usePagination'
import {
  formatActivityTimestamp,
  getActivityLogEntriesForEmployee,
  matchesActivityLeaveType,
} from '../../mocks/activityLog'
import { shouldShowDataSkeleton } from '../../mocks/config'

type LeaveTypeFilter = 'ALL' | string
type TimestampSort = 'desc' | 'asc'

export function ActivityLogPage() {
  const { user } = useAuth()
  const availableSlotRef = useRef<HTMLDivElement>(null)
  const sectionHeaderRef = useRef<HTMLDivElement>(null)
  const paginationRef = useRef<HTMLDivElement>(null)
  const tableAreaRef = useRef<HTMLDivElement>(null)
  const pageSize = useContentSizedTablePageSize({
    availableSlotRef,
    sectionHeaderRef,
    paginationRef,
    tableAreaRef,
  })
  const showSkeleton = shouldShowDataSkeleton()

  const [leaveTypeFilter, setLeaveTypeFilter] =
    useState<LeaveTypeFilter>('ALL')
  const [timestampSort, setTimestampSort] = useState<TimestampSort>('desc')
  const allEntries = useMemo(
    () => getActivityLogEntriesForEmployee(user.id),
    [user.id],
  )

  const leaveTypeFilterOptions = useMemo(() => {
    const fromData = Array.from(
      new Set(
        allEntries
          .map((entry) => entry.leaveType)
          .filter((type) => !type.includes(' to ')),
      ),
    ).sort((a, b) => a.localeCompare(b))

    const preferred = [
      VACATION_LEAVE_THEME.label,
      SICK_LEAVE_THEME.label,
      ...fromData.filter(
        (type) =>
          type !== VACATION_LEAVE_THEME.label &&
          type !== SICK_LEAVE_THEME.label,
      ),
    ]

    return [
      { value: 'ALL' as const, label: 'All Leave Types' },
      ...preferred.map((type) => ({ value: type, label: type })),
    ]
  }, [allEntries])

  const filteredEntries = useMemo(() => {
    const filtered = allEntries.filter((entry) =>
      matchesActivityLeaveType(entry.leaveType, leaveTypeFilter),
    )

    return [...filtered].sort((a, b) =>
      timestampSort === 'desc'
        ? b.occurredAt.localeCompare(a.occurredAt)
        : a.occurredAt.localeCompare(b.occurredAt),
    )
  }, [allEntries, leaveTypeFilter, timestampSort])

  const filterResetKey = `${leaveTypeFilter}|${timestampSort}`

  const { currentPage, setCurrentPage, totalPages, paginatedItems } =
    usePagination(filteredEntries, pageSize, filterResetKey)

  return (
    <div className={`${TABLE_PAGE_ROOT} gap-4`}>
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-h1 text-text-black">Activity Log</h1>
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            label="Filter by leave type"
            value={leaveTypeFilter}
            onChange={setLeaveTypeFilter}
            options={leaveTypeFilterOptions}
          />
        </div>
      </div>

      <div ref={availableSlotRef} className={TABLE_AVAILABLE_SLOT}>
        <section
          className={`${TABLE_CONTENT_SECTION} rounded-lg border border-border bg-surface`}
        >
          {/* No in-card header; ref unused so measured chrome height is 0. */}
          <div ref={sectionHeaderRef} className="hidden" aria-hidden="true" />

          <div ref={tableAreaRef} className={TABLE_CONTENT_AREA}>
            <table className="w-full min-w-[880px] table-fixed text-left">
              <colgroup>
                <col className="w-[16%]" />
                <col className="w-[20%]" />
                <col className="w-[16%]" />
                <col className="w-[18%]" />
                <col className="w-[14%]" />
                <col className="w-[16%]" />
              </colgroup>
              <thead>
                <tr className="h-11 bg-surface-muted border-b border-border text-small text-text-gray">
                  <th className="px-5 py-3 font-bold uppercase tracking-wide">
                    <div className="flex items-center gap-1.5">
                      <span>Timestamp</span>
                      <button
                        type="button"
                        onClick={() =>
                          setTimestampSort((sort) =>
                            sort === 'desc' ? 'asc' : 'desc',
                          )
                        }
                        className="inline-flex rounded p-0.5 text-text-gray transition-colors hover:bg-background hover:text-text-black"
                        aria-label={`Sort timestamp ${timestampSort === 'desc' ? 'ascending' : 'descending'}`}
                      >
                        {timestampSort === 'desc' ? (
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
                    Balance Impact
                  </th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wide">
                    Performed By
                  </th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wide">
                    Remarks
                  </th>
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
                      No activity matches the selected filters.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((entry) => (
                    <tr
                      key={entry.id}
                      className={`border-b border-border/60 text-body text-text-black last:border-b-0 ${TABLE_ROW_HEIGHT_CLASS}`}
                    >
                      <td className="px-5 whitespace-nowrap">
                        {formatActivityTimestamp(entry.occurredAt)}
                      </td>
                      <td className="truncate px-5" title={entry.activity}>
                        {entry.activity}
                      </td>
                      <td className="truncate px-5" title={entry.leaveType}>
                        {entry.leaveType}
                      </td>
                      <td
                        className="truncate px-5"
                        title={entry.balanceImpact}
                      >
                        {entry.balanceImpact}
                      </td>
                      <td className="truncate px-5" title={entry.performedBy}>
                        {entry.performedBy}
                      </td>
                      <td
                        className="truncate px-5 text-text-gray"
                        title={entry.remarks ?? undefined}
                      >
                        {entry.remarks ?? '—'}
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
                totalItems={filteredEntries.length}
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
