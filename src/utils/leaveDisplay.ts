import type { LeaveRequestStatus } from '../constants/leaveStatus'
import type {
  LeaveApprovalRequirement,
  LeaveStatus,
  RequiredApproverType,
} from '../api/types'

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
    case 'rejected':
      return 'REJECTED'
    case 'cancelled':
      return 'CANCELLED'
  }
}

export function formatShortDate(isoDate: string | null | undefined): string {
  if (!isoDate) return '—'
  const datePart = isoDate.slice(0, 10)
  const date = new Date(`${datePart}T00:00:00`)
  if (Number.isNaN(date.getTime())) return isoDate
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const PHT_TIME_ZONE = 'Asia/Manila'

/** API datetimes are PHT wall-clock; ignore a trailing Z / offset. */
function parseAsPht(iso: string): Date {
  const trimmed = iso.trim()
  const withoutOffset = trimmed
    .replace(/Z$/i, '')
    .replace(/[+-]\d{2}:?\d{2}$/, '')
  const normalized = withoutOffset.includes('T')
    ? withoutOffset
    : withoutOffset.replace(' ', 'T')
  return new Date(`${normalized}+08:00`)
}

/** Formats an ISO datetime for display (date + time). */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = parseAsPht(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('en-US', {
    timeZone: PHT_TIME_ZONE,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function formatLeavePeriod(startDate: string, endDate: string): string {
  if (startDate === endDate) return formatShortDate(startDate)
  return `${formatShortDate(startDate)} – ${formatShortDate(endDate)}`
}

export function formatDurationDays(duration: string): string {
  const n = Number(duration)
  if (Number.isNaN(n)) return duration
  const days = Number.parseFloat(n.toFixed(2))
  return `${days} ${days === 1 ? 'day' : 'days'}`
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

export function approvalPurposeLabel(
  requiredType: RequiredApproverType | null,
): string {
  if (requiredType === 'admin') return 'Admin validation'
  if (requiredType === 'president') return 'President approval'
  return 'Leave approval'
}

/**
 * Purpose for Approvers table: prefer API `purpose`, else derive from type
 * (admin → Admin validation, otherwise Leave approval).
 */
export function eligibleApproverPurpose(
  purpose: string | undefined,
  approverType: string,
): string {
  const trimmed = purpose?.trim()
  if (trimmed) return trimmed
  if (approverType === 'admin') return 'Admin validation'
  if (approverType === 'president') return 'President approval'
  return 'Leave approval'
}
