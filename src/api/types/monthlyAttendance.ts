import type { AdminEmployeeRef, LeaveOrgRef } from './leave'

export type MonthlyAttendanceCutOff =
  | 'monthly'
  | 'first_half'
  | 'second_half'

export type MonthlyAttendanceCategory = 'vl' | 'sl' | 'others' | 'lwop'

export type MonthlyAttendanceHalf = 'am' | 'pm'

export type MonthlyAttendanceTotals = {
  vl: string
  sl: string
  others: string
  lwop: string
}

export type MonthlyAttendanceDateColumn = {
  date: string
  day_of_month: number
  weekday_short: string
  is_non_working: boolean
}

/** Sparse leave cell from GET /admin/reports/monthly-attendance. */
export type MonthlyAttendanceCell = {
  date: string
  category: MonthlyAttendanceCategory
  amount: string
  half: MonthlyAttendanceHalf | null
  is_non_working: boolean
}

export type MonthlyAttendanceEmployeeRow = {
  employee: AdminEmployeeRef
  cells: MonthlyAttendanceCell[]
  totals: MonthlyAttendanceTotals
}

/** Single JsonResource from GET /admin/reports/monthly-attendance. */
export type MonthlyAttendanceReport = {
  month: string
  month_label: string
  cut_off: MonthlyAttendanceCutOff
  cut_off_label: string
  group: LeaveOrgRef | null
  employee_count: number
  generated_at: string
  period: {
    start_date: string
    end_date: string
  }
  dates: MonthlyAttendanceDateColumn[]
  rows: MonthlyAttendanceEmployeeRow[]
  grand_totals: MonthlyAttendanceTotals
}
