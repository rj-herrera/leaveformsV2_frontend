import type { LeaveEmployee } from './leave'

/** One row from GET/POST /admin/annual-entitlements. */
export type AdminAnnualEntitlementRow = {
  employee: LeaveEmployee
  date_hired: string | null
  years_of_service: number
  vl_available: string
  sl_available: string
  vl_grant: string
  sl_grant: string
  vl_after: string
  sl_after: string
  already_granted: boolean
}

/** Extra keys on GET list `meta` (merged with Laravel pagination). */
export type AdminAnnualEntitlementMeta = {
  year?: number
  as_of?: string
  eligible_count?: number
  granted_count?: number
  pending_count?: number
  current_page?: number
  last_page?: number
  per_page?: number
  total?: number
  from?: number | null
  to?: number | null
}
