/**
 * TODO(REPLACE): Admin leave balances + distribution drafts — replace with API.
 */
import { MOCK_DATA_ENABLED } from './config'
import { appendActivityLogEntry } from './activityLog'
import { appendAdminLogEntry } from './adminLog'
import {
  MATERNITY_LEAVE_TYPE,
  PATERNITY_LEAVE_TYPE,
} from '../utils/leaveDates'

export type EmploymentStatus = 'regular' | 'probationary' | 'contractual'

export type LeaveBalanceKey = 'vl' | 'sl' | 'el' | 'ml' | 'pl' | 'ptb'

export type LeaveBalances = Record<LeaveBalanceKey, number | null>

export type LeaveBalanceEmployee = {
  id: string
  name: string
  employeeNumber: string
  department: string
  groupLabel: string
  employmentStatus: EmploymentStatus
  balances: LeaveBalances
  /** ISO date */
  dateHired: string
  /** ISO date — null if not yet regularized */
  regularizationDate: string | null
  yearsOfServiceLabel: string
  /** Filed ML/PL requests — used to gate mock parental credit visibility on the dashboard */
  filedParentalRequests: FiledParentalRequest[]
}

export type FiledParentalByRole = 'employee' | 'leader'

export type FiledParentalRequest = {
  leaveType: 'Maternity Leave' | 'Paternity Leave'
  /** ISO date */
  dateFiled: string
  /** Display range, e.g. "Aug 17–Nov 29, 2026" */
  leavePeriod: string
  reason: string
  attachmentFileName: string | null
  attachmentNote: string | null
  /** Who submitted the leave request */
  filedByRole: FiledParentalByRole
  /** Name of the person who filed (employee or leader) */
  filedByName: string
}

export const EMPLOYMENT_STATUS_LABELS: Record<EmploymentStatus, string> = {
  regular: 'Regular',
  probationary: 'Probationary',
  contractual: 'Contractual',
}

export const LEAVE_BALANCE_KEYS: LeaveBalanceKey[] = [
  'vl',
  'sl',
  'el',
  'ml',
  'pl',
  'ptb',
]

export const LEAVE_BALANCE_LABELS: Record<LeaveBalanceKey, string> = {
  vl: 'Vacation Leave',
  sl: 'Sick Leave',
  el: 'Emergency Leave',
  ml: 'Maternity Leave',
  pl: 'Paternity Leave',
  ptb: 'PTB Leave',
}

export const LEAVE_BALANCE_SHORT: Record<LeaveBalanceKey, string> = {
  vl: 'VL',
  sl: 'SL',
  el: 'EL',
  ml: 'ML',
  pl: 'PL',
  ptb: 'PTB',
}

export const LEAVE_BALANCE_CHIP_CLASS: Record<LeaveBalanceKey, string> = {
  vl: 'bg-leave-vacation/30 text-text-black',
  sl: 'bg-leave-sick/30 text-text-black',
  el: 'bg-leave-emergency/35 text-text-black',
  ml: 'bg-leave-maternity/30 text-text-black',
  pl: 'bg-leave-paternity/30 text-text-black',
  ptb: 'bg-leave-ptb/30 text-text-black',
}

const ANNUAL_VL_TO_ADD = 15
const ANNUAL_SL_TO_ADD = 15
const NEWLY_REG_RATE = 1.25
const NEWLY_REG_PTB = 180

