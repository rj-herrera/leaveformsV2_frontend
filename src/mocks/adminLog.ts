/**
 * TODO(REPLACE): Administrative log mock store — replace with API.
 */
import { MOCK_DATA_ENABLED } from './config'

export type AdminLogEntry = {
  id: string
  eventType: string
  /** Display label for the Activity column */
  activity: string
  occurredAt: string
  actorName: string
  targetEmployeeId: string | null
  targetEmployeeName: string
  employeeNumber: string | null
  groupLabel: string | null
  leaveType: string | null
  /** e.g. "+2 VL (12 → 14)" — shown as Activity subtitle / tooltip */
  balanceImpact: string | null
  remarks: string | null
  direction?: 'add' | 'deduct'
  amount?: number
  before?: number
  after?: number
  effectiveDate?: string
  reasonCategory?: string
  ticketRef?: string | null
}

export type AdminLogFilters = {
  search?: string
  activity?: string
  leaveType?: string
  actor?: string
  group?: string
  /** Inclusive day bounds (YYYY-MM-DD) — kept for callers that need them */
  dateFrom?: string
  dateTo?: string
  /** Month filter as YYYY-MM (from `<input type="month">`) */
  monthYear?: string
}

const ADMIN_LOG: AdminLogEntry[] = [
  {
    id: 'alog-1',
    eventType: 'LEAVE_APPROVED',
    activity: 'Leave request approved',
    occurredAt: '2026-06-03T14:20:00',
    actorName: 'Ariane Derigay',
    targetEmployeeId: 'user-employee-2',
    targetEmployeeName: 'Sam Rivera',
    employeeNumber: '807',
    groupLabel: 'SYS',
    leaveType: 'Paternity Leave',
    balanceImpact: null,
    remarks: null,
  },
  {
    id: 'alog-2',
    eventType: 'LEAVE_SUBMITTED',
    activity: 'Leave request submitted',
    occurredAt: '2026-06-01T09:05:00',
    actorName: 'Jordan Approver',
    targetEmployeeId: 'user-employee-2',
    targetEmployeeName: 'Sam Rivera',
    employeeNumber: '807',
    groupLabel: 'SYS',
    leaveType: 'Paternity Leave',
    balanceImpact: null,
    remarks: 'Filed by leader on behalf of employee',
  },
  {
    id: 'alog-3',
    eventType: 'CONVERSION_APPROVED',
    activity: 'Leave-type conversion approved',
    occurredAt: '2026-03-04T16:40:00',
    actorName: 'Casey Admin',
    targetEmployeeId: 'user-employee',
    targetEmployeeName: 'Alex Employee',
    employeeNumber: '801',
    groupLabel: 'SYS',
    leaveType: 'Vacation Leave to Sick Leave',
    balanceImpact: null,
    remarks: 'Medical certificate verified',
  },
  {
    id: 'alog-4',
    eventType: 'FILE_UPLOADED',
    activity: 'File uploaded',
    occurredAt: '2026-03-04T11:15:00',
    actorName: 'Alex Employee',
    targetEmployeeId: 'user-employee',
    targetEmployeeName: 'Alex Employee',
    employeeNumber: '801',
    groupLabel: 'SYS',
    leaveType: 'Vacation Leave to Sick Leave',
    balanceImpact: null,
    remarks: 'medical_certificate.pdf',
  },
  {
    id: 'alog-5',
    eventType: 'LEAVE_CONFIRMED',
    activity: 'Leave confirmed',
    occurredAt: '2026-03-03T10:00:00',
    actorName: 'System',
    targetEmployeeId: 'user-employee',
    targetEmployeeName: 'Alex Employee',
    employeeNumber: '801',
    groupLabel: 'SYS',
    leaveType: 'Vacation Leave',
    balanceImpact: '-3 VL (15 → 12)',
    remarks: null,
  },
  {
    id: 'alog-6',
    eventType: 'LEAVE_SUBMITTED',
    activity: 'Leave request submitted',
    occurredAt: '2026-03-03T08:30:00',
    actorName: 'Alex Employee',
    targetEmployeeId: 'user-employee',
    targetEmployeeName: 'Alex Employee',
    employeeNumber: '801',
    groupLabel: 'SYS',
    leaveType: 'Vacation Leave',
    balanceImpact: '3.0 VL reserved',
    remarks: null,
  },
  {
    id: 'alog-7',
    eventType: 'LEAVE_CREDIT_DISTRIBUTED',
    activity: 'Leave Credit Distributed',
    occurredAt: '2026-01-01T09:00:00',
    actorName: 'Ariane Derigay',
    targetEmployeeId: null,
    targetEmployeeName: 'Multiple Employees',
    employeeNumber: null,
    groupLabel: null,
    leaveType: 'Sick Leave',
    balanceImpact: '+15 SL per eligible employee',
    remarks: 'Annual leave credit distribution',
  },
  {
    id: 'alog-8',
    eventType: 'LEAVE_CREDIT_DISTRIBUTED',
    activity: 'Leave Credit Distributed',
    occurredAt: '2026-01-01T09:00:00',
    actorName: 'Ariane Derigay',
    targetEmployeeId: null,
    targetEmployeeName: 'Multiple Employees',
    employeeNumber: null,
    groupLabel: null,
    leaveType: 'Vacation Leave',
    balanceImpact: '+15 VL per eligible employee',
    remarks: 'Annual leave credit distribution',
  },
  {
    id: 'alog-9',
    eventType: 'BALANCE_ADJUSTMENT',
    activity: 'Leave credits added',
    occurredAt: '2026-02-12T13:45:00',
    actorName: 'Casey Admin',
    targetEmployeeId: 'user-cecile',
    targetEmployeeName: 'Cecile Santos',
    employeeNumber: '810',
    groupLabel: 'SYS',
    leaveType: 'Emergency Leave',
    balanceImpact: '+2 EL (3 → 5)',
    remarks: 'Emergency grant',
    direction: 'add',
    amount: 2,
    before: 3,
    after: 5,
    effectiveDate: '2026-02-12',
    reasonCategory: 'Emergency grant',
    ticketRef: null,
  },
  {
    id: 'alog-10',
    eventType: 'LEAVE_REJECTED',
    activity: 'Leave request rejected',
    occurredAt: '2026-04-18T15:10:00',
    actorName: 'Casey Admin',
    targetEmployeeId: 'user-employee-3',
    targetEmployeeName: 'Taylor Cruz',
    employeeNumber: '808',
    groupLabel: 'IT',
    leaveType: 'Emergency Leave',
    balanceImpact: null,
    remarks: 'Insufficient documentation for emergency leave',
  },
  {
    id: 'alog-11',
    eventType: 'LEAVE_CANCELLED',
    activity: 'Leave cancellation processed',
    occurredAt: '2026-05-22T11:30:00',
    actorName: 'Casey Admin',
    targetEmployeeId: 'user-sally',
    targetEmployeeName: 'Sally Bautista',
    employeeNumber: '812',
    groupLabel: 'SYS',
    leaveType: 'Vacation Leave',
    balanceImpact: '+2 VL restored (12 → 14)',
    remarks: 'Employee cancelled approved leave before start date',
  },
]

