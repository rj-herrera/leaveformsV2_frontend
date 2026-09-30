import type { DayType } from './leaveDates'
import { toLocalISODate } from './leaveDates'

/** Matches `leave.vacation_leave.notice_threshold_days`. */
export const VL_NOTICE_THRESHOLD_DAYS = 3
/** Matches `leave.vacation_leave.long_notice_calendar_days`. */
export const VL_NOTICE_LONG_CALENDAR_DAYS = 30

export type VlNoticeKind = 'long'

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
  /** True when 3+ full-day VL notice applies. */
  gated: boolean
  kind: VlNoticeKind | null
  title: string | null
  message: string | null
}

export const VL_NOTICE_LONG_MESSAGE =
  'Leave requests of 3 or more consecutive working days must be filed at least 30 calendar days before the leave start date.'

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

function gatedResult(ok: boolean): LeaveLeadTimeResult {
  return {
    ok,
    gated: true,
    kind: 'long',
    title: ok
      ? 'Advance filing required (30 calendar days)'
      : 'Filing not allowed',
    message: VL_NOTICE_LONG_MESSAGE,
  }
}

/**
 * Self-filed VL advance notice (Asia/Manila / local filing date).
 * Half-day and 1–2 workdays are not gated (same-day / late filing allowed).
 * 3.00 or more workdays: start ≥ today + 30 calendar days.
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

  if (!input.startDateISO || !input.filedOnISO) {
    return gatedResult(true)
  }

  const earliestAllowedStart = addCalendarDays(
    input.filedOnISO,
    VL_NOTICE_LONG_CALENDAR_DAYS,
  )
  const ok = input.startDateISO >= earliestAllowedStart
  return gatedResult(ok)
}
