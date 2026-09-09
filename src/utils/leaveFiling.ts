import type { LeaveDetail } from '../api/types'
import {
  EMERGENCY_LEAVE_THEME,
  LONG_LEAVE_THEME,
  MATERNITY_LEAVE_THEME,
  PATERNITY_LEAVE_THEME,
  PTB_LEAVE_THEME,
  SICK_LEAVE_THEME,
  SPECIAL_LEAVE_THEME,
  VACATION_LEAVE_THEME,
} from '../constants/leaveTypeTheme'
import type { UserGender } from './gender'

/** Leave types `POST /leaves` accepts today. Other codes → 422. */
export type FilableLeaveCode =
  | 'VL'
  | 'SL'
  | 'PTB'
  | 'EL'
  | 'LL'
  | 'ML'
  | 'PL'
  | 'SPL'

export const FILABLE_LEAVE_TYPE_OPTIONS: {
  value: FilableLeaveCode
  label: string
}[] = [
  { value: 'VL', label: VACATION_LEAVE_THEME.label },
  { value: 'SL', label: SICK_LEAVE_THEME.label },
  { value: 'PTB', label: PTB_LEAVE_THEME.label },
  { value: 'EL', label: EMERGENCY_LEAVE_THEME.label },
  { value: 'LL', label: LONG_LEAVE_THEME.label },
  { value: 'ML', label: MATERNITY_LEAVE_THEME.label },
  { value: 'PL', label: PATERNITY_LEAVE_THEME.label },
  { value: 'SPL', label: SPECIAL_LEAVE_THEME.label },
]

export type LeaveTypeFilter = 'ALL' | FilableLeaveCode

export const LEAVE_TYPE_FILTER_OPTIONS: {
  value: LeaveTypeFilter
  label: string
}[] = [
  { value: 'ALL', label: 'All Leave Types' },
  ...FILABLE_LEAVE_TYPE_OPTIONS,
]

/** API: pdf / jpg / jpeg / png. Same for med cert, EL/LL supporting docs, and PL form. */
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
    normalized === 'LL' ||
    normalized === 'ML' ||
    normalized === 'PL' ||
    normalized === 'SPL'
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
export function filableLeaveTypeOptionsForGender(
  gender: UserGender | null,
) {
  return FILABLE_LEAVE_TYPE_OPTIONS.filter((option) => {
    if (option.value === 'ML') return gender === 'female'
    if (option.value === 'PL') return gender === 'male'
    return true
  })
}

/** SL, PTB, EL, LL, and PL require `leave_attachment` on submit. */
export function requiresAttachment(code: string): boolean {
  const normalized = code.toUpperCase()
  return (
    normalized === 'SL' ||
    normalized === 'PTB' ||
    normalized === 'EL' ||
    normalized === 'LL' ||
    normalized === 'PL'
  )
}

/** SL and PTB attachments are medical certificates; EL and LL are supporting documents. */
export function requiresMedCert(code: string): boolean {
  const normalized = code.toUpperCase()
  return normalized === 'SL' || normalized === 'PTB'
}

export function attachmentFieldLabel(code: string): string {
  if (requiresMedCert(code)) return 'Supporting document'
  if (isPaternityLeave(code)) return 'Paternity Notification Form'
  return 'Supporting document'
}

export function isPaternityLeave(code: string): boolean {
  return code.toUpperCase() === 'PL'
}

export function isSpecialLeave(code: string): boolean {
  return code.toUpperCase() === 'SPL'
}

/** Filename of the blank Paternity Notification Form under `public/form/`. */
export const PATERNITY_NOTIFICATION_FORM_FILENAME =
  'Paternity-Notification-Form.doc'

/**
 * Public URL for the blank form. Uses Vite `BASE_URL` so the path works when
 * the app is deployed at a subpath (not only at `/` in local dev).
 */
export function paternityNotificationFormHref(): string {
  return `${import.meta.env.BASE_URL}form/${PATERNITY_NOTIFICATION_FORM_FILENAME}`
}

/** Admin-only types (PIC reminders do not apply). */
export function isAdminApproved(code: string): boolean {
  const normalized = code.toUpperCase()
  return (
    normalized === 'SL' ||
    normalized === 'PTB' ||
    normalized === 'EL' ||
    normalized === 'LL' ||
    normalized === 'ML' ||
    normalized === 'PL' ||
    normalized === 'SPL'
  )
}

/** PTB, EL, LL, ML, PL, and SPL are full day only — half_am / half_pm → 422. */
export function requiresFullDay(code: string): boolean {
  const normalized = code.toUpperCase()
  return (
    normalized === 'PTB' ||
    normalized === 'EL' ||
    normalized === 'LL' ||
    normalized === 'ML' ||
    normalized === 'PL' ||
    normalized === 'SPL'
  )
}

