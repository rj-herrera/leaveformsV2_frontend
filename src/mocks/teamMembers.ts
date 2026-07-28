/**
 * TODO(REPLACE): Team members + official leave balances for File Leave for Member.
 */
import type { UserGender } from '../auth/AuthContext'
import {
  SICK_LEAVE_THEME,
  VACATION_LEAVE_THEME,
} from '../constants/leaveTypeTheme'
import { MOCK_DATA_ENABLED } from './config'
import { MOCK_GROUP } from './leaveRequests'

export type TeamMember = {
  id: string
  name: string
  employeeNumber: string
  gender: UserGender
}

export type EmployeeLeaveBalances = Record<string, number>

const TEAM_MEMBERS: TeamMember[] = [
  {
    id: MOCK_GROUP.employee.id,
    name: MOCK_GROUP.employee.name,
    employeeNumber: MOCK_GROUP.employee.employeeNumber,
    gender: 'female',
  },
  {
    id: 'user-employee-2',
    name: 'Sam Rivera',
    employeeNumber: '807',
    gender: 'male',
  },
  {
    id: 'user-employee-3',
    name: 'Taylor Cruz',
    employeeNumber: '808',
    gender: 'female',
  },
]

const EMPLOYEE_BALANCES: Record<string, EmployeeLeaveBalances> = {
  [MOCK_GROUP.employee.id]: {
    [VACATION_LEAVE_THEME.label]: 12,
    [SICK_LEAVE_THEME.label]: 8,
    'Emergency Leave': 3,
    'PTB Leave': 7,
    'Maternity Leave': 105,
    'Paternity Leave': 0,
  },
  'user-employee-2': {
    [VACATION_LEAVE_THEME.label]: 5,
    [SICK_LEAVE_THEME.label]: 10,
    'Emergency Leave': 2,
    'PTB Leave': 7,
    'Maternity Leave': 0,
    'Paternity Leave': 7,
  },
  'user-employee-3': {
    [VACATION_LEAVE_THEME.label]: 1,
    [SICK_LEAVE_THEME.label]: 4,
    'Emergency Leave': 0,
    'PTB Leave': 3,
    'Maternity Leave': 60,
    'Paternity Leave': 0,
  },
}

export function getTeamMembersForApprover(
  _approverUserId: string,
): TeamMember[] {
  void _approverUserId
  if (!MOCK_DATA_ENABLED) return []
  return [...TEAM_MEMBERS]
}

export function getTeamMemberById(employeeId: string): TeamMember | null {
  if (!MOCK_DATA_ENABLED) return null
  return TEAM_MEMBERS.find((member) => member.id === employeeId) ?? null
}

export function getEmployeeLeaveBalances(
  employeeId: string,
): EmployeeLeaveBalances {
  if (!MOCK_DATA_ENABLED) return {}
  return EMPLOYEE_BALANCES[employeeId] ?? {}
}

export function getRemainingLeaveDays(
  employeeId: string,
  leaveType: string,
): number {
  if (!employeeId || !leaveType) return 0
  const balances = getEmployeeLeaveBalances(employeeId)
  return balances[leaveType] ?? 0
}

export function getRemainingLeaveLabel(
  employeeId: string,
  leaveType: string,
): string {
  if (!employeeId || !leaveType) return '0 day(s)'
  const days = getRemainingLeaveDays(employeeId, leaveType)
  return `${days} day(s)`
}

export type ProxyLeaveSubmission = {
  filedOnBehalfOf: {
    id: string
    name: string
    employeeNumber: string
  }
  filedBy: {
    id: string
    name: string
  }
  submittedAt: string
  leaveType: string
  dayType: string
  startDate: string
  endDate: string
  duration: string
  remainingLeave: string
  reason: string
  attachmentFileName: string | null
}

const proxySubmissions: ProxyLeaveSubmission[] = []

export function submitProxyLeaveRequest(
  payload: ProxyLeaveSubmission,
): ProxyLeaveSubmission {
  proxySubmissions.unshift(payload)
  return payload
}

export function getProxyLeaveSubmissions(): ProxyLeaveSubmission[] {
  return [...proxySubmissions]
}
