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
    case 'converted_to_sl':
      return 'APPROVED'
    case 'rejected':
      return 'REJECTED'
    case 'cancelled':
      return 'CANCELLED'
  }
}

export function formatShortDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`)
  if (Number.isNaN(date.getTime())) return isoDate
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Formats an ISO datetime (or date) for display. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const datePart = iso.slice(0, 10)
  return formatShortDate(datePart)
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
    return `Approver (P${requirement.allowed_levels.join('/P')})`
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

export function getApprovalProgressLabel(
  completed: number,
  required: number,
): string {
  if (required <= 0) return 'No approval required'
  if (completed >= required) return 'Approved'
  return 'Awaiting Approval'
}

export function getApprovalProgressPercent(
  completed: number,
  required: number,
): number {
  if (required <= 0) return 0
  if (completed >= required) return 100
  return Math.round((completed / required) * 100)
}
