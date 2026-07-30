/**
 * TODO(REPLACE): Monthly Attendance Report — replace with API.
 */
import { formatMonthYearLabel } from '../utils/teamCalendarGrid'
import {
  getAdminLeaveBalanceRows,
  getLeaveBalanceGroups,
  type LeaveBalanceEmployee,
} from './leaveBalances'
import { isNonWorkingHoliday } from './workCalendar'

export type AttendanceCutOff = 'monthly' | 'first-half' | 'second-half'

export type AttendanceLeaveCategory = 'vl' | 'sl' | 'others' | 'lwop'

export type AttendanceDayAmount = 1 | 0.5

export type AttendanceHalf = 'AM' | 'PM'

export type AttendanceLeaveDay = {
  employeeId: string
  /** ISO YYYY-MM-DD */
  date: string
  category: AttendanceLeaveCategory
  amount: AttendanceDayAmount
  half?: AttendanceHalf
}

export type AttendanceEmployee = {
  id: string
  name: string
  employeeNumber: string
  groupLabel: string
}

export type AttendanceDateColumn = {
  date: string
  dayOfMonth: number
  weekdayShort: string
  isNonWorking: boolean
}

export type AttendanceCell = {
  date: string
  display: string
  category: AttendanceLeaveCategory | null
  isNonWorking: boolean
}

export type AttendanceLeaveTotals = {
  vl: number
  sl: number
  others: number
  lwop: number
}

export type AttendanceEmployeeRow = {
  employee: AttendanceEmployee
  cells: AttendanceCell[]
  totals: AttendanceLeaveTotals
}

export type AttendanceReport = {
  monthYearLabel: string
  cutOffLabel: string
  groupLabel: string
  employeeCount: number
  generatedAt: Date
  dates: AttendanceDateColumn[]
  rows: AttendanceEmployeeRow[]
  grandTotals: AttendanceLeaveTotals
}

export const ATTENDANCE_CUT_OFF_OPTIONS: {
  value: AttendanceCutOff
  label: string
}[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'first-half', label: 'First Half'},
  { value: 'second-half', label: 'Second Half' },
]

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

const EMPTY_TOTALS: AttendanceLeaveTotals = {
  vl: 0,
  sl: 0,
  others: 0,
  lwop: 0,
}

