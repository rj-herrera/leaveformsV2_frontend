import { toLocalISODate } from './leaveDates'

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const

export type CalendarDayCell = {
  date: Date
  iso: string
  dayOfMonth: number
  inMonth: boolean
  isToday: boolean
}

function parseLocalISO(iso: string): Date {
  return new Date(`${iso}T00:00:00`)
}

export function addDaysIso(iso: string, days: number): string {
  const date = parseLocalISO(iso)
  date.setDate(date.getDate() + days)
  return toLocalISODate(date)
}

/** Monday of the week containing `iso` (local). */
export function startOfWeekMonday(iso: string): string {
  const date = parseLocalISO(iso)
  const dow = date.getDay()
  const offsetToMonday = dow === 0 ? -6 : 1 - dow
  date.setDate(date.getDate() + offsetToMonday)
  return toLocalISODate(date)
}

function toCell(
  date: Date,
  todayIso: string,
  focusMonthIndex: number | null,
): CalendarDayCell {
  const iso = toLocalISODate(date)
  return {
    date,
    iso,
    dayOfMonth: date.getDate(),
    inMonth:
      focusMonthIndex === null ? true : date.getMonth() === focusMonthIndex,
    isToday: iso === todayIso,
  }
}

/**
 * Builds Mon–Fri week rows for a month (weekends omitted).
 * Cells outside the viewed month keep their date but `inMonth: false`.
 */
export function getMonthWeekdayWeeks(
  year: number,
  monthIndex: number,
  todayIso: string,
): CalendarDayCell[][] {
  const firstOfMonth = new Date(year, monthIndex, 1)
  const lastOfMonth = new Date(year, monthIndex + 1, 0)

  const start = new Date(firstOfMonth)
  const dow = start.getDay()
  const offsetToMonday = dow === 0 ? -6 : 1 - dow
  start.setDate(start.getDate() + offsetToMonday)

  const weeks: CalendarDayCell[][] = []
  const cursor = new Date(start)

  while (cursor <= lastOfMonth || weeks.length === 0) {
    const week: CalendarDayCell[] = []
    for (let col = 0; col < 5; col += 1) {
      week.push(toCell(new Date(cursor), todayIso, monthIndex))
      cursor.setDate(cursor.getDate() + 1)
    }
    cursor.setDate(cursor.getDate() + 2)

    if (week.some((cell) => cell.inMonth)) {
      weeks.push(week)
    } else if (weeks.length > 0) {
      break
    }
  }

  return weeks
}

/** Single Mon–Fri week starting at `mondayIso`. */
export function getWeekdayWeek(
  mondayIso: string,
  todayIso: string,
): CalendarDayCell[] {
  const monday = parseLocalISO(mondayIso)
  const week: CalendarDayCell[] = []
  for (let col = 0; col < 5; col += 1) {
    const date = new Date(monday)
    date.setDate(monday.getDate() + col)
    week.push(toCell(date, todayIso, null))
  }
  return week
}

export function formatMonthYearLabel(year: number, monthIndex: number): string {
  return new Date(year, monthIndex, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

export function formatLongDateLabel(iso: string): string {
  const date = parseLocalISO(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatWeekRangeLabel(mondayIso: string): string {
  const start = parseLocalISO(mondayIso)
  const end = parseLocalISO(addDaysIso(mondayIso, 4))
  const startMonth = start.toLocaleDateString('en-US', { month: 'short' })
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' })
  const year = end.getFullYear()

  if (start.getMonth() === end.getMonth()) {
    return `${startMonth} ${start.getDate()}–${end.getDate()}, ${year}`
  }
  return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}, ${year}`
}

/** Nearby months for the month selector (±12 months from today). */
export function getMonthSelectOptions(
  around: Date = new Date(),
): { value: string; label: string; year: number; monthIndex: number }[] {
  const options: {
    value: string
    label: string
    year: number
    monthIndex: number
  }[] = []

  for (let offset = -12; offset <= 12; offset += 1) {
    const date = new Date(around.getFullYear(), around.getMonth() + offset, 1)
    const year = date.getFullYear()
    const monthIndex = date.getMonth()
    options.push({
      value: `${year}-${String(monthIndex + 1).padStart(2, '0')}`,
      label: formatMonthYearLabel(year, monthIndex),
      year,
      monthIndex,
    })
  }

  return options
}

export function parseMonthValue(value: string): {
  year: number
  monthIndex: number
} | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value)
  if (!match) return null
  const year = Number(match[1])
  const monthIndex = Number(match[2]) - 1
  if (monthIndex < 0 || monthIndex > 11) return null
  return { year, monthIndex }
}

export function monthValue(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`
}

/** Inclusive `from`/`to` covering every cell in a weekday grid. */
export function rangeFromCells(
  cells: CalendarDayCell[] | CalendarDayCell[][],
): { from: string; to: string } | null {
  const flat = Array.isArray(cells[0])
    ? (cells as CalendarDayCell[][]).flat()
    : (cells as CalendarDayCell[])
  if (flat.length === 0) return null
  return { from: flat[0].iso, to: flat[flat.length - 1].iso }
}

/** Index calendar bars by workday ISO so cells paint from `dates[]`. */
export function indexCalendarEntriesByDate<T extends { dates: string[] }>(
  entries: T[],
): Map<string, T[]> {
  const byDate = new Map<string, T[]>()
  for (const entry of entries) {
    for (const iso of entry.dates) {
      const list = byDate.get(iso)
      if (list) list.push(entry)
      else byDate.set(iso, [entry])
    }
  }
  return byDate
}
