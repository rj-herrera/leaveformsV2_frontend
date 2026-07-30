import { useEffect, useMemo, useState } from 'react'
import { Download, Printer } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { EmployeeMultiSelect } from '../../components/ui/EmployeeMultiSelect'
import { FilterSelect } from '../../components/ui/FilterSelect'
import { MonthYearPickerField } from '../../components/ui/form/MonthYearPickerField'
import { fieldLabelClassName } from '../../components/ui/form/fieldStyles'
import {
  ATTENDANCE_CUT_OFF_OPTIONS,
  buildAttendanceReport,
  getAttendanceEmployees,
  getAttendanceGroups,
  type AttendanceCutOff,
  type AttendanceLeaveCategory,
  type AttendanceReport,
} from '../../mocks/monthlyAttendance'
import { parseMonthValue } from '../../utils/teamCalendarGrid'

type GroupFilter = 'ALL' | string

const DEFAULT_MONTH_YEAR = '2026-07'

/** All filter controls share this exact height so the row is visually even. */
const FILTER_CONTROL_H = 'h-[2.375rem]'


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

function formatAttendanceTotal(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function cellBackgroundClass(
  category: AttendanceLeaveCategory | null,
  isNonWorking: boolean,
): string {
  if (category) {
    switch (category) {
      case 'vl':     return 'bg-leave-vacation/25'
      case 'sl':     return 'bg-leave-sick/25'
      case 'others': return 'bg-leave-others/30'
      case 'lwop':   return 'bg-status-rejected/15'
    }
  }
  if (isNonWorking) return 'bg-surface-muted'
  return ''
}

export function MonthlyAttendanceReportPage() {
  const [monthYear, setMonthYear] = useState(DEFAULT_MONTH_YEAR)
  const [cutOff, setCutOff] = useState<AttendanceCutOff>('monthly')
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('ALL')
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([])
  const [report, setReport] = useState<AttendanceReport | null>(null)
  const [actionNotice, setActionNotice] = useState('')

  const groupOptions = useMemo(
    () => [
      { value: 'ALL' as const, label: 'All Groups' },
      ...getAttendanceGroups().map((g) => ({ value: g, label: g })),
    ],
    [],
  )

  const cutOffOptions = useMemo(
    () => ATTENDANCE_CUT_OFF_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
    [],
  )

  const employeesInGroup = useMemo(
    () => getAttendanceEmployees(groupFilter),
    [groupFilter],
  )

  // Reset employee selection whenever group changes
  useEffect(() => { setSelectedEmployeeIds([]) }, [groupFilter])

  // Auto-generate whenever month, cut-off, group, or employee selection changes,
  // but only when at least one employee is selected.
  useEffect(() => {
    if (selectedEmployeeIds.length === 0) {
      setReport(null)
      return
    }
    const parsed = parseMonthValue(monthYear)
    if (!parsed) { setReport(null); return }

    const nextReport = buildAttendanceReport({
      year: parsed.year,
      monthIndex: parsed.monthIndex,
      cutOff,
      group: groupFilter,
      employeeIds: selectedEmployeeIds,
    })
    setReport(nextReport)
  }, [monthYear, cutOff, groupFilter, selectedEmployeeIds])

  function handleReset() {
    setMonthYear(DEFAULT_MONTH_YEAR)
    setCutOff('monthly')
    setGroupFilter('ALL')
    setSelectedEmployeeIds([])
    setActionNotice('')
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      {/* Page header */}
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-h1 text-text-black">Monthly Attendance Report</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            disabled={!report}
            onClick={() => setActionNotice('Export to Excel will be available in a future update.')}
          >
            <Download className="size-4" aria-hidden="true" />
            Export Excel
          </Button>
          <Button
            variant="secondary"
            disabled={!report}
            onClick={() => setActionNotice('Print will be available in a future update.')}
          >
            <Printer className="size-4" aria-hidden="true" />
            Print
          </Button>
        </div>
      </div>

      {/* Single container: filters + table + legend */}
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-surface">

        {/* Filters bar — z-40 ensures custom dropdowns float above the sticky thead/tfoot (z-20/z-30) */}
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
                options={cutOffOptions}
                selectHeight={FILTER_CONTROL_H}
              />
            </div>
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
            <EmployeeMultiSelect
              label="Employees"
              employees={employeesInGroup}
              value={selectedEmployeeIds}
              onChange={setSelectedEmployeeIds}
              className="min-w-[13rem] flex-1"
              controlHeight={FILTER_CONTROL_H}
            />
            <div className="flex shrink-0 items-end gap-2">
              <Button variant="secondary" onClick={handleReset}>
                Reset
              </Button>
            </div>
          </div>
          {actionNotice ? (
            <p role="status" className="mt-2 text-body text-text-gray">{actionNotice}</p>
          ) : null}
        </div>

        {report ? (
          <>
            {/* Scrollable matrix — table uses separate borders so sticky tfoot works */}
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
                        className={`min-w-[2.75rem] border-b border-r border-border/40 px-1 py-2 text-center font-bold uppercase tracking-wide last:border-r-0 ${col.isNonWorking ? 'bg-surface-muted/80' : 'bg-surface-muted'}`}
                      >
                        <span className="block leading-none">{col.dayOfMonth}</span>
                        <span className="block text-[0.6rem] font-semibold normal-case text-text-gray">
                          {col.weekdayShort}
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
                  {report.rows.map((row) => (
                    <tr key={row.employee.id}>
                      <td
                        className="sticky left-0 z-10 border-b border-r border-border bg-surface px-4 py-2 text-body text-text-black"
                        title={row.employee.employeeNumber}
                      >
                        {row.employee.employeeNumber}
                      </td>
                      <td
                        className="sticky left-[6.5rem] z-10 border-b border-r border-border bg-surface px-4 py-2 text-body font-medium text-text-black"
                        title={row.employee.name}
                      >
                        <span className="block truncate">{row.employee.name}</span>
                      </td>
                      {row.cells.map((cell) => (
                        <td
                          key={`${row.employee.id}-${cell.date}`}
                          className={`border-b border-r border-border/40 px-0.5 py-2 text-center text-small text-text-black last:border-r-0 ${cellBackgroundClass(cell.category, cell.isNonWorking)}`}
                        >
                          {cell.display || '\u00a0'}
                        </td>
                      ))}
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
                  ))}
                </tbody>
                {/* Sticky Total row at the bottom of the scroll area */}
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
                        className={`border-t-2 border-r border-border px-0.5 py-2.5 text-center text-small last:border-r-0 ${col.isNonWorking ? 'bg-surface-muted' : 'bg-surface-muted'}`}
                      >
                        {'\u00a0'}
                      </td>
                    ))}
                    <td className="border-t border-l border-border px-2 py-2.5 text-center text-body text-text-black">
                      {formatAttendanceTotal(report.grandTotals.vl)}
                    </td>
                    <td className="border-t border-border px-2 py-2.5 text-center text-body text-text-black">
                      {formatAttendanceTotal(report.grandTotals.sl)}
                    </td>
                    <td className="border-t border-border px-2 py-2.5 text-center text-body text-text-black">
                      {formatAttendanceTotal(report.grandTotals.others)}
                    </td>
                    <td className="border-t border-border px-2 py-2.5 text-center text-body text-text-black">
                      {formatAttendanceTotal(report.grandTotals.lwop)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Compact legend */}
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
                      <span className="font-semibold">{item.label}</span>
                      {' '}
                      <span className="text-text-gray">{item.description}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-body text-text-gray">
            Select a group and at least one employee to view the report.
          </div>
        )}
      </section>
    </div>
  )
}
