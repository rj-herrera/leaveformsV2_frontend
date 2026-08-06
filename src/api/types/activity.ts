import type { ActivityType } from './enums'
import type { LeaveTypeRef } from './leave'

/** Ledger row nested on GET /activities items. */
export type ActivityLedgerEntry = {
  id: number
  reason: string
  leave_type_code: string | null
  available_delta: string
  reserved_delta: string
}

/** One row from GET /activities. */
export type LeaveActivityResource = {
  id: number
  leave_id: number
  timestamp: string
  activity_type: ActivityType
  activity: string
  leave_type: LeaveTypeRef | null
  balance_impact: string
  ledger: ActivityLedgerEntry[]
  performed_by: {
    id: number
    name: string | null
  }
  remarks: string | null
}
