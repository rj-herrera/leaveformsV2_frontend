import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { ApiError } from '../../api/axios-client'
import type {
  MonthlyAttendanceCategory,
  MonthlyAttendanceCell,
  MonthlyAttendanceCutOff,
  MonthlyAttendanceDateColumn,
  MonthlyAttendanceReport,
} from '../../api/types'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { EmployeeMultiSelect } from '../../components/ui/EmployeeMultiSelect'
import { FilterSelect } from '../../components/ui/FilterSelect'
import { MonthYearPickerField } from '../../components/ui/form/MonthYearPickerField'
import { fieldLabelClassName } from '../../components/ui/form/fieldStyles'
import { Skeleton } from '../../components/ui/Skeleton'
import { useAdminEmployees } from '../../hooks/api/useAdminEmployees'
import { useAdminGroups } from '../../hooks/api/useAdminGroups'
import { useAdminMonthlyAttendance } from '../../hooks/api/useAdminMonthlyAttendance'
import { downloadMonthlyAttendanceExcel } from '../../utils/exportMonthlyAttendanceExcel'
import { monthValue } from '../../utils/teamCalendarGrid'

type GroupFilter = 'ALL' | string

/** All filter controls share this exact height so the row is visually even. */
const FILTER_CONTROL_H = 'h-[2.375rem]'

const CUT_OFF_OPTIONS: { value: MonthlyAttendanceCutOff; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'first_half', label: 'First Half' },
  { value: 'second_half', label: 'Second Half' },
]

const LEGEND_ITEMS = [
  { label: 'VL', description: 'Vacation Leave', swatchClass: 'bg-leave-vacation/40' },
  { label: 'SL', description: 'Sick Leave', swatchClass: 'bg-leave-sick/40' },
  {
    label: 'Others',
    description: 'Emergency, PTB, Maternity, Paternity Leave, etc.',
    swatchClass: 'bg-leave-others/40',
  },
  { label: 'LWOP', description: 'Leave Without Pay', swatchClass: 'bg-status-rejected/20' },
  {
    label: 'Non-working',
    description: 'Weekends & holidays',
    swatchClass: 'bg-surface-muted border border-border',
  },
  {
    label: '0.5 (AM/PM)',
    description: 'Half-day leave',
    swatchClass: 'bg-surface border border-border',
    text: '0.5',
  },
] as const

function currentMonthValue(): string {
  const now = new Date()
  return monthValue(now.getFullYear(), now.getMonth())
}

