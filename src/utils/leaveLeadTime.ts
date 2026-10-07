import type { DayType } from './leaveDates'
import { toLocalISODate } from './leaveDates'

/** Matches `leave.vacation_leave.notice_threshold_days` (3.00 inclusive). */
export const VL_NOTICE_THRESHOLD_DAYS = 3
/** 4.00 workdays and above use the long notice window. */
export const VL_NOTICE_LONG_THRESHOLD_DAYS = 4
/** 3.00 up to but not including 4.00 workdays. */
export const VL_NOTICE_SHORT_CALENDAR_DAYS = 7
/** Matches `leave.vacation_leave.long_notice_calendar_days`. */
export const VL_NOTICE_LONG_CALENDAR_DAYS = 30

export type VlNoticeKind = 'short' | 'long'

export type LeaveLeadTimeInput = {
  dayType: DayType
  /** Full-day VL duration in workdays (weekends/holidays skipped). */
  weekdayDuration: number
  startDateISO: string
  /** Filing date in ISO (YYYY-MM-DD), typically today on submit */
  filedOnISO: string
}

export type LeaveLeadTimeResult = {
  ok: boolean
  /** True when a self-filed VL advance-notice window applies. */
  gated: boolean
  kind: VlNoticeKind | null
  title: string | null
  message: string | null
}

export const VL_NOTICE_SHORT_MESSAGE =
  'Leave requests of 3 working days must be filed at least 7 calendar days before the leave start date.'

export const VL_NOTICE_LONG_MESSAGE =
  'Leave requests of 4 or more working days must be filed at least 30 calendar days before the leave start date.'

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

function noticeKind(durationHundredths: number): VlNoticeKind | null {
  const shortHundredths = VL_NOTICE_THRESHOLD_DAYS * 100
  const longHundredths = VL_NOTICE_LONG_THRESHOLD_DAYS * 100
  if (durationHundredths >= longHundredths) return 'long'
  if (durationHundredths >= shortHundredths) return 'short'
  return null
}

function gatedResult(kind: VlNoticeKind, ok: boolean): LeaveLeadTimeResult {
  const short = kind === 'short'
  return {
    ok,
    gated: true,
    kind,
    title: ok
      ? short
        ? 'Advance filing required (7 calendar days)'
        : 'Advance filing required (30 calendar days)'
      : 'Filing not allowed',
    message: short ? VL_NOTICE_SHORT_MESSAGE : VL_NOTICE_LONG_MESSAGE,
  }
}

/**
 * Self-filed VL advance notice (Asia/Manila / local filing date).
 * Half-day and under 3.00 workdays are not gated (same-day / late filing allowed).
 * 3.00 up to but not including 4.00 workdays: start ≥ today + 7 calendar days.
 * 4.00 or more workdays: start ≥ today + 30 calendar days.
 */
export function validateLeaveLeadTime(
  input: LeaveLeadTimeInput,
): LeaveLeadTimeResult {
  if (input.dayType !== 'full') return LEAVE_LEAD_TIME_UNGATED

  const kind = noticeKind(Math.round(input.weekdayDuration * 100))
  if (!kind) return LEAVE_LEAD_TIME_UNGATED

  if (!input.startDateISO || !input.filedOnISO) {
    return gatedResult(kind, true)
  }

  const noticeDays =
    kind === 'short'
      ? VL_NOTICE_SHORT_CALENDAR_DAYS
      : VL_NOTICE_LONG_CALENDAR_DAYS
  const earliestAllowedStart = addCalendarDays(input.filedOnISO, noticeDays)
  const ok = input.startDateISO >= earliestAllowedStart
  return gatedResult(kind, ok)
}
