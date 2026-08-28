import type { LeaveDetail } from '../api/types'
import {
  EMERGENCY_LEAVE_THEME,
  MATERNITY_LEAVE_THEME,
  PATERNITY_LEAVE_THEME,
  PTB_LEAVE_THEME,
  SICK_LEAVE_THEME,
  VACATION_LEAVE_THEME,
} from '../constants/leaveTypeTheme'
import type { UserGender } from './gender'

/** Leave types `POST /leaves` accepts today (LL not wired). Other codes → 422. */
export type FilableLeaveCode = 'VL' | 'SL' | 'PTB' | 'EL' | 'ML' | 'PL'

export const FILABLE_LEAVE_TYPE_OPTIONS: {
  value: FilableLeaveCode
  label: string
}[] = [
  { value: 'VL', label: VACATION_LEAVE_THEME.label },
  { value: 'SL', label: SICK_LEAVE_THEME.label },
  { value: 'PTB', label: PTB_LEAVE_THEME.label },
  { value: 'EL', label: EMERGENCY_LEAVE_THEME.label },
  { value: 'ML', label: MATERNITY_LEAVE_THEME.label },
  { value: 'PL', label: PATERNITY_LEAVE_THEME.label },
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

/** API max files per leave / conversion (`leave.attachments.max_files`). */
export const ATTACHMENT_MAX_FILES = 5

export function attachmentFieldHint(): string {
  return `PDF, JPG, or PNG. Up to ${ATTACHMENT_MAX_FILES} files.`
}

export function isFilableLeaveCode(code: string): code is FilableLeaveCode {
  const normalized = code.toUpperCase()
  return (
    normalized === 'VL' ||
    normalized === 'SL' ||
    normalized === 'PTB' ||
    normalized === 'EL' ||
    normalized === 'ML' ||
    normalized === 'PL'
  )
}

export function filableLeaveLabel(code: string): string {
  const normalized = code.toUpperCase()
  return (
    FILABLE_LEAVE_TYPE_OPTIONS.find((option) => option.value === normalized)
      ?.label ?? code
  )
}

/** Hide ML unless female, PL unless male. Unknown gender → neither. */
export function filableLeaveTypeOptionsForGender(gender: UserGender | null) {
  return FILABLE_LEAVE_TYPE_OPTIONS.filter((option) => {
    if (option.value === 'ML') return gender === 'female'
    if (option.value === 'PL') return gender === 'male'
    return true
  })
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

/** Admin-only types (PIC reminders do not apply). */
export function isAdminApproved(code: string): boolean {
  const normalized = code.toUpperCase()
  return (
    normalized === 'SL' ||
    normalized === 'PTB' ||
    normalized === 'EL' ||
    normalized === 'ML' ||
    normalized === 'PL'
  )
}

/** PTB, EL, ML, and PL are full day only — half_am / half_pm → 422. */
export function requiresFullDay(code: string): boolean {
  const normalized = code.toUpperCase()
  return (
    normalized === 'PTB' ||
    normalized === 'EL' ||
    normalized === 'ML' ||
    normalized === 'PL'
  )
}

/** ML is exactly 105 calendar days; PL is exactly 7 workdays. End date is derived. */
export function isFixedRangeLeave(code: string): boolean {
  const normalized = code.toUpperCase()
  return normalized === 'ML' || normalized === 'PL'
}

/** ML/PL credits are granted on submit — do not treat remaining 0 as a block. */
export function grantsCreditsOnSubmit(code: string): boolean {
  return isFixedRangeLeave(code)
}

/** Only VL and SL may go LWOP. */
export function allowsLwop(code: string): boolean {
  const normalized = code.toUpperCase()
  return normalized === 'VL' || normalized === 'SL'
}

/** PTB and EL cannot exceed remaining credits. */
export function enforcesRemainingCredits(code: string): boolean {
  const normalized = code.toUpperCase()
  return normalized === 'PTB' || normalized === 'EL'
}

/** 1-month advance filing for 3+ days applies to VL only. */
export function appliesVlLeadTime(code: string): boolean {
  return code.toUpperCase() === 'VL'
}

/** Pending filable leave with no approval history yet. */
export function isPendingLeaveEditable(detail: LeaveDetail): boolean {
  if (detail.status !== 'pending_approval') return false
  if (!isFilableLeaveCode(detail.leave_type.code)) return false
  return !detail.approval_requirements.some((req) => req.history != null)
}
