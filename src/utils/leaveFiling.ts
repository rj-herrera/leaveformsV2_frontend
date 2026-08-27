import type { LeaveDetail } from '../api/types'
import {
  SICK_LEAVE_THEME,
  VACATION_LEAVE_THEME,
} from '../constants/leaveTypeTheme'

/** Leave types `POST /leaves` accepts today. Other codes → 422. */
export type FilableLeaveCode = 'VL' | 'SL'

export const FILABLE_LEAVE_TYPE_OPTIONS: {
  value: FilableLeaveCode
  label: string
}[] = [
  { value: 'VL', label: VACATION_LEAVE_THEME.label },
  { value: 'SL', label: SICK_LEAVE_THEME.label },
]

/** API: pdf / jpg / jpeg / png. */
export const MED_CERT_ACCEPT =
  '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png'

export function isFilableLeaveCode(code: string): code is FilableLeaveCode {
  const normalized = code.toUpperCase()
  return normalized === 'VL' || normalized === 'SL'
}

export function requiresMedCert(code: string): boolean {
  return code.toUpperCase() === 'SL'
}

/** 1-month advance filing for 3+ days applies to VL only. */
export function appliesVlLeadTime(code: string): boolean {
  return code.toUpperCase() === 'VL'
}

/** Pending VL or SL with no approval history yet. */
export function isPendingLeaveEditable(detail: LeaveDetail): boolean {
  if (detail.status !== 'pending_approval') return false
  if (!isFilableLeaveCode(detail.leave_type.code)) return false
  return !detail.approval_requirements.some((req) => req.history != null)
}
