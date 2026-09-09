import { TriangleAlert } from 'lucide-react'
import type { LeaveQuarterUsageResource } from '../../api/types'
import {
  formatQuarterlyApprovedVlDays,
  formatQuarterlyVlDayHyphen,
  formatQuarterlyVlDays,
  shouldShowQuarterUsageBanner,
} from '../../utils/quarterlyVlLimit'

export type QuarterlyVlLimitBannerProps = {
  /** Response from `GET /leaves/quarter-usage`. Hide when null/undefined. */
  usage: LeaveQuarterUsageResource | null | undefined
  className?: string
}

/**
 * Informational warning when projected VL exceeds the quarterly cap
 * (9 days). Hidden at exactly 9 days (`at_cap`). Never blocks filing.
 */
export function QuarterlyVlLimitBanner({
  usage,
  className,
}: QuarterlyVlLimitBannerProps) {
  if (!shouldShowQuarterUsageBanner(usage) || usage == null) return null

  const takenLabel = formatQuarterlyApprovedVlDays(usage.taken)
  const projectedLabel = formatQuarterlyVlDays(usage.projected)
  const requestHyphen = formatQuarterlyVlDayHyphen(usage.this_request)
  const capHyphen = formatQuarterlyVlDayHyphen(usage.cap)

  return (
    <div
      className={`flex items-start gap-3 rounded-md border-2 border-status-pending bg-status-pending/15 px-3 py-3 ${className ?? ''}`}
      role="status"
    >
      <TriangleAlert
        className="mt-0.5 size-5 shrink-0 text-status-pending"
        aria-hidden="true"
      />
      <div className="min-w-0">
        <p className="text-body font-semibold text-text-black">
          Quarterly leave limit may be exceeded
        </p>
        <p className="mt-1 text-small text-text-black">
          You currently have{' '}
          <span className="font-semibold">{takenLabel}</span> this quarter. This{' '}
          <span className="font-semibold">{requestHyphen} request</span> would
          bring your total to{' '}
          <span className="font-semibold">{projectedLabel}</span>, exceeding the{' '}
          <span className="font-semibold">{capHyphen} quarterly limit</span>.
        </p>
      </div>
    </div>
  )
}
