import type { LeaveQuarterUsageResource } from '../api/types'

/** Max Vacation Leave days per calendar quarter (matches API `cap`). */
export const QUARTERLY_VL_LIMIT_DAYS = 9

/** Format API decimal day strings for display (e.g. `"9.00"` → `"9 days"`). */
export function formatQuarterlyVlDays(days: number | string): string {
  const value = typeof days === 'string' ? Number(days) : days
  if (!Number.isFinite(value)) return '0 days'
  const rounded = Math.round(value * 100) / 100
  const label = Number.isInteger(rounded) ? String(rounded) : String(rounded)
  return `${label} ${rounded === 1 ? 'day' : 'days'}`
}

/** `"2026-Q3"` → `"Q3 2026"`. */
export function formatQuarterLabel(quarter: string | null | undefined): string | null {
  if (!quarter) return null
  const match = /^(\d{4})-Q([1-4])$/i.exec(quarter.trim())
  if (!match) return quarter
  return `Q${match[2]} ${match[1]}`
}

/** True when projected usage would exceed the quarterly VL cap (memo path). */
export function isQuarterUsageExceeded(
  usage: LeaveQuarterUsageResource | null | undefined,
): boolean {
  return usage?.applicable === true && usage.level === 'exceeded'
}

/** True when the banner should render (`at_cap` or `exceeded`). */
export function shouldShowQuarterUsageBanner(
  usage: LeaveQuarterUsageResource | null | undefined,
): boolean {
  return (
    usage?.applicable === true &&
    (usage.level === 'at_cap' || usage.level === 'exceeded')
  )
}
