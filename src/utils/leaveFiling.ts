import type { LeaveDetail } from '../api/types'
import {
  EMERGENCY_LEAVE_THEME,
  PTB_LEAVE_THEME,
  SICK_LEAVE_THEME,
  VACATION_LEAVE_THEME,
} from '../constants/leaveTypeTheme'

/** Leave types `POST /leaves` accepts today. Other codes → 422. */
export type FilableLeaveCode = 'VL' | 'SL' | 'PTB' | 'EL'

export const FILABLE_LEAVE_TYPE_OPTIONS: {
  value: FilableLeaveCode
  label: string
}[] = [
  { value: 'VL', label: VACATION_LEAVE_THEME.label },
  { value: 'SL', label: SICK_LEAVE_THEME.label },
  { value: 'PTB', label: PTB_LEAVE_THEME.label },
  { value: 'EL', label: EMERGENCY_LEAVE_THEME.label },
]

export type LeaveTypeFilter = 'ALL' | FilableLeaveCode

export const LEAVE_TYPE_FILTER_OPTIONS: {
  value: LeaveTypeFilter
  label: string
}[] = [
  { value: 'ALL', label: 'All Leave Types' },
  ...FILABLE_LEAVE_TYPE_OPTIONS,
]

/** API: pdf / jpg / jpeg / png. Same for med cert and EL supporting docs. */
export const MED_CERT_ACCEPT =
  '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png'

export function isFilableLeaveCode(code: string): code is FilableLeaveCode {
  const normalized = code.toUpperCase()
  return (
    normalized === 'VL' ||
    normalized === 'SL' ||
    normalized === 'PTB' ||
    normalized === 'EL'
  )
}

export function filableLeaveLabel(code: string): string {
  const normalized = code.toUpperCase()
  return (
    FILABLE_LEAVE_TYPE_OPTIONS.find((option) => option.value === normalized)
      ?.label ?? code
  )
}

/** SL, PTB, and EL require `leave_attachment` on submit. */
export function requiresAttachment(code: string): boolean {
  const normalized = code.toUpperCase()
  return normalized === 'SL' || normalized === 'PTB' || normalized === 'EL'
}

/** SL and PTB attachments are medical certificates; EL is a supporting document. */
export function requiresMedCert(code: string): boolean {
  const normalized = code.toUpperCase()
  return normalized === 'SL' || normalized === 'PTB'
}

export function attachmentFieldLabel(code: string): string {
  return requiresMedCert(code) ? 'Medical certificate' : 'Supporting document'
}

/** SL, PTB, and EL are approved by admin only (PIC reminders do not apply). */
export function isAdminApproved(code: string): boolean {
  return requiresAttachment(code)
}

/** PTB and EL are full day only — half_am / half_pm → 422. */
export function requiresFullDay(code: string): boolean {
  const normalized = code.toUpperCase()
  return normalized === 'PTB' || normalized === 'EL'
}

/** Only VL and SL may go LWOP; PTB and EL over remaining credits → 422. */
export function allowsLwop(code: string): boolean {
  const normalized = code.toUpperCase()
  return normalized === 'VL' || normalized === 'SL'
}

/** 1-month advance filing for 3+ days applies to VL only. */
export function appliesVlLeadTime(code: string): boolean {
  return code.toUpperCase() === 'VL'
}

/** Pending VL, SL, PTB, or EL with no approval history yet. */
export function isPendingLeaveEditable(detail: LeaveDetail): boolean {
  if (detail.status !== 'pending_approval') return false
  if (!isFilableLeaveCode(detail.leave_type.code)) return false
  return !detail.approval_requirements.some((req) => req.history != null)
}
