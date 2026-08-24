export type LeaveRequestStatus =
  | 'PENDING'
  | 'PENDING_CONVERSION'
  | 'APPROVED'
  | 'CONVERTED'
  | 'REJECTED'
  | 'CANCELLED'

export const LEAVE_STATUS_LABELS: Record<LeaveRequestStatus, string> = {
  PENDING: 'PENDING APPROVAL',
  PENDING_CONVERSION: 'PENDING CONVERSION',
  APPROVED: 'APPROVED',
  CONVERTED: 'CONVERTED TO SL',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
}

export const LEAVE_STATUS_STYLES: Record<LeaveRequestStatus, string> = {
  PENDING: 'bg-status-pending text-white',
  PENDING_CONVERSION: 'bg-status-pending-conversion text-white',
  APPROVED: 'bg-status-approved text-white',
  CONVERTED: 'bg-status-converted text-white',
  REJECTED: 'bg-status-rejected text-white',
  CANCELLED: 'bg-status-cancelled text-white',
}

export type StatusFilter = 'ALL' | LeaveRequestStatus

export const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending Approval' },
  { value: 'PENDING_CONVERSION', label: 'Pending conversion' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'CONVERTED', label: 'Converted to SL' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CANCELLED', label: 'Cancelled' },
]
