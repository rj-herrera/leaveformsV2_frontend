/**
 * TODO(REPLACE): Employees with LWOP — replace with API.
 *
 * Suggested Excel filename (when export is wired):
 * Employees_With_LWOP_{YYYY}.xlsx
 *
 * Detail breakdown by LWOP date is deferred; seed records retain dates so a
 * future enhancement can expand without changing the aggregation source.
 */
import {
  getAdminLeaveBalanceRows,
  getLeaveBalanceGroups,
  type LeaveBalanceEmployee,
} from './leaveBalances'

export type LwopDayType = 'whole' | 'half-am' | 'half-pm'

/** Raw LWOP leave request seed (kept for future detail views). */
export type LwopDetailRecord = {
  leaveRequestNo: string
  employeeId: string
  /** ISO YYYY-MM-DD */
  startDate: string
  /** ISO YYYY-MM-DD */
  endDate: string
  dayType: LwopDayType
  /** 1 whole day, 0.5 half day, or multi-day total */
  lwopDays: number
  originalLeaveType: string | null
  reason: string
  status: string
  remarks: string
}

export type LwopEmployeeSummary = {
  employeeId: string
  employeeNumber: string
  employeeName: string
  groupLabel: string
  totalLwopDays: number
}

export type LwopReportTotals = {
  employeeCount: number
  totalLwopDays: number
}

export type EmployeesWithLwopReport = {
  year: number
  reportingPeriodStart: string
  reportingPeriodEnd: string
  reportingPeriodLabel: string
  employeeCount: number
  generatedAt: Date
  summaries: LwopEmployeeSummary[]
  totals: LwopReportTotals
}

export type BuildEmployeesWithLwopReportParams = {
  year: number
  generatedAt?: Date
}

export type FilterEmployeesWithLwopParams = {
  search?: string
  group?: 'ALL' | string
}

/** Seed LWOP leave requests (unique by leaveRequestNo). */
const LWOP_RECORDS: LwopDetailRecord[] = [
  {
    leaveRequestNo: 'LR-2026-0701',
    employeeId: 'user-melissa',
    startDate: '2026-07-07',
    endDate: '2026-07-08',
    dayType: 'whole',
    lwopDays: 2,
    originalLeaveType: null,
    reason: 'Personal matters; no remaining leave credits',
    status: 'Approved',
    remarks: '',
  },
  {
    leaveRequestNo: 'LR-2026-0702',
    employeeId: 'user-contract-1',
    startDate: '2026-07-22',
    endDate: '2026-07-22',
    dayType: 'half-pm',
    lwopDays: 0.5,
    originalLeaveType: 'Vacation Leave',
    reason: 'Insufficient VL balance for afternoon absence',
    status: 'Approved',
    remarks: 'Converted excess to LWOP',
  },
  {
    leaveRequestNo: 'LR-2026-0703',
    employeeId: 'user-employee',
    startDate: '2026-07-08',
    endDate: '2026-07-08',
    dayType: 'whole',
    lwopDays: 1,
    originalLeaveType: null,
    reason: 'No available leave credits',
    status: 'Approved',
    remarks: '',
  },
  {
    leaveRequestNo: 'LR-2026-0704',
    employeeId: 'user-employee',
    startDate: '2026-07-17',
    endDate: '2026-07-17',
    dayType: 'half-am',
    lwopDays: 0.5,
    originalLeaveType: 'Sick Leave',
    reason: 'SL balance exhausted',
    status: 'Approved',
    remarks: 'Half-day AM',
  },
  {
    leaveRequestNo: 'LR-2026-0705',
    employeeId: 'user-sally',
    startDate: '2026-07-10',
    endDate: '2026-07-10',
    dayType: 'half-am',
    lwopDays: 0.5,
    originalLeaveType: null,
    reason: 'Personal appointment',
    status: 'Approved',
    remarks: '',
  },
  {
    leaveRequestNo: 'LR-2026-0706',
    employeeId: 'user-paul',
    startDate: '2026-07-27',
    endDate: '2026-07-29',
    dayType: 'whole',
    lwopDays: 3,
    originalLeaveType: 'Vacation Leave',
    reason: 'VL credits insufficient for full period',
    status: 'Approved',
    remarks: 'Partial conversion to LWOP',
  },
  {
    leaveRequestNo: 'LR-2026-0707',
    employeeId: 'user-newly-reg-2',
    startDate: '2026-07-03',
    endDate: '2026-07-03',
    dayType: 'whole',
    lwopDays: 1,
    originalLeaveType: null,
    reason: 'Leave without pay requested',
    status: 'Approved',
    remarks: '',
  },
  {
    leaveRequestNo: 'LR-2026-0708',
    employeeId: 'user-cecile',
    startDate: '2026-07-21',
    endDate: '2026-07-21',
    dayType: 'half-pm',
    lwopDays: 0.5,
    originalLeaveType: 'Emergency Leave',
    reason: 'Emergency leave credits not applicable',
    status: 'Approved',
    remarks: '',
  },
  {
    leaveRequestNo: 'LR-2026-0601',
    employeeId: 'user-melissa',
    startDate: '2026-06-18',
    endDate: '2026-06-18',
    dayType: 'whole',
    lwopDays: 1,
    originalLeaveType: null,
    reason: 'No remaining leave credits',
    status: 'Approved',
    remarks: '',
  },
  {
    leaveRequestNo: 'LR-2026-0602',
    employeeId: 'user-employee-2',
    startDate: '2026-06-05',
    endDate: '2026-06-06',
    dayType: 'whole',
    lwopDays: 2,
    originalLeaveType: 'Vacation Leave',
    reason: 'Insufficient VL balance',
    status: 'Approved',
    remarks: '',
  },
  // 2025 — for year filter smoke tests
  {
    leaveRequestNo: 'LR-2025-1101',
    employeeId: 'user-employee',
    startDate: '2025-11-12',
    endDate: '2025-11-12',
    dayType: 'whole',
    lwopDays: 1,
    originalLeaveType: null,
    reason: 'No remaining leave credits',
    status: 'Approved',
    remarks: '',
  },
]