export function isLongLeave(code: string): boolean {
  return code.toUpperCase() === 'LL'
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

/**
 * Which credit/LWOP notice to show while filing (priority order).
 * Informational for VL/SL LWOP paths; PTB/EL overages are blocking banners.
 */
export type LeaveCreditsFilingNotice =
  | 'noCredits'
  | 'exceedsCredits'
  | 'fullLwop'
  | 'mayBeLwop'

export function getLeaveCreditsFilingNotice(options: {
  leaveType: string
  remainingDays: number
  durationDays: number
}): LeaveCreditsFilingNotice | null {
  const { leaveType, remainingDays, durationDays } = options
  if (!leaveType || !Number.isFinite(remainingDays)) return null

  if (enforcesRemainingCredits(leaveType) && remainingDays <= 0) {
    return 'noCredits'
  }
  if (
    enforcesRemainingCredits(leaveType) &&
    durationDays > 0 &&
    durationDays > remainingDays
  ) {
    return 'exceedsCredits'
  }
  if (allowsLwop(leaveType) && remainingDays <= 0) {
    return 'fullLwop'
  }
  if (
    allowsLwop(leaveType) &&
    remainingDays > 0 &&
    durationDays > 0 &&
    durationDays > remainingDays
  ) {
    return 'mayBeLwop'
  }
  return null
}

/**
 * Self-filed VL advance notice: exactly 3 workdays → 3 working days;
 * more than 3 workdays → 30 calendar days. On-behalf skips this.
 */
export function appliesVlLeadTime(code: string): boolean {
  return code.toUpperCase() === 'VL'
}

/** SPL qualifying event codes for `POST /leaves`. */
export type SplQualifyingEvent = 'marriage' | 'death'

/** SPL relationship codes for `POST /leaves`. */
export type SplRelationship =
  | 'employee'
  | 'employee_child'
  | 'spouse'
  | 'parent'
  | 'child'
  | 'sibling'
  | 'employee_grandparent'
  | 'employee_grandchild'
  | 'spouse_parent'
  | 'child_spouse'
  | 'sibling_spouse'
  | 'spouse_sibling'
  | 'spouse_grandparent'

export const SPL_QUALIFYING_EVENT_OPTIONS: {
  value: SplQualifyingEvent
  label: string
}[] = [
  { value: 'marriage', label: 'Marriage' },
  { value: 'death', label: 'Death' },
]

const SPL_MARRIAGE_RELATIONSHIP_OPTIONS: {
  value: SplRelationship
  label: string
}[] = [
  { value: 'employee', label: 'Employee' },
  { value: 'employee_child', label: "Employee's child" },
]

const SPL_DEATH_RELATIONSHIP_OPTIONS: {
  value: SplRelationship
  label: string
}[] = [
  { value: 'spouse', label: 'Spouse' },
  { value: 'parent', label: 'Parent / adoptive parent' },
  { value: 'child', label: 'Child' },
  { value: 'sibling', label: 'Brother / sister' },
  { value: 'employee_grandparent', label: "Employee's grandparent" },
  { value: 'employee_grandchild', label: "Employee's grandchild" },
  { value: 'spouse_parent', label: "Spouse's parent" },
  { value: 'child_spouse', label: "Child's spouse" },
  { value: 'sibling_spouse', label: "Sibling's spouse" },
  { value: 'spouse_sibling', label: "Spouse's sibling" },
  { value: 'spouse_grandparent', label: "Spouse's grandparent" },
]

/** Relationship options for the selected SPL qualifying event. */
export function splRelationshipOptionsForEvent(
  event: SplQualifyingEvent | '',
): { value: SplRelationship; label: string }[] {
  if (event === 'marriage') return SPL_MARRIAGE_RELATIONSHIP_OPTIONS
  if (event === 'death') return SPL_DEATH_RELATIONSHIP_OPTIONS
  return []
}

function empIdsMatch(left: number, right: string): boolean {
  return String(left) === String(right)
}

/** True when the person on leave submitted the request (not a PIC on-behalf). */
export function isLeaveSelfFiled(detail: LeaveDetail): boolean {
  if (detail.filed_by != null && detail.employee != null) {
    return detail.filed_by.id === detail.employee.id
  }
  return detail.filed_by_emp_id === detail.emp_id
}

/** True when the viewer is the person on leave. */
function isLeaveViewerTheEmployee(
  detail: LeaveDetail,
  userId: string,
): boolean {
  if (detail.employee != null) {
    return empIdsMatch(detail.employee.id, userId)
  }
  return empIdsMatch(detail.emp_id, userId)
}

/** True when the viewer submitted the request. */
function isLeaveViewerTheFiler(
  detail: LeaveDetail,
  userId: string,
): boolean {
  if (detail.filed_by != null) {
    return empIdsMatch(detail.filed_by.id, userId)
  }
  return empIdsMatch(detail.filed_by_emp_id, userId)
}

/** API: show Edit when the viewer is `employee.id` or `filed_by.id`. */
export function canShowLeaveEdit(detail: LeaveDetail, userId: string): boolean {
  return (
    isLeaveViewerTheEmployee(detail, userId) ||
    isLeaveViewerTheFiler(detail, userId)
  )
}

/**
 * Pending filable leave with no approval history.
 * The person on leave or the original filer may edit (self-file and on-behalf).
 */
export function isPendingLeaveEditable(
  detail: LeaveDetail,
  userId: string,
): boolean {
  if (detail.status !== 'pending_approval') return false
  if (!isFilableLeaveCode(detail.leave_type.code)) return false
  if (!canShowLeaveEdit(detail, userId)) return false
  return !detail.approval_requirements.some((req) => req.history != null)
}