export function getAdminLogEntries(): AdminLogEntry[] {
  if (!MOCK_DATA_ENABLED) return []
  return [...ADMIN_LOG].sort((a, b) =>
    b.occurredAt.localeCompare(a.occurredAt),
  )
}

function dayStartIso(date: string): string {
  return `${date}T00:00:00`
}

function dayEndIso(date: string): string {
  return `${date}T23:59:59`
}

export function filterAdminLogEntries(
  rows: AdminLogEntry[],
  filters: AdminLogFilters,
): AdminLogEntry[] {
  const query = (filters.search ?? '').trim().toLowerCase()
  const activity = filters.activity ?? 'ALL'
  const leaveType = filters.leaveType ?? 'ALL'
  const actor = filters.actor ?? 'ALL'
  const group = filters.group ?? 'ALL'
  const dateFrom = (filters.dateFrom ?? '').trim()
  const dateTo = (filters.dateTo ?? '').trim()
  const monthYear = (filters.monthYear ?? '').trim()

  return rows.filter((row) => {
    const matchesSearch =
      query.length === 0 ||
      row.targetEmployeeName.toLowerCase().includes(query) ||
      (row.employeeNumber != null &&
        row.employeeNumber.toLowerCase().includes(query))

    const matchesActivity = activity === 'ALL' || row.activity === activity
    const matchesLeaveType =
      leaveType === 'ALL' || row.leaveType === leaveType
    const matchesActor = actor === 'ALL' || row.actorName === actor
    const matchesGroup = group === 'ALL' || row.groupLabel === group

    const matchesDateFrom =
      dateFrom.length === 0 || row.occurredAt >= dayStartIso(dateFrom)
    const matchesDateTo =
      dateTo.length === 0 || row.occurredAt <= dayEndIso(dateTo)
    const matchesMonthYear =
      monthYear.length === 0 || row.occurredAt.startsWith(monthYear)

    return (
      matchesSearch &&
      matchesActivity &&
      matchesLeaveType &&
      matchesActor &&
      matchesGroup &&
      matchesDateFrom &&
      matchesDateTo &&
      matchesMonthYear
    )
  })
}

function distinctSorted(
  values: Array<string | null | undefined>,
): string[] {
  return Array.from(
    new Set(values.filter((v): v is string => Boolean(v && v.trim()))),
  ).sort((a, b) => a.localeCompare(b))
}

export function getAdminLogActivities(): string[] {
  return distinctSorted(getAdminLogEntries().map((row) => row.activity))
}

export function getAdminLogActors(): string[] {
  return distinctSorted(getAdminLogEntries().map((row) => row.actorName))
}

export function getAdminLogGroups(): string[] {
  return distinctSorted(getAdminLogEntries().map((row) => row.groupLabel))
}

export function getAdminLogLeaveTypes(): string[] {
  return distinctSorted(getAdminLogEntries().map((row) => row.leaveType))
}

export function appendAdminLogEntry(
  entry: Omit<AdminLogEntry, 'id'> & { id?: string },
): AdminLogEntry {
  const full: AdminLogEntry = {
    id: entry.id ?? `alog-${Date.now()}-${ADMIN_LOG.length + 1}`,
    eventType: entry.eventType,
    activity: entry.activity,
    occurredAt: entry.occurredAt,
    actorName: entry.actorName,
    targetEmployeeId: entry.targetEmployeeId,
    targetEmployeeName: entry.targetEmployeeName,
    employeeNumber: entry.employeeNumber,
    groupLabel: entry.groupLabel,
    leaveType: entry.leaveType,
    balanceImpact: entry.balanceImpact,
    remarks: entry.remarks,
    direction: entry.direction,
    amount: entry.amount,
    before: entry.before,
    after: entry.after,
    effectiveDate: entry.effectiveDate,
    reasonCategory: entry.reasonCategory,
    ticketRef: entry.ticketRef ?? null,
  }
  ADMIN_LOG.unshift(full)
  return full
}