/** Approved leave days used to build the attendance matrix. */
const ATTENDANCE_LEAVE_DAYS: AttendanceLeaveDay[] = [
  // July 2026 — SYS
  {
    employeeId: 'user-employee',
    date: '2026-07-10',
    category: 'sl',
    amount: 0.5,
    half: 'AM',
  },
  {
    employeeId: 'user-employee',
    date: '2026-07-20',
    category: 'vl',
    amount: 1,
  },
  {
    employeeId: 'user-employee',
    date: '2026-07-21',
    category: 'vl',
    amount: 1,
  },
  {
    employeeId: 'user-employee',
    date: '2026-07-22',
    category: 'vl',
    amount: 1,
  },
  {
    employeeId: 'user-sally',
    date: '2026-07-13',
    category: 'vl',
    amount: 1,
  },
  {
    employeeId: 'user-emman',
    date: '2026-07-15',
    category: 'vl',
    amount: 1,
  },
  {
    employeeId: 'user-emman',
    date: '2026-07-16',
    category: 'vl',
    amount: 1,
  },
  {
    employeeId: 'user-emman',
    date: '2026-07-17',
    category: 'vl',
    amount: 1,
  },
  {
    employeeId: 'user-employee-2',
    date: '2026-07-08',
    category: 'others',
    amount: 1,
  },
  {
    employeeId: 'user-cecile',
    date: '2026-07-16',
    category: 'others',
    amount: 1,
  },
  {
    employeeId: 'user-newly-reg-1',
    date: '2026-07-01',
    category: 'vl',
    amount: 0.5,
    half: 'AM',
  },
  {
    employeeId: 'user-contract-2',
    date: '2026-07-03',
    category: 'sl',
    amount: 1,
  },
  // July 2026 — IT
  {
    employeeId: 'user-employee-3',
    date: '2026-07-02',
    category: 'others',
    amount: 0.5,
    half: 'PM',
  },
  {
    employeeId: 'user-employee-3',
    date: '2026-07-24',
    category: 'sl',
    amount: 1,
  },
  {
    employeeId: 'user-newly-reg-2',
    date: '2026-07-14',
    category: 'sl',
    amount: 1,
  },
  {
    employeeId: 'user-newly-reg-2',
    date: '2026-07-15',
    category: 'sl',
    amount: 1,
  },
  // July 2026 — PIP
  {
    employeeId: 'user-melissa',
    date: '2026-07-07',
    category: 'lwop',
    amount: 1,
  },
  {
    employeeId: 'user-melissa',
    date: '2026-07-08',
    category: 'lwop',
    amount: 1,
  },
  {
    employeeId: 'user-contract-1',
    date: '2026-07-22',
    category: 'lwop',
    amount: 0.5,
    half: 'PM',
  },
  {
    employeeId: 'user-newly-reg-3',
    date: '2026-07-09',
    category: 'vl',
    amount: 1,
  },
  // July 2026 — CIV
  {
    employeeId: 'user-paul',
    date: '2026-07-28',
    category: 'others',
    amount: 1,
  },
  {
    employeeId: 'user-paul',
    date: '2026-07-29',
    category: 'others',
    amount: 0.5,
    half: 'AM',
  },
  // June 2026 — for month filter smoke tests
  {
    employeeId: 'user-employee',
    date: '2026-06-05',
    category: 'vl',
    amount: 1,
  },
  {
    employeeId: 'user-sally',
    date: '2026-06-12',
    category: 'sl',
    amount: 1,
  },
  {
    employeeId: 'user-melissa',
    date: '2026-06-18',
    category: 'lwop',
    amount: 1,
  },
]

function toISODate(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function getDaysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate()
}

function isWeekend(iso: string): boolean {
  const date = new Date(`${iso}T00:00:00`)
  const dow = date.getDay()
  return dow === 0 || dow === 6
}

function isNonWorkingDay(iso: string): boolean {
  return isWeekend(iso) || isNonWorkingHoliday(iso)
}

export function getAttendanceCutOffLabel(cutOff: AttendanceCutOff): string {
  return (
    ATTENDANCE_CUT_OFF_OPTIONS.find((option) => option.value === cutOff)?.label ??
    cutOff
  )
}

export function getAttendanceGroups(): string[] {
  return getLeaveBalanceGroups()
}

