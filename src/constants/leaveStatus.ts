export type LeaveRequestStatus =
  | 'PENDING'
  | 'PENDING_CONVERSION'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'

export const LEAVE_STATUS_LABELS: Record<LeaveRequestStatus, string> = {
  PENDING: 'PENDING APPROVAL',
  PENDING_CONVERSION: 'PENDING CONVERSION',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
}

export const LEAVE_STATUS_STYLES: Record<LeaveRequestStatus, string> = {
  PENDING: 'bg-status-pending text-text-white',
  PENDING_CONVERSION: 'bg-status-pending-conversion text-text-white',
  APPROVED: 'bg-status-approved text-text-white',
  REJECTED: 'bg-status-rejected text-text-white',
  CANCELLED: 'bg-status-cancelled text-text-white',
}

export type StatusFilter = 'ALL' | LeaveRequestStatus

export const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending Approval' },
  { value: 'PENDING_CONVERSION', label: 'Pending conversion' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CANCELLED', label: 'Cancelled' },
]
