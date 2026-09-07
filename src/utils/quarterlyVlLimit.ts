import {
  QUARTERLY_VL_LIMIT_DAYS,
  QUARTERLY_VL_WARN_FROM_DAYS,
} from '../constants/quarterlyVlLimit'

export type QuarterlyVlLimitSeverity = 'approaching' | 'at_limit'

export type QuarterlyVlLimitState = {
  severity: QuarterlyVlLimitSeverity
  /** Days already counted toward the quarter (API). */
  usedDays: number
  /** Days from the leave being filed now, if any. */
  additionalDays: number
  /** usedDays + additionalDays. */
  projectedDays: number
  limitDays: number
  remainingDays: number
}

function toNonNegativeDays(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0
  return value
}

/**
 * Returns banner state when the employee is near or at the quarterly VL
 * cap; otherwise null (do not render). Informational only — never blocks filing.
 */
export function getQuarterlyVlLimitState(options: {
  usedDays: number
  additionalDays?: number
  limitDays?: number
  warnFromDays?: number
}): QuarterlyVlLimitState | null {
  const usedDays = toNonNegativeDays(options.usedDays)
  const additionalDays = toNonNegativeDays(options.additionalDays ?? 0)
  const limitDays = options.limitDays ?? QUARTERLY_VL_LIMIT_DAYS
  const warnFromDays = options.warnFromDays ?? QUARTERLY_VL_WARN_FROM_DAYS
  const projectedDays = usedDays + additionalDays

  if (projectedDays < warnFromDays) return null

  const remainingDays = Math.max(0, limitDays - projectedDays)
  const severity: QuarterlyVlLimitSeverity =
    projectedDays >= limitDays ? 'at_limit' : 'approaching'

  return {
    severity,
    usedDays,
    additionalDays,
    projectedDays,
    limitDays,
    remainingDays,
  }
}

export function formatQuarterlyVlDays(days: number): string {
  const rounded = Math.round(days * 100) / 100
  const label = Number.isInteger(rounded) ? String(rounded) : String(rounded)
  return `${label} ${rounded === 1 ? 'day' : 'days'}`
}
