/**
 * Shared leave-balance types/labels plus employee seed for mock-backed reports.
 *
 * Admin Leave Balances, adjustments, and entitlement distributions use the API
 * (`useAdminBalances`, `utils/*Draft`). Keep this seed only while LWOP /
 * monetization / monthly-attendance smoke mocks still depend on
 * `getAdminLeaveBalanceRows()`. Remove once those APIs are wired.
 */
import { MOCK_DATA_ENABLED } from './config'

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
  /** Seed detail retained for mock report scenarios; not read by live pages. */
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

/** Seed employees for mock-backed admin reports (LWOP, monetization, attendance smoke). */
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

export function getLeaveBalanceGroups(): string[] {
  return Array.from(new Set(EMPLOYEES.map((e) => e.groupLabel))).sort((a, b) =>
    a.localeCompare(b),
  )
}

// ---------------------------------------------------------------------------
// Adjust-credits UI constants (modal submits via API)
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
