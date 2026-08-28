import { apiGetData } from './axios-client'
import type {
  MonthlyAttendanceCutOff,
  MonthlyAttendanceReport,
} from './types'

/** Backend cap on `emp_ids` for GET /admin/reports/monthly-attendance. */
export const MONTHLY_ATTENDANCE_MAX_EMP_IDS = 200

export type ListMonthlyAttendanceParams = {
  month: string
  cut_off: MonthlyAttendanceCutOff
  emp_ids: number[]
  group_id?: number
}

function serializeParams(
  params: ListMonthlyAttendanceParams,
): Record<string, string | number> {
  const out: Record<string, string | number> = {
    month: params.month,
    cut_off: params.cut_off,
    emp_ids: params.emp_ids.join(','),
  }
  if (params.group_id != null) out.group_id = params.group_id
  return out
}

/** GET /admin/reports/monthly-attendance — confirmed-leave day matrix (admin only). */
export async function getMonthlyAttendanceReport(
  params: ListMonthlyAttendanceParams,
): Promise<MonthlyAttendanceReport> {
  return apiGetData<MonthlyAttendanceReport>(
    '/admin/reports/monthly-attendance',
    { params: serializeParams(params) },
  )
}
