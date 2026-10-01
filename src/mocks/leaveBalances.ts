/**
 * Leave-balance labels and adjust-credits options used by live admin pages.
 */

export type EmploymentStatus = 'regular' | 'probationary' | 'contractual'

export type LeaveBalanceKey = 'vl' | 'sl' | 'el' | 'ml' | 'pl' | 'ptb'

export const EMPLOYMENT_STATUS_LABELS: Record<EmploymentStatus, string> = {
  regular: 'Regular',
  probationary: 'Probationary',
  contractual: 'Contractual',
}

export const LEAVE_BALANCE_LABELS: Record<LeaveBalanceKey, string> = {
  vl: 'Vacation Leave',
  sl: 'Sick Leave',
  el: 'Emergency Leave',
  ml: 'Maternity Leave',
  pl: 'Paternity Leave',
  ptb: 'PTB Leave',
}

export const LEAVE_BALANCE_SHORT: Record<LeaveBalanceKey, string> = {
  vl: 'VL',
  sl: 'SL',
  el: 'EL',
  ml: 'ML',
  pl: 'PL',
  ptb: 'PTB',
}

export const LEAVE_BALANCE_CHIP_CLASS: Record<LeaveBalanceKey, string> = {
  vl: 'bg-leave-vacation/30 text-text-black',
  sl: 'bg-leave-sick/30 text-text-black',
  el: 'bg-leave-emergency/35 text-text-black',
  ml: 'bg-leave-maternity/30 text-text-black',
  pl: 'bg-leave-paternity/30 text-text-black',
  ptb: 'bg-leave-ptb/30 text-text-black',
}

export type AdjustmentDirection = 'add' | 'deduct'

export type AdjustmentReasonCategory =
  | 'distribution_error'
  | 'emergency_grant'
  | 'system_fix'
  | 'policy_exception'
  | 'other'

export const ADJUSTMENT_REASON_OPTIONS: Array<{
  value: AdjustmentReasonCategory
  label: string
}> = [
  { value: 'distribution_error', label: 'Distribution error' },
  { value: 'emergency_grant', label: 'Emergency grant' },
  { value: 'system_fix', label: 'System fix' },
  { value: 'policy_exception', label: 'Policy exception' },
  { value: 'other', label: 'Other' },
]
