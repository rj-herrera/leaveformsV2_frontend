import type { LeaveEmployee } from './leave'

/** One row from GET /admin/contractual-entitlements (and POST success with extras). */
export type AdminContractualEntitlementRow = {
  employee: LeaveEmployee
  vl_available: string
  sl_available: string
  /** Present on POST success response. */
  vl_before?: string
  sl_before?: string
  vl_grant?: string
  sl_grant?: string
  vl_after?: string
  sl_after?: string
}

/** Extra keys on GET list `meta` (merged with Laravel pagination). */
export type AdminContractualEntitlementMeta = {
  as_of?: string
  eligible_count?: number
  current_page?: number
  last_page?: number
  per_page?: number
  total?: number
  from?: number | null
  to?: number | null
}
