import type { LeaveQuarterUsageResource } from '../api/types'

/** Max Vacation Leave days per calendar quarter (matches API `cap`). */
export const QUARTERLY_VL_LIMIT_DAYS = 9

function roundQuarterlyVlDays(days: number | string): number {
  const value = typeof days === 'string' ? Number(days) : days
  if (!Number.isFinite(value)) return 0
  return Math.round(value * 100) / 100
}

function formatQuarterlyVlNumber(days: number | string): string {
  const rounded = roundQuarterlyVlDays(days)
  return Number.isInteger(rounded) ? String(rounded) : String(rounded)
}

/** Format API decimal day strings for display (e.g. `"9.00"` → `"9 days"`). */
export function formatQuarterlyVlDays(days: number | string): string {
  const rounded = roundQuarterlyVlDays(days)
  return `${formatQuarterlyVlNumber(days)} ${rounded === 1 ? 'day' : 'days'}`
}

/** Compound adjective for display (e.g. `"2.00"` → `"2-day"`). */
export function formatQuarterlyVlDayHyphen(days: number | string): string {
  return `${formatQuarterlyVlNumber(days)}-day`
}

/** e.g. `"8.00"` → `"8 approved VL days"`. */
export function formatQuarterlyApprovedVlDays(days: number | string): string {
  const rounded = roundQuarterlyVlDays(days)
  return `${formatQuarterlyVlNumber(days)} approved vacation leave ${rounded === 1 ? 'day' : 'days'}`
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

/** True when the banner should render (over the quarterly cap only). */
export function shouldShowQuarterUsageBanner(
  usage: LeaveQuarterUsageResource | null | undefined,
): boolean {
  return usage?.applicable === true && usage.level === 'exceeded'
}
