import type {
  ApproverType,
  ConversionStatus,
  DayType,
  LeaveStatus,
  RequiredApproverType,
} from './enums'

/** Nested leave_type object on leave / conversion resources. */
export type LeaveTypeRef = {
  id: number
  code: string
  name: string
}

export type LeaveApprovalHistory = {
  approver_emp_id: number
  /** Present on detail responses when the employee can be resolved. */
  approver_name?: string | null
  approver_type: ApproverType
  is_approved: boolean
  remarks: string | null
  created_at: string | null
}

export type LeaveApprovalRequirement = {
  display_order: number
  allowed_levels: number[]
  required_approver_type: RequiredApproverType | null
  is_satisfied: boolean
  satisfied_at: string | null
  history: LeaveApprovalHistory | null
}

/**
 * Slim list row from GET /leaves.
 * Decimal fields are JSON strings (e.g. `"4.00"`).
 */
export type LeaveSummary = {
  id: number
  status: LeaveStatus
  leave_type: LeaveTypeRef
  duration: string
  day_type: DayType
  start_date: string
  end_date: string
  created_at: string | null
}

/** Nested conversion on GET /leaves/{id} (null when none). */
export type LeaveDetailConversion = {
  id: number
  status: ConversionStatus
  from_leave_type: LeaveTypeRef
  to_leave_type: LeaveTypeRef
  has_med_cert: boolean
  med_cert_url: string | null
  remarks: string | null
  created_at: string | null
}

/**
 * Full leave detail from GET /leaves/{id} (also returned by store/update/cancel/approve/reject).
 */
export type LeaveDetail = {
  id: number
  emp_id: number
  filed_by_emp_id: number
  status: LeaveStatus
  leave_type: LeaveTypeRef
  duration: string
  paid_days: string
  lwop_days: string
  day_type: DayType
  start_date: string
  end_date: string
  leave_reason: string
  has_attachment: boolean
  attachment_url: string | null
  cancellation_reason: string | null
  approval_requirements: LeaveApprovalRequirement[]
  conversion: LeaveDetailConversion | null
  confirmed_at: string | null
  created_at: string | null
}

/** @deprecated Prefer LeaveDetail — kept as an alias for mutation responses. */
export type LeaveResource = LeaveDetail

/** POST /leaves — file VL (omit emp_id for self). */
export type StoreLeavePayload = {
  emp_id?: number
  start_date: string
  end_date: string
  day_type: DayType
  leave_reason: string
}

/** PUT|POST /leaves/{id} — edit pending VL. */
export type UpdateLeavePayload = {
  start_date: string
  end_date: string
  day_type: DayType
  leave_reason: string
}

/** POST /leaves/{id}/cancel */
export type CancelLeavePayload = {
  cancellation_reason: string
}

/** POST /leaves/{id}/reject */
export type RejectLeavePayload = {
  remarks: string
}