export function getAttendanceEmployees(
  group: 'ALL' | string = 'ALL',
): AttendanceEmployee[] {
  return getAdminLeaveBalanceRows()
    .filter((employee) => group === 'ALL' || employee.groupLabel === group)
    .map(toAttendanceEmployee)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function getAttendanceLeaveDays(): AttendanceLeaveDay[] {
  return ATTENDANCE_LEAVE_DAYS.map((day) => ({ ...day }))
}

function toAttendanceEmployee(employee: LeaveBalanceEmployee): AttendanceEmployee {
  return {
    id: employee.id,
    name: employee.name,
    employeeNumber: employee.employeeNumber,
    groupLabel: employee.groupLabel,
  }
}

function getCutOffDayRange(
  year: number,
  monthIndex: number,
  cutOff: AttendanceCutOff,
): { startDay: number; endDay: number } {
  const lastDay = getDaysInMonth(year, monthIndex)

  switch (cutOff) {
    case 'monthly':
      return { startDay: 1, endDay: lastDay }
    case 'first-half':
      return { startDay: 1, endDay: Math.min(15, lastDay) }
    case 'second-half':
      return { startDay: 16, endDay: lastDay }
  }
}

export function getAttendanceDateColumns(
  year: number,
  monthIndex: number,
  cutOff: AttendanceCutOff,
): AttendanceDateColumn[] {
  const { startDay, endDay } = getCutOffDayRange(year, monthIndex, cutOff)
  const columns: AttendanceDateColumn[] = []

  for (let day = startDay; day <= endDay; day += 1) {
    const date = toISODate(year, monthIndex, day)
    const parsed = new Date(`${date}T00:00:00`)
    columns.push({
      date,
      dayOfMonth: day,
      weekdayShort: WEEKDAY_SHORT[parsed.getDay()],
      isNonWorking: isNonWorkingDay(date),
    })
  }

  return columns
}

function formatCellDisplay(day: AttendanceLeaveDay): string {
  if (day.amount === 0.5) {
    return `0.5 (${day.half ?? 'AM'})`
  }
  return '1'
}

function addToTotals(
  totals: AttendanceLeaveTotals,
  category: AttendanceLeaveCategory,
  amount: AttendanceDayAmount,
): void {
  totals[category] += amount
}

function buildLeaveLookup(
  employeeIds: Set<string>,
  dateSet: Set<string>,
): Map<string, AttendanceLeaveDay> {
  const lookup = new Map<string, AttendanceLeaveDay>()

  for (const day of ATTENDANCE_LEAVE_DAYS) {
    if (!employeeIds.has(day.employeeId) || !dateSet.has(day.date)) continue
    lookup.set(`${day.employeeId}:${day.date}`, day)
  }

  return lookup
}

export type BuildAttendanceReportParams = {
  year: number
  monthIndex: number
  cutOff: AttendanceCutOff
  group: 'ALL' | string
  employeeIds: string[]
  generatedAt?: Date
}

export function buildAttendanceReport(
  params: BuildAttendanceReportParams,
): AttendanceReport | null {
  const {
    year,
    monthIndex,
    cutOff,
    group,
    employeeIds,
    generatedAt = new Date(),
  } = params

  if (employeeIds.length === 0) return null

  const employeeIdSet = new Set(employeeIds)
  const employees = getAdminLeaveBalanceRows()
    .filter(
      (employee) =>
        employeeIdSet.has(employee.id) &&
        (group === 'ALL' || employee.groupLabel === group),
    )
    .map(toAttendanceEmployee)
    .sort((a, b) => a.name.localeCompare(b.name))

  if (employees.length === 0) return null

  const dates = getAttendanceDateColumns(year, monthIndex, cutOff)
  const dateSet = new Set(dates.map((column) => column.date))
  const leaveLookup = buildLeaveLookup(employeeIdSet, dateSet)

  const rows: AttendanceEmployeeRow[] = employees.map((employee) => {
    const totals: AttendanceLeaveTotals = { ...EMPTY_TOTALS }
    const cells: AttendanceCell[] = dates.map((column) => {
      const leaveDay = leaveLookup.get(`${employee.id}:${column.date}`)

      if (!leaveDay) {
        return {
          date: column.date,
          display: '',
          category: null,
          isNonWorking: column.isNonWorking,
        }
      }

      addToTotals(totals, leaveDay.category, leaveDay.amount)

      return {
        date: column.date,
        display: formatCellDisplay(leaveDay),
        category: leaveDay.category,
        isNonWorking: column.isNonWorking,
      }
    })

    return { employee, cells, totals }
  })

  const grandTotals = rows.reduce<AttendanceLeaveTotals>(
    (acc, row) => ({
      vl: acc.vl + row.totals.vl,
      sl: acc.sl + row.totals.sl,
      others: acc.others + row.totals.others,
      lwop: acc.lwop + row.totals.lwop,
    }),
    { ...EMPTY_TOTALS },
  )

  return {
    monthYearLabel: formatMonthYearLabel(year, monthIndex),
    cutOffLabel: getAttendanceCutOffLabel(cutOff),
    groupLabel: group === 'ALL' ? 'All Groups' : group,
    employeeCount: employees.length,
    generatedAt,
    dates,
    rows,
    grandTotals,
  }
}