/** Mutable seed — adjustments mutate balances in place. */
const EMPLOYEES: LeaveBalanceEmployee[] = [
  {
    id: 'user-employee',
    name: 'Alex Employee',
    employeeNumber: '801',
    department: 'Solution',
    groupLabel: 'SYS',
    employmentStatus: 'regular',
    balances: { vl: 12, sl: 8, el: 3, ml: 105, pl: null, ptb: 7 },
    dateHired: '2020-03-01',
    regularizationDate: '2020-09-01',
    yearsOfServiceLabel: '6 yrs',
    filedParentalRequests: [],
  },
  {
    id: 'user-employee-2',
    name: 'Sam Rivera',
    employeeNumber: '807',
    department: 'Solution',
    groupLabel: 'SYS',
    employmentStatus: 'regular',
    balances: { vl: 5, sl: 10, el: 2, ml: null, pl: 7, ptb: 7 },
    dateHired: '2021-06-15',
    regularizationDate: '2021-12-15',
    yearsOfServiceLabel: '5 yrs',
    filedParentalRequests: [
      {
        leaveType: 'Paternity Leave',
        dateFiled: '2026-07-08',
        leavePeriod: 'Jul 20–28, 2026',
        reason: 'Birth of child — bonding leave',
        attachmentFileName: 'Paternity_Form.pdf',
        attachmentNote: null,
        filedByRole: 'leader',
        filedByName: 'Jordan Approver',
      },
    ],
  },
  {
    id: 'user-employee-3',
    name: 'Taylor Cruz',
    employeeNumber: '808',
    department: 'IT',
    groupLabel: 'IT',
    employmentStatus: 'regular',
    balances: { vl: 1, sl: 4, el: 0, ml: 60, pl: null, ptb: 3 },
    dateHired: '2019-01-10',
    regularizationDate: '2019-07-10',
    yearsOfServiceLabel: '7 yrs',
    filedParentalRequests: [
      {
        leaveType: 'Maternity Leave',
        dateFiled: '2026-05-12',
        leavePeriod: 'Aug 17–Nov 29, 2026',
        reason: 'Maternity leave',
        attachmentFileName: 'Maternity_docs.pdf',
        attachmentNote: null,
        filedByRole: 'employee',
        filedByName: 'Taylor Cruz',
      },
    ],
  },
  {
    id: 'user-cecile',
    name: 'Cecile Santos',
    employeeNumber: '810',
    department: 'Solution',
    groupLabel: 'SYS',
    employmentStatus: 'regular',
    balances: { vl: 9.5, sl: 12, el: 5, ml: null, pl: null, ptb: 180 },
    dateHired: '2018-04-02',
    regularizationDate: '2018-10-02',
    yearsOfServiceLabel: '8 yrs',
    filedParentalRequests: [],
  },
  {
    id: 'user-melissa',
    name: 'Melissa Aguilar',
    employeeNumber: '811',
    department: 'Project',
    groupLabel: 'PIP',
    employmentStatus: 'probationary',
    balances: { vl: 0, sl: 0, el: null, ml: null, pl: null, ptb: null },
    dateHired: '2026-02-01',
    regularizationDate: null,
    yearsOfServiceLabel: '< 1 yr',
    filedParentalRequests: [],
  },
  {
    id: 'user-sally',
    name: 'Sally Bautista',
    employeeNumber: '812',
    department: 'Solution',
    groupLabel: 'SYS',
    employmentStatus: 'regular',
    balances: { vl: 14, sl: 15, el: 5, ml: 105, pl: null, ptb: 180 },
    dateHired: '2017-08-20',
    regularizationDate: '2018-02-20',
    yearsOfServiceLabel: '8 yrs',
    filedParentalRequests: [
      {
        leaveType: 'Maternity Leave',
        dateFiled: '2026-06-02',
        leavePeriod: 'Sep 1–Dec 14, 2026',
        reason: 'Maternity leave — expected delivery September 2026',
        attachmentFileName: 'Maternity_medical_certificate.pdf',
        attachmentNote: null,
        filedByRole: 'employee',
        filedByName: 'Sally Bautista',
      },
    ],
  },
  {
    id: 'user-emman',
    name: 'Emman De Leon',
    employeeNumber: '813',
    department: 'Solution',
    groupLabel: 'SYS',
    employmentStatus: 'regular',
    balances: { vl: 7, sl: 6.5, el: 3, ml: null, pl: 0, ptb: 90 },
    dateHired: '2022-01-05',
    regularizationDate: '2022-07-05',
    yearsOfServiceLabel: '4 yrs',
    filedParentalRequests: [],
  },
  {
    id: 'user-paul',
    name: 'Paul Hernandez',
    employeeNumber: '899',
    department: 'Project',
    groupLabel: 'CIV',
    employmentStatus: 'regular',
    balances: { vl: 3, sl: 8, el: 1, ml: null, pl: 7, ptb: 120 },
    dateHired: '2023-05-12',
    regularizationDate: '2023-11-12',
    yearsOfServiceLabel: '3 yrs',
    filedParentalRequests: [
      {
        leaveType: 'Paternity Leave',
        dateFiled: '2026-07-15',
        leavePeriod: 'Aug 3–11, 2026',
        reason: 'Paternity leave for newborn',
        attachmentFileName: 'Birth_certificate.jpg',
        attachmentNote: null,
        filedByRole: 'leader',
        filedByName: 'Approver 2',
      },
    ],
  },
  {
    id: 'user-newly-reg-1',
    name: 'Nina Gomez',
    employeeNumber: '820',
    department: 'Solution',
    groupLabel: 'SYS',
    employmentStatus: 'regular',
    balances: { vl: 0, sl: 0, el: null, ml: null, pl: null, ptb: null },
    dateHired: '2026-01-06',
    regularizationDate: '2026-07-06',
    yearsOfServiceLabel: '6 mos',
    filedParentalRequests: [],
  },
  {
    id: 'user-newly-reg-2',
    name: 'Rico Tan',
    employeeNumber: '821',
    department: 'IT',
    groupLabel: 'IT',
    employmentStatus: 'regular',
    balances: { vl: 0, sl: 0, el: null, ml: null, pl: null, ptb: null },
    dateHired: '2026-01-13',
    regularizationDate: '2026-07-13',
    yearsOfServiceLabel: '6 mos',
    filedParentalRequests: [],
  },
  {
    id: 'user-newly-reg-3',
    name: 'Aya Villanueva',
    employeeNumber: '822',
    department: 'Project',
    groupLabel: 'PIP',
    employmentStatus: 'regular',
    balances: { vl: 0, sl: 0, el: null, ml: null, pl: null, ptb: null },
    dateHired: '2026-01-20',
    regularizationDate: '2026-07-20',
    yearsOfServiceLabel: '6 mos',
    filedParentalRequests: [],
  },
  {
    id: 'user-newly-reg-4',
    name: 'Marco Reyes',
    employeeNumber: '823',
    department: 'Solution',
    groupLabel: 'SYS',
    employmentStatus: 'regular',
    balances: { vl: 0, sl: 0, el: null, ml: null, pl: null, ptb: null },
    dateHired: '2026-02-03',
    regularizationDate: '2026-08-03',
    yearsOfServiceLabel: '6 mos',
    filedParentalRequests: [],
  },
  {
    id: 'user-contract-1',
    name: 'Kai Morales',
    employeeNumber: '830',
    department: 'Project',
    groupLabel: 'PIP',
    employmentStatus: 'contractual',
    balances: { vl: 2, sl: 2, el: null, ml: null, pl: null, ptb: null },
    dateHired: '2026-03-03',
    regularizationDate: null,
    yearsOfServiceLabel: '< 1 yr',
    filedParentalRequests: [],
  },
  {
    id: 'user-contract-2',
    name: 'Lara Lim',
    employeeNumber: '831',
    department: 'Solution',
    groupLabel: 'SYS',
    employmentStatus: 'contractual',
    balances: { vl: 0, sl: 0, el: 0, ml: null, pl: null, ptb: null },
    dateHired: '2025-11-01',
    regularizationDate: null,
    yearsOfServiceLabel: '< 1 yr',
    filedParentalRequests: [],
  },
]

