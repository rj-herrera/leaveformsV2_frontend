import { useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Search } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { FilterSelect } from '../../components/ui/FilterSelect'
import { MonthYearPickerField } from '../../components/ui/form/MonthYearPickerField'
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
import { TABLE_BODY_ROW_BORDER_CLASS } from '../../components/ui/tableStyles'
import { useContentSizedTablePageSize } from '../../hooks/useContentSizedTablePageSize'
import {
  APPROVALS_TABLE_ROW_HEIGHT,
  APPROVALS_TABLE_ROW_HEIGHT_CLASS,
} from '../../hooks/usePageSizeFromHeight'
import { usePagination } from '../../hooks/usePagination'
import { formatActivityTimestamp } from '../../mocks/activityLog'
import {
  filterAdminLogEntries,
  getAdminLogEntries,
} from '../../mocks/adminLog'
import { shouldShowDataSkeleton } from '../../mocks/config'

type LeaveTypeFilter = 'ALL' | string
type GroupFilter = 'ALL' | string
type DateSort = 'desc' | 'asc'

/** Shared height for all filter bar controls so they align visually. */
const FILTER_H = 'h-[2.125rem]'

export function AdminAdministrativeLogPage() {
  const location = useLocation()
  const availableSlotRef = useRef<HTMLDivElement>(null)
  const sectionHeaderRef = useRef<HTMLDivElement>(null)
  const paginationRef = useRef<HTMLDivElement>(null)
  const tableAreaRef = useRef<HTMLDivElement>(null)
  const pageSize = useContentSizedTablePageSize(
    {
      availableSlotRef,
      sectionHeaderRef,
      paginationRef,
      tableAreaRef,
    },
    { fallbackRowHeight: APPROVALS_TABLE_ROW_HEIGHT },
  )
  const showSkeleton = shouldShowDataSkeleton()

  const [search, setSearch] = useState('')
  const [leaveTypeFilter, setLeaveTypeFilter] =
    useState<LeaveTypeFilter>('ALL')
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('ALL')
  const [monthYear, setMonthYear] = useState('')
  const [dateSort, setDateSort] = useState<DateSort>('desc')

  /** Re-read mock store whenever this route is entered (e.g. after adjust). */
  const allEntries = useMemo(
    () => getAdminLogEntries(),
    [location.key],
  )

  const leaveTypeOptions = useMemo(
    () => [
      { value: 'ALL' as const, label: 'All Leave Types' },
      ...Array.from(
        new Set(
          allEntries
            .map((row) => row.leaveType)
            .filter((type): type is string => Boolean(type)),
        ),
      )
        .sort((a, b) => a.localeCompare(b))
        .map((leaveType) => ({
          value: leaveType,
          label: leaveType,
        })),
    ],
    [allEntries],
  )

  const groupOptions = useMemo(
    () => [
      { value: 'ALL' as const, label: 'All Groups' },
      ...Array.from(
        new Set(
          allEntries
            .map((row) => row.groupLabel)
            .filter((group): group is string => Boolean(group)),
        ),
      )
        .sort((a, b) => a.localeCompare(b))
        .map((group) => ({
          value: group,
          label: group,
        })),
    ],
    [allEntries],
  )

  const filteredEntries = useMemo(() => {
    const filtered = filterAdminLogEntries(allEntries, {
      search,
      leaveType: leaveTypeFilter,
      group: groupFilter,
      monthYear,
    })

    return [...filtered].sort((a, b) =>
      dateSort === 'desc'
        ? b.occurredAt.localeCompare(a.occurredAt)
        : a.occurredAt.localeCompare(b.occurredAt),
    )
  }, [allEntries, search, leaveTypeFilter, groupFilter, monthYear, dateSort])

  const filterResetKey = [
    search,
    leaveTypeFilter,
    groupFilter,
    monthYear,
    dateSort,
  ].join('|')

  const { currentPage, setCurrentPage, totalPages, paginatedItems } =
    usePagination(filteredEntries, pageSize, filterResetKey)

  return (
    <div className={`${TABLE_PAGE_ROOT} gap-4`}>
      <h1 className="shrink-0 text-h1 text-text-black">Administrative Log</h1>

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
                  className={`w-full rounded-md border border-border bg-surface pr-3 pl-9 text-small text-text-black outline-none placeholder:text-text-gray focus:border-primary focus:ring-2 focus:ring-primary/20 ${FILTER_H}`}
                />
              </label>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <FilterSelect
                  label="Filter by group"
                  value={groupFilter}
                  onChange={setGroupFilter}
                  options={groupOptions}
                  fitContent
                  selectHeight={FILTER_H}
                />
                <FilterSelect
                  label="Filter by leave type"
                  value={leaveTypeFilter}
                  onChange={setLeaveTypeFilter}
                  options={leaveTypeOptions}
                  fitContent
                  selectHeight={FILTER_H}
                />
                <MonthYearPickerField
                  label="Filter by month and year"
                  value={monthYear}
                  onChange={setMonthYear}
                  emptyLabel="All Months"
                  allowClear
                  showLabel={false}
                  controlHeight={FILTER_H}
                />
              </div>
            </div>
          </div>

          <div ref={tableAreaRef} className={TABLE_CONTENT_AREA}>
            <table className="w-full min-w-[900px] table-fixed text-left">
              <colgroup>
                <col className="w-[16%]" />
                <col className="w-[22%]" />
                <col className="w-[18%]" />
                <col className="w-[16%]" />
                <col className="w-[12%]" />
                <col className="w-[16%]" />
              </colgroup>
              <thead>
                <tr className="h-11 border-b border-border bg-surface-muted text-small text-text-gray">
                  <th className="px-5 py-3 font-bold uppercase tracking-wide">
                    <div className="flex items-center gap-1.5">
                      <span>Date</span>
                      <button
                        type="button"
                        onClick={() =>
                          setDateSort((sort) =>
                            sort === 'desc' ? 'asc' : 'desc',
                          )
                        }
                        className="inline-flex rounded p-0.5 text-text-gray transition-colors hover:bg-background hover:text-text-black"
                        aria-label={`Sort date ${dateSort === 'desc' ? 'ascending' : 'descending'}`}
                      >
                        {dateSort === 'desc' ? (
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
                    Performed By
                  </th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wide">
                    Employee No.
                  </th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wide">
                    Employee Name
                  </th>
                </tr>
              </thead>
              <tbody>
                {showSkeleton ? (
                  <TableBodySkeleton
                    rows={pageSize}
                    cols={6}
                    rowClassName={APPROVALS_TABLE_ROW_HEIGHT_CLASS}
                  />
                ) : paginatedItems.length === 0 ? (
                  <tr className={APPROVALS_TABLE_ROW_HEIGHT_CLASS}>
                    <td
                      colSpan={6}
                      className="px-5 text-center text-body text-text-gray"
                    >
                      No logs match the selected filters.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((entry) => (
                    <tr
                      key={entry.id}
                      className={`${APPROVALS_TABLE_ROW_HEIGHT_CLASS} ${TABLE_BODY_ROW_BORDER_CLASS}`}
                    >
                      <td className="whitespace-nowrap px-5 text-body text-text-black">
                        {formatActivityTimestamp(entry.occurredAt)}
                      </td>
                      <td
                        className="truncate px-5 text-body text-text-black"
                        title={entry.activity}
                      >
                        {entry.activity}
                      </td>
                      <td
                        className="truncate px-5 text-body text-text-black"
                        title={entry.leaveType ?? undefined}
                      >
                        {entry.leaveType ?? '—'}
                      </td>
                      <td
                        className="truncate px-5 text-body text-text-black"
                        title={entry.actorName}
                      >
                        {entry.actorName}
                      </td>
                      <td className="px-5 text-body text-text-black">
                        {entry.employeeNumber ?? '—'}
                      </td>
                      <td
                        className="truncate px-5 text-body text-text-black"
                        title={entry.targetEmployeeName}
                      >
                        {entry.targetEmployeeName}
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
