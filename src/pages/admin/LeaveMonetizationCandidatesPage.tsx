import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Download, Printer, Search } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { FilterSelect } from '../../components/ui/FilterSelect'
import { fieldLabelClassName } from '../../components/ui/form/fieldStyles'
import { YearPickerField } from '../../components/ui/form/YearPickerField'
import { Pagination } from '../../components/ui/Pagination'
import {
  TABLE_AVAILABLE_SLOT,
  TABLE_CONTENT_AREA,
  TABLE_CONTENT_SECTION,
  TABLE_PAGE_ROOT,
  TABLE_PAGINATION_PLACEHOLDER,
  TABLE_PAGINATION_WRAP,
} from '../../components/ui/tableLayout'
import { TABLE_BODY_ROW_BORDER_CLASS, TABLE_SEARCH_INPUT_BASE_CLASS, APPROVALS_TABLE_ROW_HEIGHT, APPROVALS_TABLE_ROW_HEIGHT_CLASS } from '../../components/ui/tableStyles'
import { useContentSizedTableRefs } from '../../hooks/useContentSizedTableRefs'
import { usePagination } from '../../hooks/usePagination'
import {
  MONETIZATION_ELIGIBILITY_OPTIONS,
  buildMonetizationReport,
  filterMonetizationCandidates,
  getMonetizationAvailability,
  hasSlEligible,
  hasVlEligible,
  sumEligibleTotals,
  type MonetizationCandidate,
  type MonetizationEligibilityType,
  type MonetizationReport,
} from '../../mocks/monetizationCandidates'
import { compareEmployeeNumber } from '../../utils/sort'

type SortDir = 'asc' | 'desc'

const DEFAULT_YEAR = new Date().getFullYear()
const FILTER_CONTROL_H = 'h-[2.375rem]'