export function formatBalanceValue(value: number | null | undefined): string {
  if (value == null) return '—'
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function cloneEmployee(employee: LeaveBalanceEmployee): LeaveBalanceEmployee {
  return {
    ...employee,
    balances: { ...employee.balances },
    filedParentalRequests: employee.filedParentalRequests.map((r) => ({
      ...r,
    })),
  }
}

export function getAdminLeaveBalanceRows(): LeaveBalanceEmployee[] {
  if (!MOCK_DATA_ENABLED) return []
  return EMPLOYEES.map(cloneEmployee)
}

export function getLeaveBalanceEmployeeById(
  id: string,
): LeaveBalanceEmployee | null {
  if (!MOCK_DATA_ENABLED) return null
  const found = EMPLOYEES.find((row) => row.id === id)
  return found ? cloneEmployee(found) : null
}

export function getLeaveBalanceDepartments(): string[] {
  return Array.from(new Set(EMPLOYEES.map((e) => e.department))).sort((a, b) =>
    a.localeCompare(b),
  )
}

export function getLeaveBalanceGroups(): string[] {
  return Array.from(new Set(EMPLOYEES.map((e) => e.groupLabel))).sort((a, b) =>
    a.localeCompare(b),
  )
}

export function filterLeaveBalanceRows(
  rows: LeaveBalanceEmployee[],
  filters: {
    search?: string
    department?: string
    group?: string
    employmentStatus?: EmploymentStatus | 'ALL'
  },
): LeaveBalanceEmployee[] {
  const query = (filters.search ?? '').trim().toLowerCase()
  const department = filters.department ?? 'ALL'
  const group = filters.group ?? 'ALL'
  const employmentStatus = filters.employmentStatus ?? 'ALL'

  return rows.filter((row) => {
    const matchesSearch =
      query.length === 0 ||
      row.name.toLowerCase().includes(query) ||
      row.employeeNumber.toLowerCase().includes(query)
    const matchesDepartment =
      department === 'ALL' || row.department === department
    const matchesGroup = group === 'ALL' || row.groupLabel === group
    const matchesEmploymentStatus =
      employmentStatus === 'ALL' || row.employmentStatus === employmentStatus
    return (
      matchesSearch &&
      matchesDepartment &&
      matchesGroup &&
      matchesEmploymentStatus
    )
  })
}

// ---------------------------------------------------------------------------
// Annual distribution
// ---------------------------------------------------------------------------

export type AnnualCandidate = {
  employee: LeaveBalanceEmployee
  eligible: boolean
  yearsOfServiceLabel: string
  vlToAdd: number | null
  slToAdd: number | null
}

export type AnnualDistributionDraft = {
  selectedEmployeeIds: string[]
  groupFilter: string
  effectiveDate: string
}

let annualDraft: AnnualDistributionDraft | null = null

export function getAnnualDistributionCandidates(): AnnualCandidate[] {
  if (!MOCK_DATA_ENABLED) return []
  return EMPLOYEES.map((employee) => {
    const eligible = employee.employmentStatus === 'regular'
    return {
      employee: cloneEmployee(employee),
      eligible,
      yearsOfServiceLabel: employee.yearsOfServiceLabel,
      vlToAdd: eligible ? ANNUAL_VL_TO_ADD : null,
      slToAdd: eligible ? ANNUAL_SL_TO_ADD : null,
    }
  })
}

export function setAnnualDistributionDraft(
  draft: AnnualDistributionDraft,
): void {
  annualDraft = { ...draft, selectedEmployeeIds: [...draft.selectedEmployeeIds] }
}

export function getAnnualDistributionDraft(): AnnualDistributionDraft | null {
  return annualDraft
    ? {
        ...annualDraft,
        selectedEmployeeIds: [...annualDraft.selectedEmployeeIds],
      }
    : null
}

export function clearAnnualDistributionDraft(): void {
  annualDraft = null
}

export type AnnualReviewRow = {
  employee: LeaveBalanceEmployee
  yearsOfServiceLabel: string
  vlBefore: number
  vlToAdd: number
  vlAfter: number
  slBefore: number
  slToAdd: number
  slAfter: number
}

export function getAnnualReviewRows(
  selectedEmployeeIds: string[],
): AnnualReviewRow[] {
  const idSet = new Set(selectedEmployeeIds)
  return getAnnualDistributionCandidates()
    .filter((c) => c.eligible && idSet.has(c.employee.id))
    .map((c) => {
      const vlBefore = c.employee.balances.vl ?? 0
      const slBefore = c.employee.balances.sl ?? 0
      const vlToAdd = c.vlToAdd ?? 0
      const slToAdd = c.slToAdd ?? 0
      return {
        employee: c.employee,
        yearsOfServiceLabel: c.yearsOfServiceLabel,
        vlBefore,
        vlToAdd,
        vlAfter: vlBefore + vlToAdd,
        slBefore,
        slToAdd,
        slAfter: slBefore + slToAdd,
      }
    })
}

export function applyAnnualDistribution(selectedEmployeeIds: string[]): void {
  const idSet = new Set(selectedEmployeeIds)
  for (const employee of EMPLOYEES) {
    if (!idSet.has(employee.id) || employee.employmentStatus !== 'regular') {
      continue
    }
    employee.balances.vl = (employee.balances.vl ?? 0) + ANNUAL_VL_TO_ADD
    employee.balances.sl = (employee.balances.sl ?? 0) + ANNUAL_SL_TO_ADD
  }
  clearAnnualDistributionDraft()
}

// ---------------------------------------------------------------------------
// Newly regularized
// ---------------------------------------------------------------------------

export type NewlyRegularizedCandidate = {
  employee: LeaveBalanceEmployee
  eligible: boolean
  monthsSinceHired: number
  monthsProrated: number
  vlToAdd: number | null
  slToAdd: number | null
  ptbToAdd: number | null
}

export type NewlyRegularizedDraft = {
  selectedEmployeeIds: string[]
  groupFilter: string
  effectiveDate: string
}

let newlyRegDraft: NewlyRegularizedDraft | null = null

function monthsBetween(startIso: string, endIso: string): number {
  const start = new Date(startIso)
  const end = new Date(endIso)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0
  const months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth())
  return Math.max(0, months)
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Local calendar date as YYYY-MM-DD. */
export function todayIsoDate(): string {
  return toIsoDate(new Date())
}

/** Regularization date = Date Hired + 6 calendar months. */
export function computeRegularizationDate(dateHired: string): string | null {
  const date = new Date(`${dateHired}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null
  date.setMonth(date.getMonth() + 6)
  return toIsoDate(date)
}

/** Calendar months + leftover days between two ISO dates (end exclusive of borrow logic). */
export function formatMonthsAndDays(startIso: string, endIso: string): string {
  const start = new Date(`${startIso}T00:00:00`)
  const end = new Date(`${endIso}T00:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return '—'
  }

  let months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth())
  let days = end.getDate() - start.getDate()

  if (days < 0) {
    months -= 1
    const prevMonthLastDay = new Date(end.getFullYear(), end.getMonth(), 0).getDate()
    days += prevMonthLastDay
  }

  months = Math.max(0, months)
  const monthPart = months === 1 ? '1 month' : `${months} months`
  const dayPart = days === 1 ? '1 day' : `${days} days`
  return `${monthPart}, ${dayPart}`
}

