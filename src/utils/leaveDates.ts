import { isNonWorkingHoliday } from '../mocks/workCalendar'

const MONTH_INDEX: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
}

/** Maternity Leave entitlement — consecutive calendar days (weekends & holidays included). */
export const MATERNITY_ENTITLEMENT_CALENDAR_DAYS = 105

/** Paternity Leave entitlement — working days only (weekends & non-working holidays excluded). */
export const PATERNITY_ENTITLEMENT_WORKING_DAYS = 7

export const MATERNITY_LEAVE_TYPE = 'Maternity Leave'
export const PATERNITY_LEAVE_TYPE = 'Paternity Leave'

function toISODate(year: number, monthIndex: number, day: number): string {
  const m = String(monthIndex + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${year}-${m}-${d}`
}

function monthIndexFromLabel(label: string): number | null {
  const key = label.toLowerCase()
  return key in MONTH_INDEX ? MONTH_INDEX[key] : null
}

/**
 * Parses mock leave period labels into ISO start/end dates.
 * Supports: "Jun 25, 2026", "Aug 1–3, 2026", "Jun 1 – Sep 15, 2026"
 */
export function parseLeavePeriodToDates(
  period: string,
  fallbackISO: string,
): { start: string; end: string } {
  const cleaned = period
    .replace(/\u2013|\u2014/g, '-')
    .replace(/\s+/g, ' ')
    .trim()

  // Same-month range: "Aug 1-3, 2026"
  let match = /^([A-Za-z]+)\s+(\d{1,2})\s*-\s*(\d{1,2}),\s*(\d{4})$/.exec(
    cleaned,
  )
  if (match) {
    const month = monthIndexFromLabel(match[1])
    const year = Number(match[4])
    const startDay = Number(match[2])
    const endDay = Number(match[3])
    if (month !== null) {
      return {
        start: toISODate(year, month, startDay),
        end: toISODate(year, month, endDay),
      }
    }
  }

  // Cross-month range: "Jun 1 - Sep 15, 2026"
  match =
    /^([A-Za-z]+)\s+(\d{1,2})\s*-\s*([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/.exec(
      cleaned,
    )
  if (match) {
    const startMonth = monthIndexFromLabel(match[1])
    const endMonth = monthIndexFromLabel(match[3])
    const year = Number(match[5])
    if (startMonth !== null && endMonth !== null) {
      return {
        start: toISODate(year, startMonth, Number(match[2])),
        end: toISODate(year, endMonth, Number(match[4])),
      }
    }
  }

  // Single day: "Jun 25, 2026"
  match = /^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/.exec(cleaned)
  if (match) {
    const month = monthIndexFromLabel(match[1])
    const year = Number(match[3])
    if (month !== null) {
      const iso = toISODate(year, month, Number(match[2]))
      return { start: iso, end: iso }
    }
  }

  return { start: fallbackISO, end: fallbackISO }
}

export type DayType = 'full' | 'half_am' | 'half_pm'

export function inferDayTypeFromDuration(duration: string): DayType {
  if (/0\.5|half/i.test(duration)) return 'half_am'
  return 'full'
}

export function formatDayTypeLabel(dayType: DayType): string {
  if (dayType === 'half_am') return 'Half day (AM)'
  if (dayType === 'half_pm') return 'Half day (PM)'
  return 'Whole day'
}

function parseLocalISO(iso: string): Date | null {
  if (!iso) return null
  const date = new Date(`${iso}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

export function toLocalISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayISO(): string {
  return toLocalISODate(new Date())
}

export function isWeekday(date: Date): boolean {
  const day = date.getDay()
  return day !== 0 && day !== 6
}

/** Weekday that is not a configured non-working holiday. */
export function isWorkingDay(
  date: Date,
  nonWorkingDates?: ReadonlySet<string>,
): boolean {
  if (!isWeekday(date)) return false
  const iso = toLocalISODate(date)
  if (nonWorkingDates) return !nonWorkingDates.has(iso)
  return !isNonWorkingHoliday(iso)
}

export function isWorkingDayISO(
  iso: string,
  nonWorkingDates?: ReadonlySet<string>,
): boolean {
  const date = parseLocalISO(iso)
  return date ? isWorkingDay(date, nonWorkingDates) : false
}

/** Maternity and PTB use consecutive calendar days; other types use working days. */
export function usesCalendarDayCounting(leaveType: string): boolean {
  const key = leaveType.trim().toLowerCase()
  return (
    leaveType === MATERNITY_LEAVE_TYPE ||
    key === 'ptb' ||
    key === 'ptb leave' ||
    key === 'pulmonary tuberculosis leave'
  )
}

/** Move to the nearest weekday in the given direction (skips Sat/Sun). */
export function snapToWeekday(
  iso: string,
  direction: 'forward' | 'backward' = 'forward',
): string {
  const date = parseLocalISO(iso)
  if (!date) return iso
  const step = direction === 'forward' ? 1 : -1
  while (!isWeekday(date)) {
    date.setDate(date.getDate() + step)
  }
  return toLocalISODate(date)
}

/** Move to the nearest working day (skips weekends + non-working holidays). */
export function snapToWorkingDay(
  iso: string,
  direction: 'forward' | 'backward' = 'forward',
  nonWorkingDates?: ReadonlySet<string>,
): string {
  const date = parseLocalISO(iso)
  if (!date) return iso
  const step = direction === 'forward' ? 1 : -1
  while (!isWorkingDay(date, nonWorkingDates)) {
    date.setDate(date.getDate() + step)
  }
  return toLocalISODate(date)
}

/** Inclusive calendar-day count (weekends and holidays included). */
export function countCalendarDays(startISO: string, endISO: string): number {
  const start = parseLocalISO(startISO)
  const end = parseLocalISO(endISO)
  if (!start || !end || end < start) return 0

  let count = 0
  const cursor = new Date(start)
  while (cursor <= end) {
    count += 1
    cursor.setDate(cursor.getDate() + 1)
  }
  return count
}

/** Inclusive weekday count between ISO dates (local). Weekends excluded. */
export function countWeekdays(startISO: string, endISO: string): number {
  const start = parseLocalISO(startISO)
  const end = parseLocalISO(endISO)
  if (!start || !end || end < start) return 0

  let count = 0
  const cursor = new Date(start)
  while (cursor <= end) {
    if (isWeekday(cursor)) count += 1
    cursor.setDate(cursor.getDate() + 1)
  }
  return count
}

/**
 * Inclusive working-day count (weekends + configured non-working holidays excluded).
 * Used for Paternity Leave and other working-day leave types.
 */
export function countWorkingDays(
  startISO: string,
  endISO: string,
  nonWorkingDates?: ReadonlySet<string>,
): number {
  const start = parseLocalISO(startISO)
  const end = parseLocalISO(endISO)
  if (!start || !end || end < start) return 0

  let count = 0
  const cursor = new Date(start)
  while (cursor <= end) {
    if (isWorkingDay(cursor, nonWorkingDates)) count += 1
    cursor.setDate(cursor.getDate() + 1)
  }
  return count
}

/** Duration count for a leave type using the correct day basis. */
export function countLeaveDurationDays(
  leaveType: string,
  startISO: string,
  endISO: string,
  nonWorkingDates?: ReadonlySet<string>,
): number {
  if (usesCalendarDayCounting(leaveType)) {
    return countCalendarDays(startISO, endISO)
  }
  return countWorkingDays(startISO, endISO, nonWorkingDates)
}

export function parentalEntitlementDays(
  leaveType: 'Maternity Leave' | 'Paternity Leave' | string,
): number {
  if (leaveType === MATERNITY_LEAVE_TYPE) {
    return MATERNITY_ENTITLEMENT_CALENDAR_DAYS
  }
  if (leaveType === PATERNITY_LEAVE_TYPE) {
    return PATERNITY_ENTITLEMENT_WORKING_DAYS
  }
  return 0
}

export function formatParentalEntitlementLabel(
  leaveType: 'Maternity Leave' | 'Paternity Leave' | string,
  days = parentalEntitlementDays(leaveType),
): string {
  return `${days} days`
}

export function formatDurationLabel(days: number, dayType: DayType): string {
  if (dayType === 'half_am' || dayType === 'half_pm') {
    return '0.5 day'
  }
  if (days === 1) return '1 day'
  return `${days} days`
}
