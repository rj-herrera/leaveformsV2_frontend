import type { LeaveRequestStatus } from '../constants/leaveStatus'
import { PTB_LEAVE_THEME } from '../constants/leaveTypeTheme'
import type {
  ConversionStatus,
  DayType,
  LeaveApprovalRequirement,
  LeaveStatus,
  LeaveTypeRef,
} from '../api/types'

/** Map API leave type names to UI labels (e.g. PTB → "PTB Leave"). */
export function formatLeaveTypeName(leaveType: LeaveTypeRef): string {
  if (leaveType.code.trim().toUpperCase() === 'PTB') {
    return PTB_LEAVE_THEME.label
  }
  return leaveType.name
}

/** Map API leave status → existing UI badge/filter status. */
export function mapApiLeaveStatusToUi(
  status: LeaveStatus,
): LeaveRequestStatus {
  switch (status) {
    case 'pending_approval':
      return 'PENDING'
    case 'pending_conversion':
      return 'PENDING_CONVERSION'
    case 'confirmed':
      return 'APPROVED'
    case 'converted_to_sl':
      return 'CONVERTED'
    case 'converted_to_el':
      return 'CONVERTED_EL'
    case 'rejected':
      return 'REJECTED'
    case 'cancelled':
      return 'CANCELLED'
  }
}

export function isConvertedLeaveStatus(
  status: LeaveStatus | null | undefined,
): boolean {
  return status === 'converted_to_sl' || status === 'converted_to_el'
}

export function isConversionReviewStatus(
  status: LeaveStatus | null | undefined,
): boolean {
  return status === 'pending_conversion' || isConvertedLeaveStatus(status)
}

export function isLeaveDecisionSettled(
  status: LeaveStatus | null | undefined,
): boolean {
  return (
    status === 'confirmed' ||
    status === 'rejected' ||
    status === 'cancelled' ||
    isConvertedLeaveStatus(status)
  )
}

/** Map API conversion status → conversion-request section badge. */
export function mapConversionStatusToUi(
  status: ConversionStatus,
): LeaveRequestStatus {
  switch (status) {
    case 'pending_review':
      return 'CONVERSION_PENDING'
    case 'approved':
      return 'CONVERSION_APPROVED'
    case 'rejected':
      return 'CONVERSION_REJECTED'
  }
}

/** Resolve conversion reviewer display name from API relation or eligible pool. */
export function resolveConversionReviewerName(
  conversion: {
    reviewed_by_emp_id: number | null
    reviewed_by?: { name: string } | null
  },
  eligibleApprovers: ReadonlyArray<{ emp_id: number; name: string }> = [],
): string | null {
  const fromRelation = conversion.reviewed_by?.name?.trim()
  if (fromRelation) return fromRelation

  const reviewedByEmpId = conversion.reviewed_by_emp_id
  if (reviewedByEmpId == null) return null

  const match = eligibleApprovers.find(
    (approver) => Number(approver.emp_id) === Number(reviewedByEmpId),
  )
  const name = match?.name?.trim()
  if (name) return name
  return `Employee #${reviewedByEmpId}`
}

