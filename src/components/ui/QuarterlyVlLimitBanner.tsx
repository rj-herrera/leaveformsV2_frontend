import { TriangleAlert } from 'lucide-react'
import type { LeaveQuarterUsageResource } from '../../api/types'
import {
  formatQuarterLabel,
  formatQuarterlyVlDays,
  shouldShowQuarterUsageBanner,
} from '../../utils/quarterlyVlLimit'

export type QuarterlyVlLimitBannerProps = {
  /** Response from `GET /leaves/quarter-usage`. Hide when null/undefined. */
  usage: LeaveQuarterUsageResource | null | undefined
  className?: string
}

/**
 * Informational warning when projected VL hits or exceeds the quarterly
 * cap (9 days). Driven by `GET /leaves/quarter-usage`. Never blocks filing.
 */
export function QuarterlyVlLimitBanner({
  usage,
  className,
}: QuarterlyVlLimitBannerProps) {
  if (!shouldShowQuarterUsageBanner(usage) || usage == null) return null

  const exceeded = usage.level === 'exceeded'
  const period = formatQuarterLabel(usage.quarter)
  const periodSuffix = period ? ` (${period})` : ''
  const takenLabel = formatQuarterlyVlDays(usage.taken)
  const projectedLabel = formatQuarterlyVlDays(usage.projected)
  const capLabel = formatQuarterlyVlDays(usage.cap)
  const thisRequestLabel = formatQuarterlyVlDays(usage.this_request)

  const title = exceeded
    ? 'Quarterly Vacation Leave limit exceeded'
    : 'Quarterly Vacation Leave limit reached'

  const body = exceeded
    ? `You have ${takenLabel} of confirmed VL this quarter${periodSuffix}. Including this request (${thisRequestLabel}), that would be ${projectedLabel}, which exceeds the ${capLabel} quarterly cap. Exceeding 9 VL days in a quarter may result in a memo.`
    : `You have ${takenLabel} of confirmed VL this quarter${periodSuffix}. Including this request (${thisRequestLabel}), that would be ${projectedLabel} — the ${capLabel} quarterly cap.`

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
        <p className="text-body font-semibold text-text-black">{title}</p>
        <p className="mt-1 text-small text-text-black">{body}</p>
      </div>
    </div>
  )
}
