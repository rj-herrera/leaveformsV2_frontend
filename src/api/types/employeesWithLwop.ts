import type { AdminEmployeeRef, LeaveOrgRef } from './leave'

export type EmployeesWithLwopRow = {
  employee: AdminEmployeeRef
  vl_balance: string
  vl_consumed: string
  sl_balance: string
  sl_consumed: string
  total_lwop_days: string
}

export type EmployeesWithLwopGrandTotals = {
  vl_balance: string
  vl_consumed: string
  sl_balance: string
  sl_consumed: string
  total_lwop_days: string
}

/** Single JsonResource from GET /admin/reports/employees-with-lwop. */
export type EmployeesWithLwopReport = {
  year: number
  as_of: string
  generated_at: string
  period: {
    start_date: string
    end_date: string
  }
  group: LeaveOrgRef | null
  employee_count: number
  rows: EmployeesWithLwopRow[]
  grand_totals: EmployeesWithLwopGrandTotals
}
