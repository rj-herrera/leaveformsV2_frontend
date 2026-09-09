import { useMemo, useState } from 'react'
import { Download, Search } from 'lucide-react'
import { ApiError } from '../../api/axios-client'
import type { ListEmployeesWithLwopParams } from '../../api/adminEmployeesWithLwop'
import type {
  EmployeesWithLwopGrandTotals,
  EmployeesWithLwopReport,
  EmployeesWithLwopRow,
} from '../../api/types'
import { Button } from '../../components/ui/Button'
import { ClearFiltersButton, EmptyState } from '../../components/ui/EmptyState'
import { FilterSelect } from '../../components/ui/FilterSelect'
import { fieldLabelClassName } from '../../components/ui/form/fieldStyles'
import { YearPickerField } from '../../components/ui/form/YearPickerField'
import { Pagination } from '../../components/ui/Pagination'
import { Skeleton } from '../../components/ui/Skeleton'
import { SortableHeader } from '../../components/ui/SortableHeader'
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
  TABLE_SEARCH_INPUT_BASE_CLASS,
  APPROVALS_TABLE_ROW_HEIGHT,
  APPROVALS_TABLE_ROW_HEIGHT_CLASS,
} from '../../components/ui/tableStyles'
import { useAdminEmployeesWithLwop } from '../../hooks/api/useAdminEmployeesWithLwop'
import { useAdminGroups } from '../../hooks/api/useAdminGroups'
import { useContentSizedTableRefs } from '../../hooks/useContentSizedTableRefs'
import { usePagination } from '../../hooks/usePagination'
import { downloadEmployeesWithLwopExcel } from '../../utils/exportEmployeesWithLwopExcel'
import { formatDateTime } from '../../utils/leaveDisplay'
import { compareEmployeeNumber } from '../../utils/sort'

type GroupFilter = 'ALL' | string
type SortKey = 'employeeNumber' | 'totalLwopDays'
type SortDir = 'asc' | 'desc'

const DEFAULT_YEAR = new Date().getFullYear()
const FILTER_CONTROL_H = 'h-[2.375rem]'
const SUMMARY_COL_COUNT = 8

const EMPTY_TOTALS: EmployeesWithLwopGrandTotals = {
  vl_balance: '0.00',
  vl_consumed: '0.00',
  sl_balance: '0.00',
  sl_consumed: '0.00',
  total_lwop_days: '0.00',
}

function messageFromApiError(error: unknown, fallback: string): string {
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
  return fallback
}

function formatDays(value: string): string {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '0'
  return Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(1)
}

function formatIsoDateLabel(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate)
  if (!match) return isoDate
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function groupOptionLabel(group: {
  abbreviation: string | null
  name: string | null
  id: number
}): string {
  return group.abbreviation?.trim() || group.name?.trim() || String(group.id)
}

function rowGroupLabel(row: EmployeesWithLwopRow): string {
  return (
    row.employee.group?.abbreviation?.trim() ||
    row.employee.group?.name?.trim() ||
    '—'
  )
}

function reportGroupLabel(report: EmployeesWithLwopReport): string {
  return (
    report.group?.abbreviation?.trim() ||
    report.group?.name?.trim() ||
    'All Groups'
  )
}

function filterRows(
  rows: EmployeesWithLwopRow[],
  search: string,
): EmployeesWithLwopRow[] {
  const query = search.trim().toLowerCase()
  if (query.length === 0) return rows
  return rows.filter((row) => {
    const name = row.employee.name.toLowerCase()
    const number = row.employee.employee_number.toLowerCase()
    return name.includes(query) || number.includes(query)
  })
}

function toAmount(value: string): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function fromAmount(value: number): string {
  return value.toFixed(2)
}

function sumTotals(rows: EmployeesWithLwopRow[]): EmployeesWithLwopGrandTotals {
  return rows.reduce<EmployeesWithLwopGrandTotals>(
    (acc, row) => ({
      vl_balance: fromAmount(toAmount(acc.vl_balance) + toAmount(row.vl_balance)),
      vl_consumed: fromAmount(
        toAmount(acc.vl_consumed) + toAmount(row.vl_consumed),
      ),
      sl_balance: fromAmount(toAmount(acc.sl_balance) + toAmount(row.sl_balance)),
      sl_consumed: fromAmount(
        toAmount(acc.sl_consumed) + toAmount(row.sl_consumed),
      ),
      total_lwop_days: fromAmount(
        toAmount(acc.total_lwop_days) + toAmount(row.total_lwop_days),
      ),
    }),
    { ...EMPTY_TOTALS },
  )
}

