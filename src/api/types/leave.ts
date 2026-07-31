import type {
  ApproverType,
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
 * Leave JsonResource (`LeaveResource`).
 * Decimal fields are JSON strings (e.g. `"4.00"`).
 */
export type LeaveResource = {
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
  /** Present when the API loads the relation (list/detail typically). */
  approval_requirements?: LeaveApprovalRequirement[]
  confirmed_at: string | null
  created_at: string | null
}

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
