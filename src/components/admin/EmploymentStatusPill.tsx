import type { EmploymentStatus } from '../../mocks/leaveBalances'
import { EMPLOYMENT_STATUS_LABELS } from '../../mocks/leaveBalances'

const DOT_CLASS: Record<EmploymentStatus, string> = {
  regular: 'bg-status-approved',
  probationary: 'bg-status-pending-conversion',
  contractual: 'bg-text-gray',
}

export function EmploymentStatusPill({
  status,
}: {
  status: EmploymentStatus
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-body text-text-black">
      <span
        className={`size-2 shrink-0 rounded-full ${DOT_CLASS[status]}`}
        aria-hidden="true"
      />
      {EMPLOYMENT_STATUS_LABELS[status]}
    </span>
  )
}
