export type LeaveRequestStatus =
  | 'PENDING'
  | 'PENDING_CONVERSION'
  | 'APPROVED'
  | 'CONVERTED'
  | 'CONVERTED_EL'
  | 'REJECTED'
  | 'CANCELLED'
  /** Conversion-request section badge only (not used in leave list filters). */
  | 'CONVERSION_PENDING'
  | 'CONVERSION_APPROVED'
  | 'CONVERSION_REJECTED'

/** Leave-level statuses used in list filters (excludes conversion-request badge keys). */
export type LeaveListStatus = Exclude<
  LeaveRequestStatus,
  'CONVERSION_PENDING' | 'CONVERSION_APPROVED' | 'CONVERSION_REJECTED'
>

export const LEAVE_STATUS_LABELS: Record<LeaveRequestStatus, string> = {
  PENDING: 'PENDING APPROVAL',
  PENDING_CONVERSION: 'PENDING CONVERSION',
  APPROVED: 'APPROVED',
  CONVERTED: 'CONVERTED TO SL',
  CONVERTED_EL: 'CONVERTED TO EL',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
  CONVERSION_PENDING: 'PENDING',
  CONVERSION_APPROVED: 'APPROVED',
  CONVERSION_REJECTED: 'REJECTED',
}

export const LEAVE_STATUS_STYLES: Record<LeaveRequestStatus, string> = {
  PENDING: 'bg-status-pending text-white',
  PENDING_CONVERSION: 'bg-status-pending-conversion text-white',
  APPROVED: 'bg-status-approved text-white',
  CONVERTED: 'bg-status-converted text-white',
  CONVERTED_EL: 'bg-status-converted text-white',
  REJECTED: 'bg-status-rejected text-white',
  CANCELLED: 'bg-status-cancelled text-white',
  CONVERSION_PENDING:
    'border border-status-pending-conversion bg-status-pending-conversion/10 text-status-pending-conversion',
  CONVERSION_APPROVED:
    'border border-status-approved bg-status-approved/10 text-status-approved',
  CONVERSION_REJECTED:
    'border border-status-rejected bg-status-rejected/10 text-status-rejected',
}

export type StatusFilter = 'ALL' | LeaveListStatus

export const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending Approval' },
  { value: 'PENDING_CONVERSION', label: 'Pending conversion' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'CONVERTED', label: 'Converted to SL' },
  { value: 'CONVERTED_EL', label: 'Converted to EL' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CANCELLED', label: 'Cancelled' },
]
