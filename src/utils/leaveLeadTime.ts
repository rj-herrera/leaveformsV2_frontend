import type { DayType } from './leaveDates'
import { toLocalISODate } from './leaveDates'

export type LeaveLeadTimeInput = {
  dayType: DayType
  /**
   * Full-day duration using the leave type’s day basis
   * (calendar days for Maternity; working days otherwise).
   */
  weekdayDuration: number
  startDateISO: string
  /** Filing date in ISO (YYYY-MM-DD), typically today on submit */
  filedOnISO: string
}

export type LeaveLeadTimeResult = {
  ok: boolean
  /** True when duration is 3+ full days under the leave type’s counting rules. */
  isLongLeave: boolean
  message: string | null
}

export const LEAVE_LEAD_TIME_MESSAGE =
  'Leave requests of 3 or more consecutive days must be filed at least 1 month before the leave start date.'

export const LEAVE_LEAD_TIME_APPROVER_HINT =
  'Ask your approver to file this request for you using File Leave for Member. Or choose a start date at least 1 month from today, or shorten the leave duration.'

export const ON_BEHALF_SHORT_NOTICE_MESSAGE =
  'Short-notice Vacation Leave of 3 or more days is allowed here because you are filing for a team member. A regular employee cannot file this on File Leave.'

/** Calendar-month add on a local ISO date (handles month-end overflow). */
export function addCalendarMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const dayOfMonth = date.getDate()
  date.setMonth(date.getMonth() + months)
  if (date.getDate() !== dayOfMonth) {
    date.setDate(0)
  }
  return toLocalISODate(date)
}

/**
 * Full-day leave of 3+ consecutive days (calendar for Maternity,
 * working days otherwise) requires filing at least 1 calendar month
 * before the leave start date.
 */
export function validateLeaveLeadTime(
  input: LeaveLeadTimeInput,
): LeaveLeadTimeResult {
  if (input.dayType !== 'full') {
    return { ok: true, isLongLeave: false, message: null }
  }
  if (input.weekdayDuration < 3) {
    return { ok: true, isLongLeave: false, message: null }
  }

  const isLongLeave = true

  if (!input.startDateISO || !input.filedOnISO) {
    return {
      ok: true,
      isLongLeave,
      message: LEAVE_LEAD_TIME_MESSAGE,
    }
  }

  const earliestAllowedStart = addCalendarMonths(input.filedOnISO, 1)
  if (input.startDateISO < earliestAllowedStart) {
    return {
      ok: false,
      isLongLeave,
      message: LEAVE_LEAD_TIME_MESSAGE,
    }
  }

  return {
    ok: true,
    isLongLeave,
    message: LEAVE_LEAD_TIME_MESSAGE,
  }
}
