import { CheckCircle2, Circle, XCircle } from 'lucide-react'
import type { ApproverRowStatus } from '../../types/approverRow'

export function ApproverStatusBadge({
  status,
  decisionSettled = false,
}: {
  status: ApproverRowStatus
  decisionSettled?: boolean
}) {
  if (status === 'approved') {
    return (
      <span className="inline-flex items-center gap-1.5 text-status-approved">
        <CheckCircle2
          className="size-4 fill-status-approved text-white"
          aria-hidden="true"
        />
        Approved
      </span>
    )
  }
  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1.5 text-status-rejected">
        <XCircle
          className="size-4 fill-status-rejected text-white"
          aria-hidden="true"
        />
        Rejected
      </span>
    )
  }
  if (decisionSettled) {
    return (
      <span className="inline-flex items-center gap-1.5 text-text-gray">
        <Circle
          className="size-4 fill-text-gray text-text-gray"
          aria-hidden="true"
        />
        No action required
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-text-gray">
      <Circle className="size-4" aria-hidden="true" />
      No Action Yet
    </span>
  )
}
