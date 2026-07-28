/**
 * TODO(REPLACE): Team Leave Calendar data for Approver monitoring.
 * Only APPROVED leaves are shown (Confirmed === Approved).
 */
import type { LeaveRequestStatus } from '../constants/leaveStatus'
import { addDaysIso } from '../utils/teamCalendarGrid'
import { MOCK_DATA_ENABLED } from './config'
import { MOCK_GROUP } from './leaveRequests'

export type TeamCalendarEntry = {
  id: string
  employeeName: string
  employeeNumber: string
  groupLabel: string
  leaveType: string
  startDate: string
  endDate: string
  periodLabel: string
  duration: string
  status: LeaveRequestStatus
}

export function getLeaveTypeChipClasses(leaveType: string): string {
  switch (leaveType) {
    case 'Vacation Leave':
      return 'border-l-leave-vacation bg-leave-vacation/15'
    case 'Sick Leave':
      return 'border-l-leave-sick bg-leave-sick/15'
    case 'Emergency Leave':
      return 'border-l-leave-emergency bg-leave-emergency/20'
    case 'PTB Leave':
      return 'border-l-leave-ptb bg-leave-ptb/15'
    case 'Maternity Leave':
      return 'border-l-leave-maternity bg-leave-maternity/15'
    case 'Paternity Leave':
      return 'border-l-leave-paternity bg-leave-paternity/15'
    default:
      return 'border-l-primary bg-primary/10'
  }
}

const TEAM_CALENDAR_ENTRIES: TeamCalendarEntry[] = [
  {
    id: 'org-sally-1',
    employeeName: 'Sally Bautista',
    employeeNumber: '812',
    groupLabel: MOCK_GROUP.label,
    leaveType: 'Vacation Leave',
    startDate: '2026-07-13',
    endDate: '2026-07-13',
    periodLabel: 'Jul 13, 2026',
    duration: '1 day',
    status: 'APPROVED',
  },
  {
    id: 'org-emman-1',
    employeeName: 'Emman De Leon',
    employeeNumber: '813',
    groupLabel: MOCK_GROUP.label,
    leaveType: 'Vacation Leave',
    startDate: '2026-07-15',
    endDate: '2026-07-17',
    periodLabel: 'Jul 15–17, 2026',
    duration: '3 days',
    status: 'APPROVED',
  },
  {
    id: 'emp-1',
    employeeName: MOCK_GROUP.employee.name,
    employeeNumber: MOCK_GROUP.employee.employeeNumber,
    groupLabel: MOCK_GROUP.label,
    leaveType: 'Vacation Leave',
    startDate: '2026-07-20',
    endDate: '2026-07-22',
    periodLabel: 'Jul 20–22, 2026',
    duration: '3 days',
    status: 'APPROVED',
  },
  {
    id: 'org-taylor-1',
    employeeName: 'Taylor Cruz',
    employeeNumber: '808',
    groupLabel: 'IT',
    leaveType: 'Emergency Leave',
    startDate: '2026-07-24',
    endDate: '2026-07-24',
    periodLabel: 'Jul 24, 2026',
    duration: '1 day',
    status: 'APPROVED',
  },
  {
    id: 'apr-2',
    employeeName: 'Jordan Approver',
    employeeNumber: '802',
    groupLabel: MOCK_GROUP.label,
    leaveType: 'Paternity Leave',
    startDate: '2026-07-20',
    endDate: '2026-07-28',
    periodLabel: 'Jul 20–28, 2026',
    duration: '7 days',
    status: 'APPROVED',
  },
]

export function getTeamCalendarEntries(
  _approverUserId: string,
): TeamCalendarEntry[] {
  void _approverUserId
  if (!MOCK_DATA_ENABLED) return []
  return TEAM_CALENDAR_ENTRIES.filter((entry) => entry.status === 'APPROVED')
}

export function isCalendarVisibleStatus(status: LeaveRequestStatus): boolean {
  return status === 'APPROVED'
}

export function entryCoversDate(
  entry: TeamCalendarEntry,
  isoDate: string,
): boolean {
  return entry.startDate <= isoDate && isoDate <= entry.endDate
}

export function getEntriesOnDate(
  entries: TeamCalendarEntry[],
  isoDate: string,
): TeamCalendarEntry[] {
  return entries.filter(
    (entry) =>
      isCalendarVisibleStatus(entry.status) && entryCoversDate(entry, isoDate),
  )
}

export function getUpcomingApprovedLeaves(
  entries: TeamCalendarEntry[],
  todayIso: string,
): TeamCalendarEntry[] {
  const tomorrowIso = addDaysIso(todayIso, 1)

  return entries
    .filter(
      (entry) =>
        entry.status === 'APPROVED' && entry.startDate >= tomorrowIso,
    )
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
}

export function filterCalendarEntries(
  entries: TeamCalendarEntry[],
  filters: { leaveType: string; group: string },
): TeamCalendarEntry[] {
  return entries.filter((entry) => {
    const matchesType =
      filters.leaveType === 'ALL' || entry.leaveType === filters.leaveType
    const matchesGroup =
      filters.group === 'ALL' || entry.groupLabel === filters.group
    return matchesType && matchesGroup
  })
}
