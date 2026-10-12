import { apiGetData, apiGetList } from './axios-client'
import type { ListMonthlyAttendanceParams } from './adminMonthlyAttendance'
import type { AdminEmployeeRef, MonthlyAttendanceReport } from './types'

export type ListTeamMonthlyAttendanceEmployeesParams = {
  /** Omit for every employee in the viewer's scope. Ignored for the president. */
  group_id?: number
}

function serializeReportParams(
  params: ListMonthlyAttendanceParams,
): Record<string, string | number> {
  const out: Record<string, string | number> = {
    month: params.month,
    cut_off: params.cut_off,
  }
  if (params.emp_ids != null && params.emp_ids.length > 0) {
    out.emp_ids = params.emp_ids.join(',')
  }
  if (params.group_id != null) out.group_id = params.group_id
  return out
}

/** GET /team/reports/monthly-attendance — confirmed-leave day matrix for the viewer's team. */
export async function getTeamMonthlyAttendanceReport(
  params: ListMonthlyAttendanceParams,
): Promise<MonthlyAttendanceReport> {
  return apiGetData<MonthlyAttendanceReport>(
    '/team/reports/monthly-attendance',
    { params: serializeReportParams(params) },
  )
}

/** GET /team/reports/monthly-attendance/employees — picker rows in the viewer's scope. */
export async function listTeamMonthlyAttendanceEmployees(
  params?: ListTeamMonthlyAttendanceEmployeesParams,
): Promise<AdminEmployeeRef[]> {
  const query: Record<string, number> = {}
  if (params?.group_id != null) query.group_id = params.group_id

  const { data } = await apiGetList<AdminEmployeeRef>(
    '/team/reports/monthly-attendance/employees',
    { params: Object.keys(query).length > 0 ? query : undefined },
  )
  return data
}
