import type { ConversionStatus, LeaveStatus } from './enums'
import type { LeaveEmployee, LeaveTypeRef } from './leave'

/** Nested leave summary on a conversion resource. */
export type ConversionLeaveSummary = {
  id: number
  emp_id: number
  status: LeaveStatus
  duration: string
  paid_days: string
  start_date: string
  end_date: string
  leave_reason: string
  leave_type: LeaveTypeRef | null
  /** Person on leave — same nest as GET /leaves/{id} and GET /approvals. */
  employee: LeaveEmployee | null
}

/**
 * Leave conversion JsonResource (`LeaveConversionResource`).
 * Relation fields may be omitted when not loaded.
 */
export type LeaveConversionResource = {
  id: number
  leave_id: number
  status: ConversionStatus
  from_leave_type?: LeaveTypeRef
  to_leave_type?: LeaveTypeRef
  has_med_cert: boolean
  med_cert_url: string | null
  /** Employee’s conversion reason (why VL → SL). Distinct from admin reject `remarks`. */
  reason: string | null
  reviewed_by_emp_id: number | null
  reviewed_by: {
    id: number
    emp_id: string
    name: string
  } | null
  remarks: string | null
  reviewed_at: string | null
  leave?: ConversionLeaveSummary
  created_at: string | null
}

/** POST /conversions/{id}/reject */
export type RejectConversionPayload = {
  remarks: string
}
