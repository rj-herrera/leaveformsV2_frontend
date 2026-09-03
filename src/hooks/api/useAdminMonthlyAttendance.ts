import useSWR from 'swr'
import {
  getMonthlyAttendanceReport,
  type ListMonthlyAttendanceParams,
} from '../../api/adminMonthlyAttendance'
import { swrKeys } from './swrKeys'

/**
 * Page → hook → `api/adminMonthlyAttendance` for GET /admin/reports/monthly-attendance.
 * Pass `null` to skip (no employees selected, or invalid month).
 * Omit `emp_ids` when every employee in the current list is selected.
 */
export function useAdminMonthlyAttendance(
  params: ListMonthlyAttendanceParams | null,
) {
  return useSWR(
    params == null ? null : swrKeys.adminMonthlyAttendance(params),
    params == null ? null : () => getMonthlyAttendanceReport(params),
  )
}
