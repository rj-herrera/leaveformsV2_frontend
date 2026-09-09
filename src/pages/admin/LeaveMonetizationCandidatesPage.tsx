import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Download, Search } from 'lucide-react'
import { ApiError } from '../../api/axios-client'
import type {
  LeaveMonetizationCandidateRow,
  LeaveMonetizationCandidatesReport,
  LeaveMonetizationGrandTotals,
} from '../../api/types'
import { Button } from '../../components/ui/Button'
import { ClearFiltersButton, EmptyState } from '../../components/ui/EmptyState'
import { fieldLabelClassName } from '../../components/ui/form/fieldStyles'
import { YearPickerField } from '../../components/ui/form/YearPickerField'
import { Pagination } from '../../components/ui/Pagination'
import { Skeleton } from '../../components/ui/Skeleton'
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
import { useAdminLeaveMonetizationCandidates } from '../../hooks/api/useAdminLeaveMonetizationCandidates'
import { useContentSizedTableRefs } from '../../hooks/useContentSizedTableRefs'
import { usePagination } from '../../hooks/usePagination'
import { downloadLeaveMonetizationCandidatesExcel } from '../../utils/exportLeaveMonetizationCandidatesExcel'
import { formatDateTime } from '../../utils/leaveDisplay'
import { compareEmployeeNumber } from '../../utils/sort'

type SortDir = 'asc' | 'desc'

const DEFAULT_YEAR = new Date().getFullYear()
const FILTER_CONTROL_H = 'h-[2.375rem]'

