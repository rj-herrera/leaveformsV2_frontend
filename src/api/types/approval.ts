import type { LeaveStatus } from './enums'
import type { LeaveEmployee, LeaveTypeRef } from './leave'

/** Nested employee on approval inbox rows (same nest as leave detail). */
export type ApprovalInboxEmployee = LeaveEmployee

/**
 * Slim inbox row shared by GET /approvals and GET /approvals/pending
 * (`PendingApprovalResource`).
 */
export type ApprovalInboxRow = {
  id: number
  status: LeaveStatus
  leave_type: LeaveTypeRef
  duration: string
  start_date: string
  end_date: string
  created_at: string | null
  employee: ApprovalInboxEmployee | null
  approvals_completed: number
  approvals_required: number
}
