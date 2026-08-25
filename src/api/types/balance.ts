import type { LeaveEmployee } from './leave'

/**
 * Leave balance JsonResource (`LeaveBalanceResource`).
 * `available` / `reserved` are decimal strings (e.g. `"12.00"`).
 */
export type LeaveBalanceResource = {
  leave_type_id: number
  code: string
  name: string
  available: string
  reserved: string
}

/** One leave-type cell on `GET /admin/balances`. */
export type AdminBalanceTypeRow = LeaveBalanceResource & {
  applicable: boolean
}

export type EmploymentStatusApi =
  | 'regular'
  | 'probationary'
  | 'contractual'

/** One employee row on `GET /admin/balances`. */
export type AdminEmployeeBalanceRow = {
  employee: LeaveEmployee
  employment_status: EmploymentStatusApi
  balances: AdminBalanceTypeRow[]
}