/** Months/days from regularization date through Dec 31 of that year. */
export function formatProratedMonthsAndDays(
  regularizationIso: string | null,
): string {
  if (!regularizationIso) return '—'
  const start = new Date(`${regularizationIso}T00:00:00`)
  if (Number.isNaN(start.getTime())) return '—'
  const endIso = `${start.getFullYear()}-12-31`
  return formatMonthsAndDays(regularizationIso, endIso)
}

export function formatDisplayDate(iso: string | null): string {
  if (!iso) return '—'
  const date = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Months from regularization date through December of that year (inclusive). */
function proratedMonthsThroughDecember(regularizationIso: string): number {
  const date = new Date(regularizationIso)
  if (Number.isNaN(date.getTime())) return 0
  return 12 - date.getMonth()
}

export function getNewlyRegularizedCandidates(
  asOfIso = todayIsoDate(),
): NewlyRegularizedCandidate[] {
  if (!MOCK_DATA_ENABLED) return []
  return EMPLOYEES.map((employee) => {
    const regularizationDate = computeRegularizationDate(employee.dateHired)
    const monthsSinceHired = monthsBetween(employee.dateHired, asOfIso)
    const eligible =
      employee.employmentStatus === 'regular' &&
      regularizationDate != null &&
      monthsSinceHired >= 6 &&
      (employee.balances.vl ?? 0) < 5
    const monthsProrated = regularizationDate
      ? proratedMonthsThroughDecember(regularizationDate)
      : 0
    const credit = Math.round(monthsProrated * NEWLY_REG_RATE * 2) / 2
    return {
      employee: {
        ...cloneEmployee(employee),
        regularizationDate,
      },
      eligible,
      monthsSinceHired,
      monthsProrated,
      vlToAdd: eligible ? credit : null,
      slToAdd: eligible ? credit : null,
      ptbToAdd: eligible ? NEWLY_REG_PTB : null,
    }
  })
}

export function setNewlyRegularizedDraft(draft: NewlyRegularizedDraft): void {
  newlyRegDraft = {
    ...draft,
    selectedEmployeeIds: [...draft.selectedEmployeeIds],
  }
}

export function getNewlyRegularizedDraft(): NewlyRegularizedDraft | null {
  return newlyRegDraft
    ? {
        ...newlyRegDraft,
        selectedEmployeeIds: [...newlyRegDraft.selectedEmployeeIds],
      }
    : null
}

export function clearNewlyRegularizedDraft(): void {
  newlyRegDraft = null
}

export type NewlyRegularizedReviewRow = {
  employee: LeaveBalanceEmployee
  monthsProrated: number
  vlBefore: number
  vlToAdd: number
  vlAfter: number
  slBefore: number
  slToAdd: number
  slAfter: number
  ptbToAdd: number
}

export function getNewlyRegularizedReviewRows(
  selectedEmployeeIds: string[],
): NewlyRegularizedReviewRow[] {
  const idSet = new Set(selectedEmployeeIds)
  return getNewlyRegularizedCandidates()
    .filter((c) => c.eligible && idSet.has(c.employee.id))
    .map((c) => {
      const vlBefore = c.employee.balances.vl ?? 0
      const slBefore = c.employee.balances.sl ?? 0
      const vlToAdd = c.vlToAdd ?? 0
      const slToAdd = c.slToAdd ?? 0
      return {
        employee: c.employee,
        monthsProrated: c.monthsProrated,
        vlBefore,
        vlToAdd,
        vlAfter: vlBefore + vlToAdd,
        slBefore,
        slToAdd,
        slAfter: slBefore + slToAdd,
        ptbToAdd: c.ptbToAdd ?? 0,
      }
    })
}

export function applyNewlyRegularizedDistribution(
  selectedEmployeeIds: string[],
): void {
  const rows = getNewlyRegularizedReviewRows(selectedEmployeeIds)
  const byId = new Map(rows.map((row) => [row.employee.id, row]))
  for (const employee of EMPLOYEES) {
    const row = byId.get(employee.id)
    if (!row) continue
    employee.balances.vl = row.vlAfter
    employee.balances.sl = row.slAfter
    employee.balances.ptb = (employee.balances.ptb ?? 0) + row.ptbToAdd
  }
  clearNewlyRegularizedDraft()
}

// ---------------------------------------------------------------------------
// Parental helpers (dashboard gating only — no distribution flow)
// ---------------------------------------------------------------------------

export function isParentalLeaveType(leaveType: string): boolean {
  return (
    leaveType === MATERNITY_LEAVE_TYPE || leaveType === PATERNITY_LEAVE_TYPE
  )
}

/**
 * Maternity / Paternity credits are granted only after a corresponding leave
 * request has been filed. Used to gate “available credits” displays.
 */
export function hasFiledParentalLeaveRequest(
  employeeId: string,
  leaveType: string,
): boolean {
  if (!employeeId || !isParentalLeaveType(leaveType)) return false
  const employee = EMPLOYEES.find((row) => row.id === employeeId)
  if (!employee) return false
  return employee.filedParentalRequests.some(
    (filing) => filing.leaveType === leaveType,
  )
}

export const PARENTAL_CREDITS_REQUIRES_REQUEST_MESSAGE =
  'Submit a leave request first before credits can be viewed or applied.'

// ---------------------------------------------------------------------------
// Contractual
// ---------------------------------------------------------------------------

export type ContractualAssignment = {
  leaveTypeKey: LeaveBalanceKey
  amount: number
}

export type ContractualDistributionDraft = {
  selectedEmployeeIds: string[]
  /** employeeId → assignments */
  assignmentsByEmployeeId: Record<string, ContractualAssignment[]>
  groupFilter: string
  effectiveDate: string
}

let contractualDraft: ContractualDistributionDraft | null = null

export function getContractualCandidates(): LeaveBalanceEmployee[] {
  if (!MOCK_DATA_ENABLED) return []
  return EMPLOYEES.filter((e) => e.employmentStatus === 'contractual').map(
    cloneEmployee,
  )
}

export function setContractualDistributionDraft(
  draft: ContractualDistributionDraft,
): void {
  contractualDraft = {
    ...draft,
    selectedEmployeeIds: [...draft.selectedEmployeeIds],
    assignmentsByEmployeeId: Object.fromEntries(
      Object.entries(draft.assignmentsByEmployeeId).map(([id, list]) => [
        id,
        list.map((a) => ({ ...a })),
      ]),
    ),
  }
}

export function getContractualDistributionDraft(): ContractualDistributionDraft | null {
  if (!contractualDraft) return null
  return {
    ...contractualDraft,
    selectedEmployeeIds: [...contractualDraft.selectedEmployeeIds],
    assignmentsByEmployeeId: Object.fromEntries(
      Object.entries(contractualDraft.assignmentsByEmployeeId).map(
        ([id, list]) => [id, list.map((a) => ({ ...a }))],
      ),
    ),
  }
}

export function clearContractualDistributionDraft(): void {
  contractualDraft = null
}

export type ContractualReviewRow = {
  employee: LeaveBalanceEmployee
  vlBefore: number
  vlToAdd: number
  vlAfter: number
  slBefore: number
  slToAdd: number
  slAfter: number
}

export function getContractualReviewRows(
  draft: ContractualDistributionDraft = getContractualDistributionDraft() ?? {
    selectedEmployeeIds: [],
    assignmentsByEmployeeId: {},
    groupFilter: 'ALL',
    effectiveDate: '',
  },
): ContractualReviewRow[] {
  const rows: ContractualReviewRow[] = []
  for (const employeeId of draft.selectedEmployeeIds) {
    const employee = EMPLOYEES.find((e) => e.id === employeeId)
    if (!employee) continue
    const assignments = draft.assignmentsByEmployeeId[employeeId] ?? []
    if (assignments.length === 0) continue

    const vlToAdd =
      assignments.find((a) => a.leaveTypeKey === 'vl')?.amount ?? 0
    const slToAdd =
      assignments.find((a) => a.leaveTypeKey === 'sl')?.amount ?? 0
    const vlBefore = employee.balances.vl ?? 0
    const slBefore = employee.balances.sl ?? 0

    rows.push({
      employee: cloneEmployee(employee),
      vlBefore,
      vlToAdd,
      vlAfter: vlBefore + vlToAdd,
      slBefore,
      slToAdd,
      slAfter: slBefore + slToAdd,
    })
  }
  return rows
}

export function applyContractualDistribution(
  draft: ContractualDistributionDraft = getContractualDistributionDraft() ?? {
    selectedEmployeeIds: [],
    assignmentsByEmployeeId: {},
    groupFilter: 'ALL',
    effectiveDate: '',
  },
  options: { remarks: string; performedBy: string } = {
    remarks: '',
    performedBy: 'Admin',
  },
): void {
  const occurredAt = new Date().toISOString()

  for (const employeeId of draft.selectedEmployeeIds) {
    const employee = EMPLOYEES.find((e) => e.id === employeeId)
    if (!employee) continue
    const assignments = draft.assignmentsByEmployeeId[employeeId] ?? []
    for (const assignment of assignments) {
      if (assignment.amount <= 0) continue
      if (assignment.leaveTypeKey !== 'vl' && assignment.leaveTypeKey !== 'sl') {
        continue
      }
      const before = employee.balances[assignment.leaveTypeKey] ?? 0
      const after = before + assignment.amount
      employee.balances[assignment.leaveTypeKey] = after

      const short = LEAVE_BALANCE_SHORT[assignment.leaveTypeKey]
      const label = LEAVE_BALANCE_LABELS[assignment.leaveTypeKey]

      const balanceImpact = `+${formatBalanceValue(assignment.amount)} ${short} (${formatBalanceValue(before)} → ${formatBalanceValue(after)})`

      appendActivityLogEntry({
        occurredAt,
        employeeId: employee.id,
        activity: 'Contractual leave credits distributed',
        leaveType: label,
        balanceImpact,
        performedBy: options.performedBy,
        remarks: options.remarks || null,
      })

      appendAdminLogEntry({
        eventType: 'CONTRACTUAL_DISTRIBUTION',
        activity: 'Leave Credit Distributed',
        occurredAt,
        actorName: options.performedBy,
        targetEmployeeId: employee.id,
        targetEmployeeName: employee.name,
        employeeNumber: employee.employeeNumber,
        groupLabel: employee.groupLabel,
        leaveType: label,
        balanceImpact,
        remarks: options.remarks || null,
        direction: 'add',
        amount: assignment.amount,
        before,
        after,
        effectiveDate: draft.effectiveDate,
        reasonCategory: 'contractual_grant',
        ticketRef: null,
      })
    }
  }

  clearContractualDistributionDraft()
}

// ---------------------------------------------------------------------------
// Individual adjust + audit
// ---------------------------------------------------------------------------

export type AdjustmentDirection = 'add' | 'deduct'

export type AdjustmentReasonCategory =
  | 'distribution_error'
  | 'emergency_grant'
  | 'system_fix'
  | 'policy_exception'
  | 'other'

export const ADJUSTMENT_REASON_OPTIONS: Array<{
  value: AdjustmentReasonCategory
  label: string
}> = [
  { value: 'distribution_error', label: 'Distribution error' },
  { value: 'emergency_grant', label: 'Emergency grant' },
  { value: 'system_fix', label: 'System fix' },
  { value: 'policy_exception', label: 'Policy exception' },
  { value: 'other', label: 'Other' },
]

export type BalanceAdjustmentPayload = {
  leaveTypeKey: LeaveBalanceKey
  direction: AdjustmentDirection
  amount: number
  effectiveDate: string
  reasonCategory: AdjustmentReasonCategory
  reason: string
  performedBy: string
}

export type RecordedAdjustment = {
  id: string
  employeeId: string
  leaveTypeKey: LeaveBalanceKey
  direction: AdjustmentDirection
  amount: number
  effectiveDate: string
  before: number
  after: number
  occurredAt: string
}

const RECENT_ADJUSTMENTS: RecordedAdjustment[] = []

export function getRecentAdjustments(
  employeeId: string,
): RecordedAdjustment[] {
  return RECENT_ADJUSTMENTS.filter((row) => row.employeeId === employeeId)
}

export function hasDuplicateAdjustment(
  employeeId: string,
  leaveTypeKey: LeaveBalanceKey,
  amount: number,
  effectiveDate: string,
): boolean {
  return RECENT_ADJUSTMENTS.some(
    (row) =>
      row.employeeId === employeeId &&
      row.leaveTypeKey === leaveTypeKey &&
      row.amount === amount &&
      row.effectiveDate === effectiveDate,
  )
}

export function applyBalanceAdjustment(
  employeeId: string,
  payload: BalanceAdjustmentPayload,
): RecordedAdjustment | null {
  if (!MOCK_DATA_ENABLED) return null
  const employee = EMPLOYEES.find((row) => row.id === employeeId)
  if (!employee) return null

  const before = employee.balances[payload.leaveTypeKey] ?? 0
  const delta =
    payload.direction === 'add' ? payload.amount : -payload.amount
  const after = before + delta
  if (after < 0) return null

  employee.balances[payload.leaveTypeKey] = after

  const occurredAt = new Date().toISOString()
  const recorded: RecordedAdjustment = {
    id: `adj-${Date.now()}-${RECENT_ADJUSTMENTS.length + 1}`,
    employeeId,
    leaveTypeKey: payload.leaveTypeKey,
    direction: payload.direction,
    amount: payload.amount,
    effectiveDate: payload.effectiveDate,
    before,
    after,
    occurredAt,
  }
  RECENT_ADJUSTMENTS.unshift(recorded)

  const short = LEAVE_BALANCE_SHORT[payload.leaveTypeKey]
  const label = LEAVE_BALANCE_LABELS[payload.leaveTypeKey]
  const signed =
    payload.direction === 'add'
      ? `+${formatBalanceValue(payload.amount)}`
      : `-${formatBalanceValue(payload.amount)}`
  const reasonCategoryLabel =
    ADJUSTMENT_REASON_OPTIONS.find((o) => o.value === payload.reasonCategory)
      ?.label ?? payload.reasonCategory

  const balanceImpact = `${signed} ${short} (${formatBalanceValue(before)} → ${formatBalanceValue(after)})`
  const activity =
    payload.direction === 'add'
      ? 'Leave credits added'
      : 'Leave credits deducted'

  appendActivityLogEntry({
    occurredAt,
    employeeId: employee.id,
    activity,
    leaveType: label,
    balanceImpact,
    performedBy: payload.performedBy,
    remarks: payload.reason,
  })

  appendAdminLogEntry({
    eventType: 'BALANCE_ADJUSTMENT',
    activity,
    occurredAt,
    actorName: payload.performedBy,
    targetEmployeeId: employee.id,
    targetEmployeeName: employee.name,
    employeeNumber: employee.employeeNumber,
    groupLabel: employee.groupLabel,
    leaveType: label,
    balanceImpact,
    remarks: payload.reason,
    direction: payload.direction,
    amount: payload.amount,
    before,
    after,
    effectiveDate: payload.effectiveDate,
    reasonCategory: reasonCategoryLabel,
    ticketRef: null,
  })

  return recorded
}
