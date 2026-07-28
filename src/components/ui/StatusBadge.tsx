import {
  LEAVE_STATUS_LABELS,
  LEAVE_STATUS_STYLES,
  type LeaveRequestStatus,
} from '../../constants/leaveStatus'

type StatusBadgeProps = {
  status: LeaveRequestStatus
  /** Optional display label override (e.g. "PENDING APPROVAL") */
  label?: string
  className?: string
}

export function StatusBadge({
  status,
  label,
  className = '',
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-0.5 text-small font-semibold whitespace-nowrap ${LEAVE_STATUS_STYLES[status]} ${className}`}
    >
      {label ?? LEAVE_STATUS_LABELS[status]}
    </span>
  )
}