/** Parse `YYYY-MM-DD` (or a longer ISO string) as a local calendar date. */
function parseLocalDateOnly(isoDate: string): Date | null {
  const datePart = isoDate.trim().slice(0, 10)
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart)
  if (!match) {
    const fallback = new Date(`${datePart}T00:00:00`)
    return Number.isNaN(fallback.getTime()) ? null : fallback
  }
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  )
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatShortDate(isoDate: string | null | undefined): string {
  if (!isoDate) return '—'
  const date = parseLocalDateOnly(isoDate)
  if (!date) return isoDate
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatMonthDay(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

const PHT_TIME_ZONE = 'Asia/Manila'

const DATE_TIME_DISPLAY_OPTIONS: Intl.DateTimeFormatOptions = {
  timeZone: PHT_TIME_ZONE,
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
}

function normalizeDateTimeInput(iso: string): string {
  const trimmed = iso.trim()
  return trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T')
}

/** UTC instants from Laravel (`reviewed_at`, `created_at`, reminders, etc.). */
export function parseUtcDateTime(iso: string): Date {
  const trimmed = iso.trim()
  if (/(?:Z|[+-]\d{2}:?\d{2})$/i.test(trimmed)) {
    return new Date(trimmed)
  }
  return new Date(`${normalizeDateTimeInput(trimmed)}+08:00`)
}

/**
 * Activity-log timestamps are PHT wall-clock values.
 * A trailing `Z` / offset from the API is not a real UTC conversion.
 */
export function parseWallClockDateTime(iso: string): Date {
  const trimmed = iso.trim()
  const withoutOffset = trimmed
    .replace(/Z$/i, '')
    .replace(/[+-]\d{2}:?\d{2}$/, '')
  return new Date(`${normalizeDateTimeInput(withoutOffset)}+08:00`)
}

/** Formats a Laravel UTC datetime for display in Philippine Standard Time. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = parseUtcDateTime(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('en-US', DATE_TIME_DISPLAY_OPTIONS)
}

/** Formats activity-log timestamps (PHT wall-clock) for display. */
export function formatWallClockDateTime(
  iso: string | null | undefined,
): string {
  if (!iso) return '—'
  const date = parseWallClockDateTime(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('en-US', DATE_TIME_DISPLAY_OPTIONS)
}

/** Formats a `Date` instance for display in Philippine Standard Time. */
export function formatDateTimeFromDate(date: Date): string {
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-US', DATE_TIME_DISPLAY_OPTIONS)
}

/** Long month + time, for reminder banners and similar copy. */
export function formatLongDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = parseUtcDateTime(iso)
  if (Number.isNaN(date.getTime())) return iso
  const datePart = date.toLocaleDateString('en-US', {
    timeZone: PHT_TIME_ZONE,
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const timePart = date.toLocaleTimeString('en-US', {
    timeZone: PHT_TIME_ZONE,
    hour: 'numeric',
    minute: '2-digit',
  })
  return `${datePart}, ${timePart}`
}

/**
 * Display a leave period / date range.
 * - Same day: `Sep 14, 2026`
 * - Same month & year: `Sep 14–15, 2026`
 * - Different months, same year: `Sep 30 – Nov 1, 2026`
 * - Different years: `Dec 1, 2026 – Jan 15, 2027`
 */
export function formatLeavePeriod(startDate: string, endDate: string): string {
  const start = parseLocalDateOnly(startDate)
  const end = parseLocalDateOnly(endDate)
  if (!start || !end) {
    if (startDate === endDate) return formatShortDate(startDate)
    return `${formatShortDate(startDate)} – ${formatShortDate(endDate)}`
  }

  if (
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate()
  ) {
    return formatShortDate(startDate)
  }

  const sameYear = start.getFullYear() === end.getFullYear()
  const sameMonth = sameYear && start.getMonth() === end.getMonth()

  if (sameMonth) {
    const month = start.toLocaleDateString('en-US', { month: 'short' })
    return `${month} ${start.getDate()}–${end.getDate()}, ${start.getFullYear()}`
  }

  if (sameYear) {
    return `${formatMonthDay(start)} – ${formatMonthDay(end)}, ${start.getFullYear()}`
  }

  return `${formatShortDate(startDate)} – ${formatShortDate(endDate)}`
}

export function formatDurationDays(
  duration: string,
  dayType?: DayType | null,
): string {
  const n = Number(duration)
  if (Number.isNaN(n)) return duration
  const days = Number.parseFloat(n.toFixed(2))
  const base = `${days} ${days === 1 ? 'day' : 'days'}`
  if (dayType === 'half_am') return `${base} (AM)`
  if (dayType === 'half_pm') return `${base} (PM)`
  return base
}

export function approvalRequirementLabel(
  requirement: LeaveApprovalRequirement,
): string {
  if (requirement.required_approver_type === 'president') return 'President'
  if (requirement.required_approver_type === 'admin') return 'Admin'
  if (requirement.allowed_levels.length > 0) {
    return `Assigned group approver`
  }
  return `Step ${requirement.display_order}`
}
