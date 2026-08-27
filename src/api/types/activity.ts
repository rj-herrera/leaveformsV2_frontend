import type { ActivityType } from './enums'
import type { LeaveOrgRef, LeaveTypeRef } from './leave'

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

/** Employee nest on GET /admin/activities (nullable for batch credit rows). */
export type AdminActivityEmployee = {
  id: number | null
  employee_number: string | null
  name: string
  group: LeaveOrgRef | null
}

/** One row from GET /admin/activities. */
export type AdminLeaveActivityResource = {
  id: number
  leave_id: number | null
  timestamp: string
  activity_type: ActivityType
  activity: string
  leave_type: LeaveTypeRef | null
  employee: AdminActivityEmployee | null
  performed_by: {
    id: number
    name: string | null
  }
  remarks: string | null
}
