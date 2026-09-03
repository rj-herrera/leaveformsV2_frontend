/** API string enums — aligned with leaveforms-api Leave enums / FRONTEND_API.md */

export type DayType = 'full' | 'half_am' | 'half_pm'

export type LeaveStatus =
  | 'pending_approval'
  | 'confirmed'
  | 'pending_conversion'
  | 'rejected'
  | 'cancelled'
  | 'converted_to_sl'
  | 'converted_to_el'

export type ConversionStatus = 'pending_review' | 'approved' | 'rejected'

export type ApproverType =
  | 'leader'
  | 'am'
  | 'dm'
  | 'sm'
  | 'admin'
  | 'president'

export type RequiredApproverType = 'president' | 'admin'

export type ActivityType =
  | 'submitted'
  | 'modified'
  | 'cancelled'
  | 'rejected'
  | 'attachment_added'
  | 'leave_confirmed'
  | 'conversion_requested'
  | 'conversion_approved'
  | 'conversion_rejected'
  | 'annual_credits_distributed'
  | 'regularization_credits_distributed'
  | 'contractual_credits_distributed'
  | 'credits_adjusted'
