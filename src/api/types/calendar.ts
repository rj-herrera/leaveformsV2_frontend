import type { DayType, LeaveStatus } from './enums'
import type { LeaveOrgRef, LeaveTypeRef } from './leave'

/** Slim employee nest on GET /team/calendar. */
export type TeamCalendarEmployee = {
  id: number
  employee_number: string
  name: string | null
  group: LeaveOrgRef | null
}

/** Calendar bar from GET /team/calendar (`TeamCalendarResource`). */
export type TeamCalendarEntry = {
  id: number
  status: LeaveStatus
  /** Full leave duration (not clipped to query window). Half-day is `"0.50"`. */
  duration: string
  day_type: DayType
  start_date: string
  end_date: string
  /** Workdays the person is out, already clipped to `from`–`to`. */
  dates: string[]
  leave_type: LeaveTypeRef
  employee: TeamCalendarEmployee | null
}
