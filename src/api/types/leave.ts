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

/** Group or department nest on `employee`. */
export type LeaveOrgRef = {
  id: number
  abbreviation: string | null
  name: string | null
  /** Present on `GET /admin/groups` for department → group cascade. */
  dept_id?: number | null
}

/**
 * Person-on-leave nest from `EmployeeNest` (leave detail + approval rows).
 */
export type LeaveEmployee = {
  id: number
  employee_number: string
  name: string | null
  group: LeaveOrgRef | null
  department: LeaveOrgRef | null
}

/** Slim filer nest from `EmployeeNest::summary` on GET /leaves/{id}. */
export type LeaveFiledBy = {
  id: number
  employee_number: string
  name: string | null
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
  /** Employee’s conversion reason (why VL → SL). Distinct from admin reject `remarks`. */
  reason: string | null
  reviewed_by_emp_id: number | null
  remarks: string | null
  reviewed_at: string | null
  created_at: string | null
}

/** Who may act on the current stage — always listed on detail. */
export type EligibleApprover = {
  emp_id: number
  name: string
  approver_type: ApproverType
  purpose: string
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
  employee: LeaveEmployee | null
  /** Who submitted the leave (`filed_by_emp_id`); same as employee when self-filed. */
  filed_by: LeaveFiledBy | null
  approval_requirements: LeaveApprovalRequirement[]
  eligible_approvers: EligibleApprover[]
  conversion: LeaveDetailConversion | null
  confirmed_at: string | null
  created_at: string | null
}

/** @deprecated Prefer LeaveDetail — kept as an alias for mutation responses. */
export type LeaveResource = LeaveDetail

/** POST /leaves — file VL (JSON) or SL/PTB/EL (multipart + `leave_attachment`). Omit emp_id for self. */
export type StoreLeavePayload = {
  emp_id?: number
  /** `VL` (default), `SL`, `PTB`, or `EL`. Other types → 422. */
  code?: 'VL' | 'SL' | 'PTB' | 'EL'
  start_date: string
  end_date: string
  day_type: DayType
  leave_reason: string
  /** Required for SL/PTB (med cert) and EL (supporting document). Prohibited on VL. */
  leave_attachment?: File
}

/** PUT|POST /leaves/{id} — edit pending VL, SL, PTB, or EL (POST + file to replace attachment). */
export type UpdateLeavePayload = {
  start_date: string
  end_date: string
  day_type: DayType
  leave_reason: string
  /** Optional SL/PTB/EL attachment replacement. Omit to keep the existing file. */
  leave_attachment?: File
}

/** POST /leaves/{id}/cancel */
export type CancelLeavePayload = {
  cancellation_reason: string
}

/** POST /leaves/{id}/reject */
export type RejectLeavePayload = {
  remarks: string
}