function formatDays(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function formatGeneratedAt(date: Date): string {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
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
  const [eligibilityType, setEligibilityType] =
    useState<MonetizationEligibilityType>('ALL')
  const [search, setSearch] = useState('')
  const [report, setReport] = useState<MonetizationReport | null>(null)
  const [actionNotice, setActionNotice] = useState('')
  const [formError, setFormError] = useState('')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const availability = useMemo(
    () =>
      conversionYear != null
        ? getMonetizationAvailability(conversionYear)
        : null,
    [conversionYear],
  )

  const canGenerate = availability?.available === true

  const eligibilityOptions = useMemo(
    () =>
      MONETIZATION_ELIGIBILITY_OPTIONS.map((option) => ({
        value: option.value,
        label: option.label,
      })),
    [],
  )

  const filteredCandidates = useMemo(() => {
    if (!report) return []
    return filterMonetizationCandidates(report.candidates, {
      search,
      eligibilityType,
    })
  }, [report, search, eligibilityType])

  const sortedCandidates = useMemo(() => {
    const next = [...filteredCandidates]
    next.sort((a, b) => {
      const cmp = compareEmployeeNumber(a.employeeNumber, b.employeeNumber)
      return sortDir === 'asc' ? cmp : -cmp
    })
    return next
  }, [filteredCandidates, sortDir])

  const filterResetKey = `${search}|${eligibilityType}|${sortDir}|${report?.generatedAt?.getTime() ?? 0}`
  const { currentPage, setCurrentPage, totalPages, paginatedItems, totalItems } =
    usePagination(sortedCandidates, pageSize, filterResetKey)

  const filteredTotals = useMemo(
    () => sumEligibleTotals(filteredCandidates),
    [filteredCandidates],
  )

  function handleYearChange(year: number | null) {
    setConversionYear(year)
    setReport(null)
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
      setReport(null)
      return
    }

    const nextAvailability = getMonetizationAvailability(conversionYear)
    if (!nextAvailability.available) {
      setFormError(nextAvailability.message ?? 'Report is not available yet.')
      setReport(null)
      return
    }

    const next = buildMonetizationReport({ conversionYear })
    if (!next) {
      setFormError('Unable to build the report for the selected year.')
      setReport(null)
      return
    }

    setFormError('')
    setReport(next)
    setSortDir('asc')
  }

  function handleReset() {
    setConversionYear(DEFAULT_YEAR)
    setEligibilityType('ALL')
    setSearch('')
    setReport(null)
    setFormError('')
    setActionNotice('')
    setSortDir('asc')
  }

  return (
    <div className={`${TABLE_PAGE_ROOT} gap-4`}>
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-h1 text-text-black">Leave Monetization Candidates</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            disabled={!report}
            onClick={() =>
              setActionNotice(
                'Export to Excel will be available in a future update.',
              )
            }
          >
            <Download className="size-4" aria-hidden="true" />
            Export Excel
          </Button>
          <Button
            variant="secondary"
            disabled={!report}
            onClick={() =>
              setActionNotice('Print will be available in a future update.')
            }
          >
            <Printer className="size-4" aria-hidden="true" />
            Print
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

                <div className="min-w-[14rem]">
                  <span className={fieldLabelClassName}>Eligibility Type</span>
                  <FilterSelect
                    label="Eligibility Type"
                    value={eligibilityType}
                    onChange={setEligibilityType}
                    options={eligibilityOptions}
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
                    title={
                      !canGenerate && availability?.message
                        ? availability.message
                        : undefined
                    }
                  >
                    Generate Report
                  </Button>
                  <Button variant="secondary" onClick={handleReset}>
                    Reset
                  </Button>
                </div>
              </div>

              {!canGenerate && availability?.message ? (
                <p role="status" className="mt-2 text-body text-text-gray">
                  {availability.message}
                </p>
              ) : null}
              {formError ? (
                <p role="alert" className="mt-2 text-body text-status-rejected">
                  {formError}
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
                    value={formatDays(filteredTotals.vlExcess)}
                    accentClass="text-leave-vacation"
                  />
                  <SummaryCard
                    label="Total SL Excess Days"
                    value={formatDays(filteredTotals.slExcess)}
                    accentClass="text-leave-sick"
                  />
                  <SummaryCard
                    label="Total Eligible Leave Days"
                    value={formatDays(filteredTotals.totalEligibleDays)}
                  />
                </div>

                <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-small text-text-gray">
                  <InfoItem
                    label="Conversion year"
                    value={String(report.conversionYear)}
                  />
                  <InfoItem
                    label="Balance cut-off"
                    value={report.balanceAsOfLabel}
                  />
                  <InfoItem
                    label="Date generated"
                    value={formatGeneratedAt(report.generatedAt)}
                  />
                </dl>
              </div>
            ) : null}
          </div>

          <div ref={tableAreaRef} className={TABLE_CONTENT_AREA}>
            {report ? (
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
                    <tr className={APPROVALS_TABLE_ROW_HEIGHT_CLASS}>
                      <td
                        colSpan={11}
                        className="px-5 text-center text-body text-text-gray"
                      >
                        No candidates match the current filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedItems.map((row) => (
                      <CandidateRow key={row.employeeId} row={row} />
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
                      {formatDays(filteredTotals.vlBalance)}
                    </td>
                    <td className="border-t border-border bg-surface-muted px-3 py-2.5 text-center text-body text-text-gray">
                      —
                    </td>
                    <td className="border-t border-border bg-leave-vacation/10 px-3 py-2.5 text-center text-body text-leave-vacation">
                      {formatDays(filteredTotals.vlExcess)}
                    </td>
                    <td className="border-t border-border bg-surface-muted px-3 py-2.5 text-center text-body text-text-black">
                      {formatDays(filteredTotals.slBalance)}
                    </td>
                    <td className="border-t border-border bg-surface-muted px-3 py-2.5 text-center text-body text-text-gray">
                      —
                    </td>
                    <td className="border-t border-border bg-leave-sick/10 px-3 py-2.5 text-center text-body text-leave-sick">
                      {formatDays(filteredTotals.slExcess)}
                    </td>
                    <td className="border-t border-border bg-surface-muted px-3 py-2.5 text-center text-body text-text-black">
                      {formatDays(filteredTotals.totalEligibleDays)}
                    </td>
                    <td className="border-t border-border bg-surface-muted px-4 py-2.5" />
                  </tr>
                </tfoot>
              </table>
            ) : (
              <p className="px-5 py-10 text-center text-body text-text-gray">
                {canGenerate
                  ? 'Select a conversion year, then click Generate Report to view eligible monetization candidates.'
                  : (availability?.message ??
                    'Report generation is not available for the selected conversion year yet.')}
              </p>
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

function CandidateRow({ row }: { row: MonetizationCandidate }) {
  const showVl = hasVlEligible(row.eligibilityBasis)
  const showSl = hasSlEligible(row.eligibilityBasis)

  return (
    <tr
      className={`${APPROVALS_TABLE_ROW_HEIGHT_CLASS} ${TABLE_BODY_ROW_BORDER_CLASS}`}
    >
      <td className="px-4 text-body text-text-black">{row.employeeNumber}</td>
      <td className="px-4 text-body font-medium text-text-black">
        {row.employeeName}
      </td>
      <td className="px-4 text-body text-text-black">{row.groupLabel}</td>

      {showVl ? (
        <>
          <td className="px-3 text-center text-body text-text-black">
            {formatDays(row.vlBalance)}
          </td>
          <td className="px-3 text-center text-body text-text-gray">
            {formatDays(row.vlRetained)}
          </td>
          <td className="bg-leave-vacation/10 px-3 text-center text-body font-semibold text-leave-vacation">
            {formatDays(row.vlExcess)}
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
            {formatDays(row.slBalance)}
          </td>
          <td className="px-3 text-center text-body text-text-gray">
            {formatDays(row.slRetained)}
          </td>
          <td className="bg-leave-sick/10 px-3 text-center text-body font-semibold text-leave-sick">
            {formatDays(row.slExcess)}
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
        {formatDays(row.totalEligibleDays)}
      </td>
      <td className="px-4 text-body text-text-black">{row.eligibilityBasis}</td>
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
