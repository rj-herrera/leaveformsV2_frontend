import { apiGetData } from './axios-client'
import type { EmployeesWithLwopReport } from './types'

export type ListEmployeesWithLwopParams = {
  year: number
  group_id?: number
}

/** GET /admin/reports/employees-with-lwop — VL/SL/LL unpaid days (admin only). */
export async function getEmployeesWithLwop(
  params: ListEmployeesWithLwopParams,
): Promise<EmployeesWithLwopReport> {
  return apiGetData<EmployeesWithLwopReport>(
    '/admin/reports/employees-with-lwop',
    {
      params: {
        year: params.year,
        ...(params.group_id != null ? { group_id: params.group_id } : {}),
      },
    },
  )
}