function groupOptionLabel(group: {
  abbreviation: string | null
  name: string | null
  id: number
}): string {
  return group.abbreviation?.trim() || group.name?.trim() || String(group.id)
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

function formatAttendanceTotal(value: string): string {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '0'
  return Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(1)
}

function formatCellDisplay(cell: MonthlyAttendanceCell | undefined): string {
  if (!cell) return ''
  if (cell.amount === '0.50') {
    return `0.5 (${cell.half === 'pm' ? 'PM' : 'AM'})`
  }
  return '1'
}

function cellBackgroundClass(
  category: MonthlyAttendanceCategory | null,
  isNonWorking: boolean,
): string {
  if (category) {
    switch (category) {
      case 'vl':
        return 'bg-leave-vacation/25'
      case 'sl':
        return 'bg-leave-sick/25'
      case 'others':
        return 'bg-leave-others/30'
      case 'lwop':
        return 'bg-status-rejected/15'
    }
  }
  if (isNonWorking) return 'bg-surface-muted'
  return ''
}

function cellsByDate(
  cells: MonthlyAttendanceCell[],
): Map<string, MonthlyAttendanceCell> {
  return new Map(cells.map((cell) => [cell.date, cell]))
}

function resolvedCell(
  column: MonthlyAttendanceDateColumn,
  lookup: Map<string, MonthlyAttendanceCell>,
): {
  category: MonthlyAttendanceCategory | null
  isNonWorking: boolean
  display: string
} {
  const cell = lookup.get(column.date)
  return {
    category: cell?.category ?? null,
    isNonWorking: cell?.is_non_working ?? column.is_non_working,
    display: formatCellDisplay(cell),
  }
}

export function MonthlyAttendanceReportPage() {
  const [monthYear, setMonthYear] = useState(currentMonthValue)
  const [cutOff, setCutOff] = useState<MonthlyAttendanceCutOff>('monthly')
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('ALL')
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([])
  const [actionNotice, setActionNotice] = useState('')
  const [exporting, setExporting] = useState(false)

  const groupId =
    groupFilter !== 'ALL' && Number.isInteger(Number(groupFilter))
      ? Number(groupFilter)
      : undefined

  const { data: adminGroups } = useAdminGroups()
  const {
    data: employees,
    error: employeesError,
    isLoading: employeesLoading,
  } = useAdminEmployees(groupId != null ? { group_id: groupId } : undefined)

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

  const employeeOptions = useMemo(
    () =>
      (employees ?? []).map((employee) => ({
        id: String(employee.id),
        name: employee.name,
        employeeNumber: employee.employee_number,
        groupLabel:
          employee.group?.abbreviation?.trim() ||
          employee.group?.name?.trim() ||
          undefined,
      })),
    [employees],
  )

  function handleGroupChange(value: GroupFilter) {
    setGroupFilter(value)
    setSelectedEmployeeIds([])
  }

  const empIds = useMemo(() => {
    const ids = selectedEmployeeIds
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0)
    ids.sort((a, b) => a - b)
    return ids
  }, [selectedEmployeeIds])

  const availableEmployeeCount = employees?.length ?? 0
  const allEmployeesSelected =
    availableEmployeeCount > 0 && empIds.length === availableEmployeeCount

  const reportParams = useMemo(() => {
    if (empIds.length === 0) return null
    if (!/^\d{4}-\d{2}$/.test(monthYear)) return null
    return {
      month: monthYear,
      cut_off: cutOff,
      emp_ids: allEmployeesSelected ? undefined : empIds,
      group_id: groupId,
    }
  }, [allEmployeesSelected, cutOff, empIds, groupId, monthYear])

  const {
    data: report,
    error: reportError,
    isLoading: reportLoading,
  } = useAdminMonthlyAttendance(reportParams)

  const showReport =
    reportParams != null && report != null && reportError == null

  function handleReset() {
    setMonthYear(currentMonthValue())
    setCutOff('monthly')
    setGroupFilter('ALL')
    setSelectedEmployeeIds([])
    setActionNotice('')
  }

  async function handleExportExcel() {
    if (!report) return
    setExporting(true)
    setActionNotice('')
    try {
      await downloadMonthlyAttendanceExcel(report)
    } catch {
      setActionNotice('Unable to export the Excel file. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-h1 text-text-black">Monthly Attendance Report</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            disabled={!showReport}
            loading={exporting}
            loadingText="Exporting…"
            onClick={() => void handleExportExcel()}
          >
            <Download className="size-4" aria-hidden="true" />
            Export Excel
          </Button>
        </div>
      </div>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-surface">
        <div className="relative z-40 shrink-0 border-b border-border px-5 py-4">
          <div className="flex flex-wrap items-end gap-3">
            <MonthYearPickerField
              label="Month & Year"
              value={monthYear}
              onChange={setMonthYear}
              controlHeight={FILTER_CONTROL_H}
              className="min-w-[10rem]"
            />
            <div className="min-w-[10rem]">
              <span className={fieldLabelClassName}>Cut-off</span>
              <FilterSelect
                label="Cut-off"
                value={cutOff}
                onChange={setCutOff}
                options={CUT_OFF_OPTIONS}
                selectHeight={FILTER_CONTROL_H}
              />
            </div>
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
            <EmployeeMultiSelect
              label="Employees"
              employees={employeeOptions}
              value={selectedEmployeeIds}
              onChange={setSelectedEmployeeIds}
              className="min-w-[13rem] flex-1"
              controlHeight={FILTER_CONTROL_H}
              disabled={employeesLoading}
              emptyLabel={
                employeesLoading
                  ? 'Loading employees…'
                  : 'No employees in group'
              }
            />
            <div className="flex shrink-0 items-end gap-2">
              <Button variant="secondary" onClick={handleReset}>
                Reset
              </Button>
            </div>
          </div>
          {employeesError ? (
            <p role="status" className="mt-2 text-body text-status-rejected">
              {messageFromApiError(
                employeesError,
                'Unable to load employees. Please try again.',
              )}
            </p>
          ) : null}
          {actionNotice ? (
            <p role="status" className="mt-2 text-body text-text-gray">
              {actionNotice}
            </p>
          ) : null}
        </div>

        <ReportBody
          report={showReport ? report : null}
          reportError={reportParams != null ? reportError : undefined}
          reportLoading={reportParams != null && reportLoading && !report}
        />
      </section>
    </div>
  )
}

function ReportBody({
  report,
  reportError,
  reportLoading,
}: {
  report: MonthlyAttendanceReport | null
  reportError: unknown
  reportLoading: boolean
}) {
  if (reportLoading) {
    return (
      <div
        role="status"
        aria-label="Loading report"
        className="flex min-h-0 flex-1 flex-col gap-2 p-5"
      >
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-3/4" />
      </div>
    )
  }

  if (reportError) {
    return (
      <EmptyState
        variant="no-results"
        message={messageFromApiError(
          reportError,
          'Unable to load the attendance report. Please try again.',
        )}
        className="min-h-0 flex-1"
      />
    )
  }

  if (!report) {
    return (
      <EmptyState
        variant="no-data"
        message="Select at least one employee to view the report."
        className="min-h-0 flex-1"
      />
    )
  }

  return (
    <>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-max min-w-full border-separate border-spacing-0 text-left">
          <thead className="sticky top-0 z-20">
            <tr className="bg-surface-muted text-small text-text-gray">
              <th className="sticky left-0 z-30 min-w-[6.5rem] border-b border-r border-border bg-surface-muted px-4 py-3 font-bold uppercase tracking-wide">
                Employee No.
              </th>
              <th className="sticky left-[6.5rem] z-30 min-w-[12rem] border-b border-r border-border bg-surface-muted px-4 py-3 font-bold uppercase tracking-wide">
                Employee Name
              </th>
              {report.dates.map((col) => (
                <th
                  key={col.date}
                  title={col.date}
                  className={`min-w-[2.75rem] border-b border-r border-border/40 px-1 py-2 text-center font-bold uppercase tracking-wide last:border-r-0 ${col.is_non_working ? 'bg-surface-muted/80' : 'bg-surface-muted'}`}
                >
                  <span className="block leading-none">{col.day_of_month}</span>
                  <span className="block text-[0.6rem] font-semibold normal-case text-text-gray">
                    {col.weekday_short}
                  </span>
                </th>
              ))}
              <th className="min-w-[3rem] border-b border-l border-border px-2 py-3 text-center font-bold uppercase tracking-wide text-leave-vacation bg-surface-muted">
                VL
              </th>
              <th className="min-w-[3rem] border-b border-border px-2 py-3 text-center font-bold uppercase tracking-wide text-leave-sick bg-surface-muted">
                SL
              </th>
              <th className="min-w-[3.5rem] border-b border-border px-2 py-3 text-center font-bold uppercase tracking-wide text-leave-others bg-surface-muted">
                Others
              </th>
              <th className="min-w-[3.5rem] border-b border-border px-2 py-3 text-center font-bold uppercase tracking-wide text-status-rejected bg-surface-muted">
                LWOP
              </th>
            </tr>
          </thead>
          <tbody>
            {report.rows.map((row) => {
              const lookup = cellsByDate(row.cells)
              return (
                <tr key={row.employee.id}>
                  <td
                    className="sticky left-0 z-10 border-b border-r border-border bg-surface px-4 py-2 text-body text-text-black"
                    title={row.employee.employee_number}
                  >
                    {row.employee.employee_number}
                  </td>
                  <td
                    className="sticky left-[6.5rem] z-10 border-b border-r border-border bg-surface px-4 py-2 text-body font-medium text-text-black"
                    title={row.employee.name}
                  >
                    <span className="block truncate">{row.employee.name}</span>
                  </td>
                  {report.dates.map((col) => {
                    const cell = resolvedCell(col, lookup)
                    return (
                      <td
                        key={`${row.employee.id}-${col.date}`}
                        className={`border-b border-r border-border/40 px-0.5 py-2 text-center text-small text-text-black last:border-r-0 ${cellBackgroundClass(cell.category, cell.isNonWorking)}`}
                      >
                        {cell.display || '\u00a0'}
                      </td>
                    )
                  })}
                  <td className="border-b border-l border-border px-2 py-2 text-center text-body text-text-black">
                    {formatAttendanceTotal(row.totals.vl)}
                  </td>
                  <td className="border-b border-border px-2 py-2 text-center text-body text-text-black">
                    {formatAttendanceTotal(row.totals.sl)}
                  </td>
                  <td className="border-b border-border px-2 py-2 text-center text-body text-text-black">
                    {formatAttendanceTotal(row.totals.others)}
                  </td>
                  <td className="border-b border-border px-2 py-2 text-center text-body text-text-black">
                    {formatAttendanceTotal(row.totals.lwop)}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot className="sticky bottom-0 z-20">
            <tr className="bg-surface-muted font-semibold">
              <td
                colSpan={2}
                className="sticky left-0 z-30 border-t-2 border-r border-border bg-surface-muted px-4 py-2.5 text-body text-text-black"
              >
                Total
              </td>
              {report.dates.map((col) => (
                <td
                  key={`total-${col.date}`}
                  className="border-t-2 border-r border-border bg-surface-muted px-0.5 py-2.5 text-center text-small last:border-r-0"
                >
                  {'\u00a0'}
                </td>
              ))}
              <td className="border-t border-l border-border px-2 py-2.5 text-center text-body text-text-black">
                {formatAttendanceTotal(report.grand_totals.vl)}
              </td>
              <td className="border-t border-border px-2 py-2.5 text-center text-body text-text-black">
                {formatAttendanceTotal(report.grand_totals.sl)}
              </td>
              <td className="border-t border-border px-2 py-2.5 text-center text-body text-text-black">
                {formatAttendanceTotal(report.grand_totals.others)}
              </td>
              <td className="border-t border-border px-2 py-2.5 text-center text-body text-text-black">
                {formatAttendanceTotal(report.grand_totals.lwop)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="shrink-0 border-t border-border px-5 py-3">
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {LEGEND_ITEMS.map((item) => (
            <li key={item.label} className="flex items-center gap-2">
              <span
                className={`inline-flex size-5 shrink-0 items-center justify-center rounded text-[0.6rem] font-semibold text-text-black ${item.swatchClass}`}
              >
                {'text' in item ? item.text : ''}
              </span>
              <span className="text-small text-text-black">
                <span className="font-semibold">{item.label}</span>{' '}
                <span className="text-text-gray">{item.description}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