function paramsEqual(
  a: ListEmployeesWithLwopParams | null,
  b: ListEmployeesWithLwopParams,
): boolean {
  return a?.year === b.year && (a?.group_id ?? null) === (b.group_id ?? null)
}

export function EmployeesWithLwopPage() {
  const {
    availableSlotRef,
    sectionHeaderRef,
    paginationRef,
    tableAreaRef,
    pageSize,
  } = useContentSizedTableRefs({ fallbackRowHeight: APPROVALS_TABLE_ROW_HEIGHT })

  const [year, setYear] = useState<number | null>(DEFAULT_YEAR)
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('ALL')
  const [requestedParams, setRequestedParams] =
    useState<ListEmployeesWithLwopParams | null>(null)
  const [search, setSearch] = useState('')
  const [actionNotice, setActionNotice] = useState('')
  const [formError, setFormError] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('totalLwopDays')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [exporting, setExporting] = useState(false)

  const { data: adminGroups } = useAdminGroups()
  const { data, error, isLoading, isValidating, mutate } =
    useAdminEmployeesWithLwop(requestedParams)

  const report: EmployeesWithLwopReport | undefined = data
  const fetching =
    requestedParams != null && (isLoading || (isValidating && !report))
  const canGenerate = year != null && !fetching

  const groupOptions = useMemo(
    () => [
      { value: 'ALL' as const, label: 'All Groups' },
      ...(adminGroups ?? []).map((group) => ({
        value: String(group.id),
        label: groupOptionLabel(group),
      })),
    ],
    [adminGroups],
  )

  const filteredRows = useMemo(() => {
    if (!report) return []
    return filterRows(report.rows, search)
  }, [report, search])

  const sortedRows = useMemo(() => {
    const next = [...filteredRows]
    next.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'employeeNumber':
          cmp = compareEmployeeNumber(
            a.employee.employee_number,
            b.employee.employee_number,
          )
          break
        case 'totalLwopDays':
          cmp = toAmount(a.total_lwop_days) - toAmount(b.total_lwop_days)
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return next
  }, [filteredRows, sortKey, sortDir])

  const filterResetKey = `${search}|${sortKey}|${sortDir}|${requestedParams?.year ?? ''}|${requestedParams?.group_id ?? ''}`
  const { currentPage, setCurrentPage, totalPages, paginatedItems, totalItems } =
    usePagination(sortedRows, pageSize, filterResetKey)

  const hasActiveFilters = search.trim().length > 0

  function clearFilters() {
    setSearch('')
  }

  const filteredTotals = useMemo(() => {
    if (!report) return EMPTY_TOTALS
    if (!hasActiveFilters) return report.grand_totals
    return sumTotals(filteredRows)
  }, [filteredRows, hasActiveFilters, report])

  function handleYearChange(nextYear: number | null) {
    setYear(nextYear)
    setRequestedParams(null)
    setSearch('')
    setFormError('')
    setActionNotice('')
  }

  function handleGroupChange(value: GroupFilter) {
    setGroupFilter(value)
    setRequestedParams(null)
    setSearch('')
    setFormError('')
    setActionNotice('')
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((dir) => (dir === 'desc' ? 'asc' : 'desc'))
      return
    }
    setSortKey(key)
    setSortDir('desc')
  }

  function nextRequestParams(): ListEmployeesWithLwopParams | null {
    if (year == null) return null
    const groupId =
      groupFilter !== 'ALL' && Number.isInteger(Number(groupFilter))
        ? Number(groupFilter)
        : undefined
    return groupId != null ? { year, group_id: groupId } : { year }
  }

  function handleGenerate() {
    setActionNotice('')
    const next = nextRequestParams()
    if (next == null) {
      setFormError('Select a year.')
      setRequestedParams(null)
      return
    }

    setFormError('')
    setSortKey('totalLwopDays')
    setSortDir('desc')
    if (paramsEqual(requestedParams, next)) {
      void mutate()
      return
    }
    setRequestedParams(next)
  }

  function handleReset() {
    setYear(DEFAULT_YEAR)
    setGroupFilter('ALL')
    setRequestedParams(null)
    setSearch('')
    setSortKey('totalLwopDays')
    setSortDir('desc')
    setFormError('')
    setActionNotice('')
  }

  async function handleExportExcel() {
    if (!report) return
    setExporting(true)
    setActionNotice('')
    try {
      await downloadEmployeesWithLwopExcel({
        report,
        rows: sortedRows,
        totals: filteredTotals,
      })
    } catch {
      setActionNotice('Unable to export the Excel file. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const loadError =
    error != null
      ? messageFromApiError(error, 'Unable to load employees with LWOP.')
      : ''

  return (
    <div className={`${TABLE_PAGE_ROOT} gap-4`}>
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-h1 text-text-black">Employees with LWOP</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            disabled={!report}
            loading={exporting}
            loadingText="Exporting…"
            onClick={() => void handleExportExcel()}
          >
            <Download className="size-4" aria-hidden="true" />
            Export Excel
          </Button>
        </div>
      </div>

      <div ref={availableSlotRef} className={TABLE_AVAILABLE_SLOT}>
        <section
          className={`${TABLE_CONTENT_SECTION} rounded-lg border border-border bg-surface`}
        >
          <div ref={sectionHeaderRef} className="relative z-40 shrink-0">
            <div className="border-b border-border px-5 py-4">
              <div className="flex flex-wrap items-end gap-3">
                <YearPickerField
                  label="Year"
                  value={year}
                  onChange={handleYearChange}
                  controlHeight={FILTER_CONTROL_H}
                  className="min-w-[8rem]"
                  minYear={2020}
                  maxYear={2035}
                />

                <div className="min-w-[8rem]">
                  <span className={fieldLabelClassName}>Group</span>
                  <FilterSelect
                    label="Group"
                    value={groupFilter}
                    onChange={handleGroupChange}
                    options={groupOptions}
                    selectHeight={FILTER_CONTROL_H}
                  />
                </div>

                <label className="relative block min-w-[14rem] flex-1">
                  <span className={fieldLabelClassName}>Search Employee</span>
                  <span className="relative block">
                    <Search
                      className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-gray"
                      aria-hidden="true"
                    />
                    <input
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search employee name or number"
                      disabled={!report}
                      className={`${TABLE_SEARCH_INPUT_BASE_CLASS} disabled:cursor-not-allowed disabled:opacity-60 ${FILTER_CONTROL_H}`}
                    />
                  </span>
                </label>

                <div className="flex shrink-0 items-end gap-2">
                  <Button
                    variant="primary"
                    disabled={!canGenerate}
                    onClick={handleGenerate}
                  >
                    Generate Report
                  </Button>
                  <Button variant="secondary" onClick={handleReset}>
                    Reset Filters
                  </Button>
                </div>
              </div>

              {formError ? (
                <p role="alert" className="mt-2 text-body text-status-rejected">
                  {formError}
                </p>
              ) : null}
              {loadError ? (
                <p role="alert" className="mt-2 text-body text-status-rejected">
                  {loadError}
                </p>
              ) : null}
              {actionNotice ? (
                <p role="status" className="mt-2 text-body text-text-gray">
                  {actionNotice}
                </p>
              ) : null}
            </div>

            {report ? (
              <div className="border-b border-border px-5 py-4">
                <dl className="flex flex-wrap gap-x-6 gap-y-2 text-small text-text-gray">
                  <InfoItem
                    label="Reporting Period"
                    value={`${formatIsoDateLabel(report.period.start_date)} – ${formatIsoDateLabel(report.period.end_date)}`}
                  />
                  <InfoItem label="Group" value={reportGroupLabel(report)} />
                  <InfoItem
                    label="Employees"
                    value={String(filteredRows.length)}
                  />
                  <InfoItem
                    label="Date Generated"
                    value={formatDateTime(report.generated_at)}
                  />
                </dl>
              </div>
            ) : null}
          </div>

          <div ref={tableAreaRef} className={TABLE_CONTENT_AREA}>
            {fetching ? (
              <div className="flex flex-col gap-3 px-5 py-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-3/4" />
              </div>
            ) : report ? (
              <table className="w-full min-w-[56rem] table-fixed text-left">
                <thead>
                  <tr className="h-11 bg-surface-muted text-small text-text-gray">
                    <th className="border-b border-border px-4 py-3 font-bold uppercase tracking-wide">
                      <SortableHeader
                        label="Employee No."
                        active={sortKey === 'employeeNumber'}
                        direction={sortDir}
                        onToggle={() => toggleSort('employeeNumber')}
                      />
                    </th>
                    <th className="border-b border-border px-4 py-3 font-bold uppercase tracking-wide">
                      Employee Name
                    </th>
                    <th className="border-b border-border px-4 py-3 font-bold uppercase tracking-wide">
                      Group
                    </th>
                    <th className="border-b border-border px-3 py-3 text-center font-bold uppercase tracking-wide">
                      VL Balance
                    </th>
                    <th className="border-b border-border px-3 py-3 text-center font-bold uppercase tracking-wide">
                      VL Consumed
                    </th>
                    <th className="border-b border-border px-3 py-3 text-center font-bold uppercase tracking-wide">
                      SL Balance
                    </th>
                    <th className="border-b border-border px-3 py-3 text-center font-bold uppercase tracking-wide">
                      SL Consumed
                    </th>
                    <th className="border-b border-border px-3 py-3 text-center text-red-700 font-bold uppercase tracking-wide">
                      <SortableHeader
                        label="Total LWOP Days"
                        active={sortKey === 'totalLwopDays'}
                        direction={sortDir}
                        onToggle={() => toggleSort('totalLwopDays')}
                        align="center"
                      />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.length === 0 ? (
                    <TableEmptyRow
                      colSpan={SUMMARY_COL_COUNT}
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
                    paginatedItems.map((row) => (
                      <EmployeeRow key={row.employee.id} row={row} />
                    ))
                  )}
                </tbody>
                {paginatedItems.length > 0 ? (
                  <tfoot>
                    <tr className="bg-surface-muted font-semibold">
                      <td
                        colSpan={3}
                        className="border-t border-border bg-surface-muted px-4 py-2.5 text-body text-text-black"
                      >
                        Total
                      </td>
                      <td className="border-t border-border bg-surface-muted px-3 py-2.5 text-center text-body text-text-black">
                        {formatDays(filteredTotals.vl_balance)}
                      </td>
                      <td className="border-t border-border bg-surface-muted px-3 py-2.5 text-center text-body text-text-black">
                        {formatDays(filteredTotals.vl_consumed)}
                      </td>
                      <td className="border-t border-border bg-surface-muted px-3 py-2.5 text-center text-body text-text-black">
                        {formatDays(filteredTotals.sl_balance)}
                      </td>
                      <td className="border-t border-border bg-surface-muted px-3 py-2.5 text-center text-body text-text-black">
                        {formatDays(filteredTotals.sl_consumed)}
                      </td>
                      <td className="border-t border-border bg-red-50 px-3 py-2.5 text-center text-body text-red-700">
                        {formatDays(filteredTotals.total_lwop_days)}
                      </td>
                    </tr>
                  </tfoot>
                ) : null}
              </table>
            ) : (
              <EmptyState
                variant="no-data"
                message={
                  loadError
                    ? loadError
                    : 'Select a year, then click Generate Report to view employees with LWOP.'
                }
                className="min-h-[12rem]"
              />
            )}
          </div>

          <div ref={paginationRef} className={TABLE_PAGINATION_WRAP}>
            {report ? (
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
    </div>
  )
}

function EmployeeRow({ row }: { row: EmployeesWithLwopRow }) {
  return (
    <tr
      className={`${APPROVALS_TABLE_ROW_HEIGHT_CLASS} ${TABLE_BODY_ROW_BORDER_CLASS}`}
    >
      <td className="px-4 text-body text-text-black">
        {row.employee.employee_number}
      </td>
      <td className="px-4 text-body font-medium text-text-black">
        {row.employee.name}
      </td>
      <td className="px-4 text-body text-text-black">{rowGroupLabel(row)}</td>
      <td className="px-3 text-center text-body text-text-black">
        {formatDays(row.vl_balance)}
      </td>
      <td className="px-3 text-center text-body text-text-black">
        {formatDays(row.vl_consumed)}
      </td>
      <td className="px-3 text-center text-body text-text-black">
        {formatDays(row.sl_balance)}
      </td>
      <td className="px-3 text-center text-body text-text-black">
        {formatDays(row.sl_consumed)}
      </td>
      <td className="px-3 text-center bg-red-50 text-body text-red-700 font-semibold">
        {formatDays(row.total_lwop_days)}
      </td>
    </tr>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="inline font-semibold text-text-black">{label}: </dt>
      <dd className="inline">{value}</dd>
    </div>
  )
}
