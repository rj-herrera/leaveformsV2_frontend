import type { DayType } from './leaveDates'
import { isWorkingDay, toLocalISODate } from './leaveDates'

/** Matches `leave.vacation_leave.notice_threshold_days`. */
export const VL_NOTICE_THRESHOLD_DAYS = 3
/** Matches `leave.vacation_leave.exact_notice_workdays`. */
export const VL_NOTICE_EXACT_WORKDAYS = 3
/** Matches `leave.vacation_leave.long_notice_calendar_days`. */
export const VL_NOTICE_LONG_CALENDAR_DAYS = 30

export type VlNoticeKind = 'exact_3' | 'long'

export type LeaveLeadTimeInput = {
  dayType: DayType
  /** Full-day VL duration in workdays (weekends/holidays skipped). */
  weekdayDuration: number
  startDateISO: string
  /** Filing date in ISO (YYYY-MM-DD), typically today on submit */
  filedOnISO: string
  /** Non-working holidays from `GET /holidays` — used for the 3-workday window. */
  nonWorkingDates?: ReadonlySet<string>
}

export type LeaveLeadTimeResult = {
  ok: boolean
  /** True when exactly-3 or 4+ full-day VL notice applies. */
  gated: boolean
  kind: VlNoticeKind | null
  title: string | null
  message: string | null
}

export const VL_NOTICE_EXACT_3_MESSAGE =
  'Leave requests of 3 consecutive working days must be filed at least 3 working days before the leave start date.'

export const VL_NOTICE_LONG_MESSAGE =
  'Leave requests longer than 3 consecutive working days must be filed at least 30 calendar days before the leave start date.'

export const LEAVE_LEAD_TIME_UNGATED: LeaveLeadTimeResult = {
  ok: true,
  gated: false,
  kind: null,
  title: null,
  message: null,
}

function parseLocalISO(iso: string): Date | null {
  if (!iso) return null
  const date = new Date(`${iso}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

/** Add calendar days on a local ISO date (not a calendar-month add). */
export function addCalendarDays(iso: string, days: number): string {
  const date = parseLocalISO(iso)
  if (!date) return iso
  date.setDate(date.getDate() + days)
  return toLocalISODate(date)
}

/**
 * Add working days after `iso` (does not count `iso` itself).
 * Weekends and configured non-working holidays are skipped.
 */
export function addWorkingDays(
  iso: string,
  days: number,
  nonWorkingDates?: ReadonlySet<string>,
): string {
  const date = parseLocalISO(iso)
  if (!date || days < 1) return iso

  let added = 0
  let guard = 0
  const limit = Math.max(days * 14, 60)

  while (added < days && guard < limit) {
    date.setDate(date.getDate() + 1)
    guard += 1
    if (isWorkingDay(date, nonWorkingDates)) added += 1
  }

  return toLocalISODate(date)
}

function noticeTitle(kind: VlNoticeKind, ok: boolean): string {
  if (!ok) return 'Filing not allowed'
  if (kind === 'exact_3') return 'Advance filing required (3 working days)'
  return 'Advance filing required (30 calendar days)'
}

function noticeMessage(kind: VlNoticeKind): string {
  return kind === 'exact_3'
    ? VL_NOTICE_EXACT_3_MESSAGE
    : VL_NOTICE_LONG_MESSAGE
}

function gatedResult(kind: VlNoticeKind, ok: boolean): LeaveLeadTimeResult {
  return {
    ok,
    gated: true,
    kind,
    title: noticeTitle(kind, ok),
    message: noticeMessage(kind),
  }
}

/**
 * Self-filed VL advance notice (Asia/Manila / local filing date).
 * Half-day and 1–2 workdays are not gated (same-day / late filing allowed).
 * Exactly 3.00 workdays: start ≥ today + 3 working days.
 * More than 3.00 workdays: start ≥ today + 30 calendar days.
 */
export function validateLeaveLeadTime(
  input: LeaveLeadTimeInput,
): LeaveLeadTimeResult {
  if (input.dayType !== 'full') return LEAVE_LEAD_TIME_UNGATED

  const durationHundredths = Math.round(input.weekdayDuration * 100)
  const thresholdHundredths = VL_NOTICE_THRESHOLD_DAYS * 100
  if (durationHundredths < thresholdHundredths) {
    return LEAVE_LEAD_TIME_UNGATED
  }

  const kind: VlNoticeKind =
    durationHundredths === thresholdHundredths ? 'exact_3' : 'long'

  if (!input.startDateISO || !input.filedOnISO) {
    return gatedResult(kind, true)
  }

  const earliestAllowedStart =
    kind === 'exact_3'
      ? addWorkingDays(
          input.filedOnISO,
          VL_NOTICE_EXACT_WORKDAYS,
          input.nonWorkingDates,
        )
      : addCalendarDays(input.filedOnISO, VL_NOTICE_LONG_CALENDAR_DAYS)

  const ok = input.startDateISO >= earliestAllowedStart
  return gatedResult(kind, ok)
}