const EMPTY_TOTALS: LeaveMonetizationGrandTotals = {
  vl_balance: '0.00',
  vl_excess_days: '0.00',
  sl_balance: '0.00',
  sl_excess_days: '0.00',
  total_eligible_days: '0.00',
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

function formatDays(value: string | null): string {
  if (value == null) return '0'
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

function groupLabel(row: LeaveMonetizationCandidateRow): string {
  return (
    row.employee.group?.abbreviation?.trim() ||
    row.employee.group?.name?.trim() ||
    '—'
  )
}

function filterCandidates(
  rows: LeaveMonetizationCandidateRow[],
  search: string,
): LeaveMonetizationCandidateRow[] {
  const query = search.trim().toLowerCase()
  if (query.length === 0) return rows
  return rows.filter((row) => {
    const name = row.employee.name.toLowerCase()
    const number = row.employee.employee_number.toLowerCase()
    return name.includes(query) || number.includes(query)
  })
}

function toAmount(value: string | null): number {
  if (value == null) return 0
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function fromAmount(value: number): string {
  return value.toFixed(2)
}

function sumEligibleTotals(
  rows: LeaveMonetizationCandidateRow[],
): LeaveMonetizationGrandTotals {
  return rows.reduce<LeaveMonetizationGrandTotals>(
    (acc, row) => ({
      vl_balance: fromAmount(toAmount(acc.vl_balance) + toAmount(row.vl_balance)),
      vl_excess_days: fromAmount(
        toAmount(acc.vl_excess_days) + toAmount(row.vl_excess),
      ),
      sl_balance: fromAmount(toAmount(acc.sl_balance) + toAmount(row.sl_balance)),
      sl_excess_days: fromAmount(
        toAmount(acc.sl_excess_days) + toAmount(row.sl_excess),
      ),
      total_eligible_days: fromAmount(
        toAmount(acc.total_eligible_days) + toAmount(row.total_eligible_days),
      ),
    }),
    { ...EMPTY_TOTALS },
  )
}

export function LeaveMonetizationCandidatesPage() {
  const {
    availableSlotRef,
    sectionHeaderRef,
    paginationRef,
    tableAreaRef,
    pageSize,
  } = useContentSizedTableRefs({ fallbackRowHeight: APPROVALS_TABLE_ROW_HEIGHT })

  const [conversionYear, setConversionYear] = useState<number | null>(DEFAULT_YEAR)
  const [requestedYear, setRequestedYear] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [actionNotice, setActionNotice] = useState('')
  const [formError, setFormError] = useState('')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [exporting, setExporting] = useState(false)

  const { data, error, isLoading, isValidating, mutate } =
    useAdminLeaveMonetizationCandidates(requestedYear)

  const report: LeaveMonetizationCandidatesReport | undefined = data
  const fetching = requestedYear != null && (isLoading || (isValidating && !report))
  const canGenerate = conversionYear != null && !fetching

  const filteredCandidates = useMemo(() => {
    if (!report) return []
    return filterCandidates(report.rows, search)
  }, [report, search])

  const sortedCandidates = useMemo(() => {
    const next = [...filteredCandidates]
    next.sort((a, b) => {
      const cmp = compareEmployeeNumber(
        a.employee.employee_number,
        b.employee.employee_number,
      )
      return sortDir === 'asc' ? cmp : -cmp
    })
    return next
  }, [filteredCandidates, sortDir])

  const filterResetKey = `${search}|${sortDir}|${requestedYear ?? ''}`
  const { currentPage, setCurrentPage, totalPages, paginatedItems, totalItems } =
    usePagination(sortedCandidates, pageSize, filterResetKey)

  const hasActiveFilters = search.trim().length > 0

  function clearFilters() {
    setSearch('')
  }

  const filteredTotals = useMemo(() => {
    if (!report) return EMPTY_TOTALS
    if (!hasActiveFilters) return report.grand_totals
    return sumEligibleTotals(filteredCandidates)
  }, [filteredCandidates, hasActiveFilters, report])

  function handleYearChange(year: number | null) {
    setConversionYear(year)
    setRequestedYear(null)
    setSearch('')
    setFormError('')
    setActionNotice('')
  }

  function handleToggleEmployeeNumberSort() {
    setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
  }

  function handleGenerate() {
    setActionNotice('')
    if (conversionYear == null) {
      setFormError('Select a conversion year.')
      setRequestedYear(null)
      return
    }

    setFormError('')
    setSortDir('asc')
    if (requestedYear === conversionYear) {
      void mutate()
      return
    }
    setRequestedYear(conversionYear)
  }

  function handleReset() {
    setConversionYear(DEFAULT_YEAR)
    setRequestedYear(null)
    setSearch('')
    setFormError('')
    setActionNotice('')
    setSortDir('asc')
  }

  async function handleExportExcel() {
    if (!report) return
    setExporting(true)
    setActionNotice('')
    try {
      await downloadLeaveMonetizationCandidatesExcel({
        report,
        rows: sortedCandidates,
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
      ? messageFromApiError(error, 'Unable to load monetization candidates.')
      : ''

  return (
    <div className={`${TABLE_PAGE_ROOT} gap-4`}>
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-h1 text-text-black">Leave Monetization Candidates</h1>
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
                  label="Conversion Year"
                  value={conversionYear}
                  onChange={handleYearChange}
                  controlHeight={FILTER_CONTROL_H}
                  className="min-w-[8rem]"
                  minYear={2020}
                  maxYear={2035}
                />

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
                    Reset
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
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <SummaryCard
                    label="Eligible Employees"
                    value={String(filteredCandidates.length)}
                  />
                  <SummaryCard
                    label="Total VL Excess Days"
                    value={formatDays(filteredTotals.vl_excess_days)}
                    accentClass="text-leave-vacation"
                  />
                  <SummaryCard
                    label="Total SL Excess Days"
                    value={formatDays(filteredTotals.sl_excess_days)}
                    accentClass="text-leave-sick"
                  />
                  <SummaryCard
                    label="Total Eligible Leave Days"
                    value={formatDays(filteredTotals.total_eligible_days)}
                  />
                </div>

                <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-small text-text-gray">
                  <InfoItem
                    label="Conversion year"
                    value={String(report.conversion_year)}
                  />
                  <InfoItem
                    label="Balance cut-off"
                    value={formatIsoDateLabel(report.balance_cut_off)}
                  />
                  <InfoItem
                    label="Balances as of"
                    value={formatIsoDateLabel(report.as_of)}
                  />
                  <InfoItem
                    label="Date generated"
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
              <table className="w-full min-w-[72rem] table-fixed text-left">
                <thead>
                  <tr className="h-11 bg-surface-muted text-small text-text-gray">
                    <th className="border-b border-border px-4 py-3 font-bold uppercase tracking-wide">
                      <div className="flex items-center gap-1.5">
                        <span>Employee No.</span>
                        <button
                          type="button"
                          onClick={handleToggleEmployeeNumberSort}
                          className="inline-flex rounded p-0.5 text-text-gray transition-colors hover:bg-background hover:text-text-black"
                          aria-label={`Sort employee number ${sortDir === 'asc' ? 'descending' : 'ascending'}`}
                        >
                          {sortDir === 'asc' ? (
                            <ArrowUp className="size-3.5" aria-hidden="true" />
                          ) : (
                            <ArrowDown className="size-3.5" aria-hidden="true" />
                          )}
                        </button>
                      </div>
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
                      VL Retained
                    </th>
                    <th className="border-b border-border px-3 py-3 text-center font-bold uppercase tracking-wide text-leave-vacation">
                      VL Excess
                    </th>
                    <th className="border-b border-border px-3 py-3 text-center font-bold uppercase tracking-wide">
                      SL Balance
                    </th>
                    <th className="border-b border-border px-3 py-3 text-center font-bold uppercase tracking-wide">
                      SL Retained
                    </th>
                    <th className="border-b border-border px-3 py-3 text-center font-bold uppercase tracking-wide text-leave-sick">
                      SL Excess
                    </th>
                    <th className="border-b border-border px-3 py-3 text-center font-bold uppercase tracking-wide">
                      Total Eligible Days
                    </th>
                    <th className="border-b border-border px-4 py-3 font-bold uppercase tracking-wide">
                      Eligibility Basis
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.length === 0 ? (
                    <TableEmptyRow
                      colSpan={11}
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
                      <CandidateRow key={row.employee.id} row={row} />
                    ))
                  )}
                </tbody>
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
                    <td className="border-t border-border bg-surface-muted px-3 py-2.5 text-center text-body text-text-gray">
                      —
                    </td>
                    <td className="border-t border-border bg-leave-vacation/10 px-3 py-2.5 text-center text-body text-leave-vacation">
                      {formatDays(filteredTotals.vl_excess_days)}
                    </td>
                    <td className="border-t border-border bg-surface-muted px-3 py-2.5 text-center text-body text-text-black">
                      {formatDays(filteredTotals.sl_balance)}
                    </td>
                    <td className="border-t border-border bg-surface-muted px-3 py-2.5 text-center text-body text-text-gray">
                      —
                    </td>
                    <td className="border-t border-border bg-leave-sick/10 px-3 py-2.5 text-center text-body text-leave-sick">
                      {formatDays(filteredTotals.sl_excess_days)}
                    </td>
                    <td className="border-t border-border bg-surface-muted px-3 py-2.5 text-center text-body text-text-black">
                      {formatDays(filteredTotals.total_eligible_days)}
                    </td>
                    <td className="border-t border-border bg-surface-muted px-4 py-2.5" />
                  </tr>
                </tfoot>
              </table>
            ) : (
              <EmptyState
                variant="no-data"
                message={
                  loadError
                    ? loadError
                    : 'Select a conversion year, then click Generate Report to view eligible monetization candidates.'
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

function CandidateRow({ row }: { row: LeaveMonetizationCandidateRow }) {
  const showVl = row.vl_excess != null
  const showSl = row.sl_excess != null

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
      <td className="px-4 text-body text-text-black">{groupLabel(row)}</td>

      {showVl ? (
        <>
          <td className="px-3 text-center text-body text-text-black">
            {formatDays(row.vl_balance)}
          </td>
          <td className="px-3 text-center text-body text-text-gray">
            {formatDays(row.vl_retained)}
          </td>
          <td className="bg-leave-vacation/10 px-3 text-center text-body font-semibold text-leave-vacation">
            {formatDays(row.vl_excess)}
          </td>
        </>
      ) : (
        <td
          colSpan={3}
          title="Not applicable"
          className="px-3 text-center text-body text-text-gray"
        >
          N/A
        </td>
      )}

      {showSl ? (
        <>
          <td className="px-3 text-center text-body text-text-black">
            {formatDays(row.sl_balance)}
          </td>
          <td className="px-3 text-center text-body text-text-gray">
            {formatDays(row.sl_retained)}
          </td>
          <td className="bg-leave-sick/10 px-3 text-center text-body font-semibold text-leave-sick">
            {formatDays(row.sl_excess)}
          </td>
        </>
      ) : (
        <td
          colSpan={3}
          title="Not applicable"
          className="px-3 text-center text-body text-text-gray"
        >
          N/A
        </td>
      )}

      <td className="px-3 text-center text-body font-semibold text-text-black">
        {formatDays(row.total_eligible_days)}
      </td>
      <td className="px-4 text-body text-text-black">{row.eligibility_basis}</td>
    </tr>
  )
}

function SummaryCard({
  label,
  value,
  accentClass = 'text-text-black',
}: {
  label: string
  value: string
  accentClass?: string
}) {
  return (
    <div className="rounded-md border border-border bg-surface-muted px-4 py-3">
      <p className="text-small text-text-gray">{label}</p>
      <p className={`mt-1 text-h2 ${accentClass}`}>{value}</p>
    </div>
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