function parseIso(iso: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return new Date(NaN)
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function formatLwopDateLabel(isoDate: string): string {
  const date = parseIso(isoDate)
  if (Number.isNaN(date.getTime())) return isoDate
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function toDateKey(date: Date): string {
  return toIsoDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
}

/**
 * Reporting period for a calendar year, capped at `asOf` (defaults to today).
 * Past years keep Jan 1 – Dec 31; the current year ends on the present date.
 * Future years have no covered range yet (`end` is empty).
 */
export function getYearReportingPeriod(
  year: number,
  asOf: Date = new Date(),
): {
  start: string
  end: string
  label: string
} {
  const start = toIsoDate(year, 1, 1)
  const yearEnd = toIsoDate(year, 12, 31)
  const asOfIso = toDateKey(asOf)
  const end = yearEnd < asOfIso ? yearEnd : asOfIso

  if (end < start) {
    return {
      start,
      end: '',
      label: `${formatLwopDateLabel(start)} – present (not yet started)`,
    }
  }

  return {
    start,
    end,
    label: `${formatLwopDateLabel(start)} – ${formatLwopDateLabel(end)}`,
  }
}

function rangesIntersect(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  return startA <= endB && endA >= startB
}

export function getLwopGroups(): string[] {
  return getLeaveBalanceGroups()
}

export function getLwopRecords(): LwopDetailRecord[] {
  return LWOP_RECORDS.map((record) => ({ ...record }))
}

export function sumLwopSummaries(
  summaries: LwopEmployeeSummary[],
): LwopReportTotals {
  let totalLwopDays = 0
  for (const summary of summaries) {
    totalLwopDays += summary.totalLwopDays
  }
  return {
    employeeCount: summaries.length,
    totalLwopDays,
  }
}

function toEmployeeLookup(): Map<string, LeaveBalanceEmployee> {
  return new Map(
    getAdminLeaveBalanceRows().map((employee) => [employee.id, employee]),
  )
}

/**
 * Builds the yearly Employees with LWOP report.
 * Includes every employee with at least one LWOP record intersecting the year.
 * Does not require pre-selecting employees or a group.
 */
export function buildEmployeesWithLwopReport(
  params: BuildEmployeesWithLwopReportParams,
): EmployeesWithLwopReport {
  const { year, generatedAt = new Date() } = params
  const period = getYearReportingPeriod(year, generatedAt)
  const employees = toEmployeeLookup()
  const daysByEmployee = new Map<string, number>()
  const seenRequestNos = new Set<string>()

  for (const record of LWOP_RECORDS) {
    if (seenRequestNos.has(record.leaveRequestNo)) continue
    seenRequestNos.add(record.leaveRequestNo)

    if (
      !period.end ||
      !rangesIntersect(
        record.startDate,
        record.endDate,
        period.start,
        period.end,
      )
    ) {
      continue
    }

    const employee = employees.get(record.employeeId)
    if (!employee) continue

    daysByEmployee.set(
      employee.id,
      (daysByEmployee.get(employee.id) ?? 0) + record.lwopDays,
    )
  }

  const summaries = Array.from(daysByEmployee.entries())
    .map(([employeeId, totalLwopDays]) => {
      const employee = employees.get(employeeId)
      if (!employee) return null
      return {
        employeeId: employee.id,
        employeeNumber: employee.employeeNumber,
        employeeName: employee.name,
        groupLabel: employee.groupLabel,
        totalLwopDays,
      } satisfies LwopEmployeeSummary
    })
    .filter((summary): summary is LwopEmployeeSummary => summary != null)
    .sort((a, b) => {
      const byDays = b.totalLwopDays - a.totalLwopDays
      if (byDays !== 0) return byDays
      return a.employeeName.localeCompare(b.employeeName)
    })

  const totals = sumLwopSummaries(summaries)

  return {
    year,
    reportingPeriodStart: period.start,
    reportingPeriodEnd: period.end,
    reportingPeriodLabel: period.label,
    employeeCount: totals.employeeCount,
    generatedAt,
    summaries,
    totals,
  }
}

/** Display-only filters; does not regenerate the report. */
export function filterEmployeesWithLwop(
  summaries: LwopEmployeeSummary[],
  params: FilterEmployeesWithLwopParams = {},
): LwopEmployeeSummary[] {
  const query = params.search?.trim().toLowerCase() ?? ''
  const group = params.group ?? 'ALL'

  return summaries.filter((summary) => {
    const matchesGroup = group === 'ALL' || summary.groupLabel === group
    if (!matchesGroup) return false
    if (!query) return true
    return (
      summary.employeeNumber.toLowerCase().includes(query) ||
      summary.employeeName.toLowerCase().includes(query)
    )
  })
}
