import type { AdminEmployeeRef } from './leave'

export type MonetizationEligibilityBasis = 'VL' | 'SL' | 'VL and SL'

export type LeaveMonetizationCandidateRow = {
  employee: AdminEmployeeRef
  vl_balance: string | null
  vl_retained: string | null
  vl_excess: string | null
  sl_balance: string | null
  sl_retained: string | null
  sl_excess: string | null
  total_eligible_days: string
  eligibility_basis: MonetizationEligibilityBasis
}

export type LeaveMonetizationGrandTotals = {
  vl_balance: string
  vl_excess_days: string
  sl_balance: string
  sl_excess_days: string
  total_eligible_days: string
}

/** Single JsonResource from GET /admin/reports/leave-monetization-candidates. */
export type LeaveMonetizationCandidatesReport = {
  conversion_year: number
  balance_cut_off: string
  as_of: string
  generated_at: string
  eligible_employees: number
  rows: LeaveMonetizationCandidateRow[]
  grand_totals: LeaveMonetizationGrandTotals
}
