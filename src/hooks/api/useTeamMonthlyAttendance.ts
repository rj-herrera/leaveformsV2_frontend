import useSWR from 'swr'
import type { ListMonthlyAttendanceParams } from '../../api/adminMonthlyAttendance'
import {
  getTeamMonthlyAttendanceReport,
  listTeamMonthlyAttendanceEmployees,
  type ListTeamMonthlyAttendanceEmployeesParams,
} from '../../api/teamMonthlyAttendance'
import { swrKeys } from './swrKeys'

/**
 * Page → hook → `api/teamMonthlyAttendance` for GET /team/reports/monthly-attendance.
 * Pass `null` to skip (admin page, no employees selected, or invalid month).
 */
export function useTeamMonthlyAttendance(
  params: ListMonthlyAttendanceParams | null,
) {
  return useSWR(
    params == null ? null : swrKeys.teamMonthlyAttendance(params),
    params == null ? null : () => getTeamMonthlyAttendanceReport(params),
  )
}

/**
 * Picker rows for the team attendance report.
 * Pass `null` to skip. Omit `group_id` for the viewer's full scope.
 */
export function useTeamMonthlyAttendanceEmployees(
  params: ListTeamMonthlyAttendanceEmployeesParams | null,
) {
  return useSWR(
    params == null ? null : swrKeys.teamMonthlyAttendanceEmployees(params),
    params == null ? null : () => listTeamMonthlyAttendanceEmployees(params),
  )
}
