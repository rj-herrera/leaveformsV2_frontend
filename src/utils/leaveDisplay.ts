import type { LeaveRequestStatus } from '../constants/leaveStatus'
import type { LeaveStatus } from '../api/types'

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
