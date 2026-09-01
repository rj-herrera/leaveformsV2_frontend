import type { LeaveEmployee } from './leave'

/** One row from GET/POST /admin/newly-regularized. */
export type AdminNewlyRegularizedRow = {
  employee: LeaveEmployee
  date_hired: string | null
  regularization_date: string | null
  months_of_service: string
  months_prorated: number
  vl_available: string
  sl_available: string
  ptb_available: string
  vl_grant: string
  sl_grant: string
  ptb_grant: string
  vl_after: string
  sl_after: string
  ptb_after: string
  already_granted: boolean
}

/** Extra keys on GET list `meta` (merged with Laravel pagination). */
export type AdminNewlyRegularizedMeta = {
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
