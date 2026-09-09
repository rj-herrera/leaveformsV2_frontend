import { TriangleAlert } from 'lucide-react'
import {
  QUARTERLY_VL_LIMIT_DAYS,
  QUARTERLY_VL_WARN_FROM_DAYS,
} from '../../constants/quarterlyVlLimit'
import {
  formatQuarterlyVlDays,
  getQuarterlyVlLimitState,
} from '../../utils/quarterlyVlLimit'

export type QuarterlyVlLimitBannerProps = {
  /**
   * VL days already used (or reserved + used) in the current quarter.
   * From the backend once available — omit or pass `null` to hide.
   */
  usedDays: number | null | undefined
  /**
   * Days from the leave currently being filed (so the banner can show
   * projected usage). Optional.
   */
  additionalDays?: number
  /** Defaults to {@link QUARTERLY_VL_LIMIT_DAYS} (9). */
  limitDays?: number
  /** Defaults to {@link QUARTERLY_VL_WARN_FROM_DAYS} (7). */
  warnFromDays?: number
  /**
   * Optional label for the quarter window, e.g. "Q1 2026" or
   * "Jan–Mar 2026". Shown in the body when provided.
   */
  quarterLabel?: string | null
  className?: string
}

/**
 * Informational warning when an employee is approaching or at the
 * quarterly Vacation Leave cap (9 days). Does not block filing.
 *
 * Renders nothing until `usedDays` is known and the warn threshold is met.
 */
export function QuarterlyVlLimitBanner({
  usedDays,
  additionalDays = 0,
  limitDays = QUARTERLY_VL_LIMIT_DAYS,
  warnFromDays = QUARTERLY_VL_WARN_FROM_DAYS,
  quarterLabel,
  className,
}: QuarterlyVlLimitBannerProps) {
  if (usedDays == null) return null

  const state = getQuarterlyVlLimitState({
    usedDays,
    additionalDays,
    limitDays,
    warnFromDays,
  })
  if (!state) return null

  const title =
    state.severity === 'at_limit'
      ? 'Quarterly leave limit reached'
      : 'Approaching quarterly leave limit'

  const period = quarterLabel?.trim() ? ` (${quarterLabel.trim()})` : ''
  const usedLabel = formatQuarterlyVlDays(state.usedDays)
  const limitLabel = formatQuarterlyVlDays(state.limitDays)

  let body: string
  if (state.additionalDays > 0) {
    const projectedLabel = formatQuarterlyVlDays(state.projectedDays)
    body =
      state.severity === 'at_limit'
        ? `You have used ${usedLabel} of ${limitLabel} allowed this quarter${period}. Including this request, that would be ${projectedLabel}. This notice is informational only and does not block filing.`
        : `You have used ${usedLabel} of ${limitLabel} allowed this quarter${period}. Including this request, you would use ${projectedLabel}. This notice is informational only and does not block filing.`
  } else if (state.severity === 'at_limit') {
    body = `You have used ${usedLabel} of ${limitLabel} Vacation Leave allowed this quarter${period}. This notice is informational only and does not block filing.`
  } else {
    body = `You have used ${usedLabel} of ${limitLabel} Vacation Leave allowed this quarter${period}. You have ${formatQuarterlyVlDays(state.remainingDays)} remaining before the quarterly cap. This notice is informational only and does not block filing.`
  }

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
