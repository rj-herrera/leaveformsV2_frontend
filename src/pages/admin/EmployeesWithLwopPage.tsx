import { useMemo, useRef, useState } from 'react'
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
import { useContentSizedTablePageSize } from '../../hooks/useContentSizedTablePageSize'
import {
  APPROVALS_TABLE_ROW_HEIGHT,
  APPROVALS_TABLE_ROW_HEIGHT_CLASS,
} from '../../hooks/usePageSizeFromHeight'
import { usePagination } from '../../hooks/usePagination'
import {
  buildEmployeesWithLwopReport,
  filterEmployeesWithLwop,
  getLwopGroups,
  type EmployeesWithLwopReport,
  type LwopEmployeeSummary,
} from '../../mocks/employeesWithLwop'

type GroupFilter = 'ALL' | string
type SortKey = 'employeeNumber' | 'totalLwopDays'
type SortDir = 'asc' | 'desc'

const DEFAULT_YEAR = new Date().getFullYear()
const FILTER_CONTROL_H = 'h-[2.375rem]'
const SUMMARY_COL_COUNT = 4

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

function compareEmployeeNumber(a: string, b: string): number {
  const numA = Number(a)
  const numB = Number(b)
  if (Number.isFinite(numA) && Number.isFinite(numB)) {
    return numA - numB
  }
  return a.localeCompare(b)
}

export function EmployeesWithLwopPage() {
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

  const [year, setYear] = useState<number | null>(DEFAULT_YEAR)
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('ALL')
  const [search, setSearch] = useState('')
  const [report, setReport] = useState<EmployeesWithLwopReport | null>(null)
  const [actionNotice, setActionNotice] = useState('')
  const [formError, setFormError] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('totalLwopDays')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const groupOptions = useMemo(
    () => [
      { value: 'ALL' as const, label: 'All Groups' },
      ...getLwopGroups().map((group) => ({ value: group, label: group })),
    ],
    [],
  )

  const filteredSummaries = useMemo(() => {
    if (!report) return []
    return filterEmployeesWithLwop(report.summaries, {
      search,
      group: groupFilter,
    })
  }, [report, search, groupFilter])

  const sortedSummaries = useMemo(() => {
    const next = [...filteredSummaries]
    next.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'employeeNumber':
          cmp = compareEmployeeNumber(a.employeeNumber, b.employeeNumber)
          break
        case 'totalLwopDays':
          cmp = a.totalLwopDays - b.totalLwopDays
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return next
  }, [filteredSummaries, sortKey, sortDir])

  const filterResetKey = `${search}|${groupFilter}|${sortKey}|${sortDir}|${report?.generatedAt?.getTime() ?? 0}`
  const { currentPage, setCurrentPage, totalPages, paginatedItems, totalItems } =
    usePagination(sortedSummaries, pageSize, filterResetKey)

  function handleYearChange(nextYear: number | null) {
    setYear(nextYear)
    setReport(null)
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

  function handleGenerate() {
    setActionNotice('')
    if (year == null) {
      setFormError('Select a year.')
      setReport(null)
      return
    }

    const next = buildEmployeesWithLwopReport({ year })
    setFormError('')
    setReport(next)
    setSortKey('totalLwopDays')
    setSortDir('desc')
  }

  function handleReset() {
    setYear(DEFAULT_YEAR)
    setGroupFilter('ALL')
    setSearch('')
    setSortKey('totalLwopDays')
    setSortDir('desc')
    setReport(null)
    setFormError('')
    setActionNotice('')
  }

  return (
    <div className={`${TABLE_PAGE_ROOT} gap-4`}>
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-h1 text-text-black">Employees with LWOP</h1>
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
                    onChange={setGroupFilter}
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
                      className={`w-full rounded-md border border-border bg-surface pr-3 pl-9 text-small text-text-black outline-none placeholder:text-text-gray focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 ${FILTER_CONTROL_H}`}
                    />
                  </span>
                </label>

                <div className="flex shrink-0 items-end gap-2">
                  <Button
                    variant="primary"
                    disabled={year == null}
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
                    value={report.reportingPeriodLabel}
                  />
                  <InfoItem
                    label="Date Generated"
                    value={formatGeneratedAt(report.generatedAt)}
                  />
                </dl>
              </div>
            ) : null}
          </div>

          <div ref={tableAreaRef} className={TABLE_CONTENT_AREA}>
            {report ? (
              <table className="w-full min-w-[40rem] table-fixed text-left">
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
                    <tr className={APPROVALS_TABLE_ROW_HEIGHT_CLASS}>
                      <td
                        colSpan={SUMMARY_COL_COUNT}
                        className="px-5 text-center text-body text-text-gray"
                      >
                        No employees with LWOP match the current filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedItems.map((row) => (
                      <EmployeeRow key={row.employeeId} row={row} />
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <p className="px-5 py-10 text-center text-body text-text-gray">
                Select a year, then click Generate Report to view employees with
                LWOP. Group is optional.
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

function EmployeeRow({ row }: { row: LwopEmployeeSummary }) {
  return (
    <tr
      className={`${APPROVALS_TABLE_ROW_HEIGHT_CLASS} border-b border-border last:border-b-0`}
    >
      <td className="px-4 text-body text-text-black">{row.employeeNumber}</td>
      <td className="px-4 text-body font-medium text-text-black">
        {row.employeeName}
      </td>
      <td className="px-4 text-body text-text-black">{row.groupLabel}</td>
      <td className="px-3 text-center text-body font-semibold text-text-black">
        {formatDays(row.totalLwopDays)}
      </td>
    </tr>
  )
}

function SortableHeader({
  label,
  active,
  direction,
  onToggle,
  align = 'left',
}: {
  label: string
  active: boolean
  direction: SortDir
  onToggle: () => void
  align?: 'left' | 'center'
}) {
  return (
    <div
      className={`flex items-center gap-1.5 ${align === 'center' ? 'justify-center' : ''}`}
    >
      <span>{label}</span>
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex rounded p-0.5 text-text-gray transition-colors hover:bg-background hover:text-text-black"
        aria-label={`Sort ${label} ${active && direction === 'desc' ? 'ascending' : 'descending'}`}
      >
        {active && direction === 'asc' ? (
          <ArrowUp className="size-3.5" aria-hidden="true" />
        ) : (
          <ArrowDown className="size-3.5" aria-hidden="true" />
        )}
      </button>
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
