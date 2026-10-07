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
import {
  inclusiveCalendarEndDate,
  nthWorkingDayEndDate,
} from './leaveDates'

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

/** Max size per attachment (MB). Enforced on select and shown in upload hints. */
export const ATTACHMENT_MAX_FILE_SIZE_MB = 10

export const ATTACHMENT_MAX_FILE_SIZE_BYTES =
  ATTACHMENT_MAX_FILE_SIZE_MB * 1024 * 1024

/** Reject empty or oversized files before they are attached. */
export function assertAttachmentFileAllowed(file: File): void {
  if (file.size <= 0) {
    throw new Error('The selected file is empty.')
  }
  if (file.size > ATTACHMENT_MAX_FILE_SIZE_BYTES) {
    throw new Error(`File is too large (max ${ATTACHMENT_MAX_FILE_SIZE_MB} MB).`)
  }
}

/** Short hint shown under file upload fields (File Leave, convert, edit). */
export function attachmentFieldHint(): string {
  return `You can upload up to ${ATTACHMENT_MAX_FILES} files, with a maximum size of ${ATTACHMENT_MAX_FILE_SIZE_MB} MB per file. PDF, JPG, or PNG.`
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

/** SL, PTB, EL, LL, PL, and SPL require `leave_attachment` on submit. */
export function requiresAttachment(code: string): boolean {
  const normalized = code.toUpperCase()
  return (
    normalized === 'SL' ||
    normalized === 'PTB' ||
    normalized === 'EL' ||
    normalized === 'LL' ||
    normalized === 'PL' ||
    normalized === 'SPL'
  )
}

/** SL and PTB attachments are medical certificates; EL, LL, and SPL are supporting documents. */
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

/** ML/PL end dates are derived — the end picker stays locked. SPL is a capped range. */
export function hasDerivedEndDate(code: string): boolean {
  return isFixedRangeLeave(code)
}

/** ML/PL credits are granted on submit — do not treat remaining 0 as a block. */
export function grantsCreditsOnSubmit(code: string): boolean {
  return isFixedRangeLeave(code)
}

/** SPL has no rolling credits; ML/PL grant on submit; LL is unpaid. Show “—”. */
export function hidesRemainingCredits(code: string): boolean {
  return grantsCreditsOnSubmit(code) || isLongLeave(code) || isSpecialLeave(code)
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
 * Self-filed VL advance notice: 3 workdays → 7 calendar days; 4 or more → 30.
 * On-behalf skips this.
 */
export function appliesVlLeadTime(code: string): boolean {
  return code.toUpperCase() === 'VL'
}

/** SPL assignment type codes for `POST /leaves` (`assignment_type`). */
export type SplAssignmentType = 'philippines_based' | 'long_term_overseas'

/** SPL qualifying event codes for `POST /leaves` (`special_leave_reason`). */
export type SplSpecialLeaveReason =
  | 'employee_marriage'
  | 'child_marriage'
  | 'death_spouse'
  | 'death_parent'
  | 'death_child'
  | 'death_sibling'
  | 'death_grandparent'
  | 'death_grandchild'
  | 'death_spouse_parent'
  | 'death_child_spouse'
  | 'death_sibling_spouse'
  | 'death_spouse_sibling'
  | 'death_spouse_grandparent'

/** Long-term overseas qualifying death: inclusive calendar days (21 + 2 travel). */
export const SPL_LTD_DEATH_CALENDAR_DAYS = 23

export const SPL_ASSIGNMENT_TYPE_OPTIONS: {
  value: SplAssignmentType
  label: string
}[] = [
  {
    value: 'philippines_based',
    label: 'Philippines-Based / Short-Term Overseas',
  },
  {
    value: 'long_term_overseas',
    label: 'Long-Term Overseas',
  },
]

export const SPL_SPECIAL_LEAVE_REASON_OPTIONS: {
  value: SplSpecialLeaveReason
  label: string
}[] = [
  { value: 'employee_marriage', label: 'Employee gets married' },
  {
    value: 'child_marriage',
    label: "Employee's child gets married",
  },
  { value: 'death_spouse', label: 'Death – spouse' },
  {
    value: 'death_parent',
    label: 'Death – parent / adoptive parent',
  },
  { value: 'death_child', label: 'Death – child' },
  { value: 'death_sibling', label: 'Death – brother / sister' },
  {
    value: 'death_grandparent',
    label: "Death – employee's grandparent",
  },
  {
    value: 'death_grandchild',
    label: "Death – employee's grandchild",
  },
  { value: 'death_spouse_parent', label: "Death – spouse's parent" },
  { value: 'death_child_spouse', label: "Death – child's spouse" },
  { value: 'death_sibling_spouse', label: "Death – sibling's spouse" },
  { value: 'death_spouse_sibling', label: "Death – spouse's sibling" },
  {
    value: 'death_spouse_grandparent',
    label: "Death – spouse's grandparent",
  },
]

const SPL_PH_WORKDAYS: Record<SplSpecialLeaveReason, number> = {
  employee_marriage: 6,
  child_marriage: 2,
  death_spouse: 7,
  death_parent: 7,
  death_child: 7,
  death_sibling: 5,
  death_grandparent: 5,
  death_grandchild: 5,
  death_spouse_parent: 4,
  death_child_spouse: 3,
  death_sibling_spouse: 2,
  death_spouse_sibling: 2,
  death_spouse_grandparent: 2,
}

export function isSplAssignmentType(value: string): value is SplAssignmentType {
  return SPL_ASSIGNMENT_TYPE_OPTIONS.some((option) => option.value === value)
}

export function isSplSpecialLeaveReason(
  value: string,
): value is SplSpecialLeaveReason {
  return SPL_SPECIAL_LEAVE_REASON_OPTIONS.some(
    (option) => option.value === value,
  )
}

export function isSplUnavailableForLongTermOverseas(
  reason: SplSpecialLeaveReason,
): boolean {
  return reason === 'death_child_spouse' || reason === 'death_sibling_spouse'
}

export function splReasonOptionsFor(assignment: SplAssignmentType | '') {
  if (assignment !== 'long_term_overseas') {
    return SPL_SPECIAL_LEAVE_REASON_OPTIONS
  }
  return SPL_SPECIAL_LEAVE_REASON_OPTIONS.filter(
    (option) => !isSplUnavailableForLongTermOverseas(option.value),
  )
}

export function splSpecialLeaveReasonLabel(
  reason: SplSpecialLeaveReason | '',
): string {
  if (!reason) return ''
  return (
    SPL_SPECIAL_LEAVE_REASON_OPTIONS.find((option) => option.value === reason)
      ?.label ?? reason
  )
}

export type SplAllotment = {
  days: number
  usesCalendarDays: boolean
}

export function splAllotment(
  assignment: SplAssignmentType | '',
  reason: SplSpecialLeaveReason | '',
): SplAllotment | null {
  if (!assignment || !reason) return null
  if (assignment === 'long_term_overseas') {
    if (reason === 'employee_marriage') {
      return { days: 6, usesCalendarDays: false }
    }
    if (reason === 'child_marriage') {
      return { days: 2, usesCalendarDays: false }
    }
    if (isSplUnavailableForLongTermOverseas(reason)) return null
    return {
      days: SPL_LTD_DEATH_CALENDAR_DAYS,
      usesCalendarDays: true,
    }
  }
  return {
    days: SPL_PH_WORKDAYS[reason],
    usesCalendarDays: false,
  }
}

export function usesSplCalendarDays(
  assignment: SplAssignmentType | '',
  reason: SplSpecialLeaveReason | '',
): boolean {
  return splAllotment(assignment, reason)?.usesCalendarDays === true
}

/** Latest allowed SPL end date for this event. A shorter end is allowed. */
export function specialLeaveEndDate(
  startISO: string,
  assignment: SplAssignmentType | '',
  reason: SplSpecialLeaveReason | '',
  nonWorkingDates?: ReadonlySet<string>,
): string {
  const allotment = splAllotment(assignment, reason)
  if (!allotment) return ''
  if (allotment.usesCalendarDays) {
    return inclusiveCalendarEndDate(startISO, allotment.days)
  }
  return nthWorkingDayEndDate(startISO, allotment.days, nonWorkingDates)
}

/**
 * Keep `currentEnd` when it is on or between the start date and the event
 * maximum. Otherwise use the maximum (full entitlement is still allowed).
 */
export function clampSpecialLeaveEndDate(
  startISO: string,
  assignment: SplAssignmentType | '',
  reason: SplSpecialLeaveReason | '',
  currentEnd: string,
  nonWorkingDates?: ReadonlySet<string>,
): string {
  const max = specialLeaveEndDate(
    startISO,
    assignment,
    reason,
    nonWorkingDates,
  )
  if (!startISO || !max) return ''
  if (currentEnd >= startISO && currentEnd <= max) return currentEnd
  return max
}

export function isSpecialLeaveEndInBounds(
  startISO: string,
  endISO: string,
  assignment: SplAssignmentType | '',
  reason: SplSpecialLeaveReason | '',
  nonWorkingDates?: ReadonlySet<string>,
): boolean {
  const max = specialLeaveEndDate(
    startISO,
    assignment,
    reason,
    nonWorkingDates,
  )
  if (!startISO || !endISO || !max) return false
  return endISO >= startISO && endISO <= max
}

/** e.g. marriage → "This event allows up to 6 working days." */
export function splDurationCapMessage(
  assignment: SplAssignmentType | '',
  reason: SplSpecialLeaveReason | '',
): string | null {
  const allotment = splAllotment(assignment, reason)
  if (!allotment) return null
  const kind = allotment.usesCalendarDays ? 'calendar' : 'working'
  const noun = allotment.days === 1 ? 'day' : 'days'
  return `This event allows up to ${allotment.days} ${kind} ${noun}.`
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
