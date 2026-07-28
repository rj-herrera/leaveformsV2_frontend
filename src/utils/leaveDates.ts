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

export function formatDurationLabel(days: number, dayType: DayType): string {
  if (dayType === 'half_am' || dayType === 'half_pm') {
    return '0.5 day'
  }
  if (days === 1) return '1 day'
  return `${days} days`
}
